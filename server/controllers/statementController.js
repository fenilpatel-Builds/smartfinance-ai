import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Statement from '../models/Statement.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import CategorizationRule from '../models/CategorizationRule.js';
import { requestPythonExtraction } from '../services/pythonConnector.js';
import { recalculateBankAccountBalance, detectInternalTransfers } from '../services/financialEngine.js';
import { logAudit } from '../utils/auditLogger.js';

export const uploadStatement = async (req, res, next) => {
  try {
    const { bankAccountId, customMapping } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Please upload a bank statement document' });
    }

    if (!bankAccountId) {
      return res.status(400).json({ success: false, message: 'Bank account selection is required' });
    }

    const bankAccount = await BankAccount.findOne({
      _id: bankAccountId,
      workspaceId: req.workspace._id,
    });

    if (!bankAccount) {
      return res.status(404).json({ success: false, message: 'Selected bank account was not found' });
    }

    // Calculate file hash to check duplicates
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const existingStatement = await Statement.findOne({
      workspaceId: req.workspace._id,
      bankAccountId,
      fileHash,
      processingStatus: 'IMPORTED',
    });

    if (existingStatement) {
      return res.status(409).json({
        success: false,
        message: `This exact statement (${file.originalname}) was already imported on ${new Date(
          existingStatement.createdAt
        ).toLocaleDateString()}. Duplicate uploads are prevented.`,
      });
    }

    const statement = await Statement.create({
      workspaceId: req.workspace._id,
      bankAccountId,
      originalFileName: file.originalname,
      storedFilePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileHash,
      processingStatus: 'PARSING',
      processingJobId: crypto.randomUUID(),
    });

    // Call Python extraction engine
    let parsedData = null;
    let parsedMapping = null;
    if (customMapping) {
      try {
        parsedMapping = typeof customMapping === 'string' ? JSON.parse(customMapping) : customMapping;
      } catch (e) {}
    }

    try {
      const absolutePath = path.resolve(file.path);
      parsedData = await requestPythonExtraction(absolutePath, parsedMapping, statement.processingJobId);
      
      statement.extractedDataCache = parsedData;
      statement.processingStatus = 'PREVIEW_READY';
      statement.extractedTransactionCount = parsedData.transactions?.length || 0;
      statement.openingBalance = parsedData.summary?.openingBalance || 0;
      statement.closingBalance = parsedData.summary?.closingBalance || 0;
      statement.columnMappingRequired = !!parsedData.columnMappingRequired;
      statement.availableHeaders = parsedData.availableHeaders || [];
      statement.processingWarnings = parsedData.validation?.warnings || [];
      statement.processingErrors = parsedData.validation?.errors || [];

      if (parsedData.statementPeriod?.start) {
        statement.statementPeriodStart = new Date(parsedData.statementPeriod.start);
      }
      if (parsedData.statementPeriod?.end) {
        statement.statementPeriodEnd = new Date(parsedData.statementPeriod.end);
      }

      await statement.save();
    } catch (extractErr) {
      statement.processingStatus = 'FAILED';
      statement.processingErrors = [extractErr.message];
      await statement.save();

      return res.status(422).json({
        success: false,
        message: `Statement extraction error: ${extractErr.message}`,
        statementId: statement._id,
      });
    }

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'STATEMENT_UPLOADED',
      entityType: 'Statement',
      entityId: statement._id,
      metadata: { originalFileName: file.originalname, transactionsFound: statement.extractedTransactionCount },
    });

    res.status(201).json({
      success: true,
      message: 'Statement successfully processed. Please review the extracted preview.',
      statement: {
        id: statement._id,
        originalFileName: statement.originalFileName,
        processingStatus: statement.processingStatus,
        columnMappingRequired: statement.columnMappingRequired,
        availableHeaders: statement.availableHeaders,
        summary: parsedData.summary,
        detectedBank: parsedData.detectedBank,
        extractedTransactions: parsedData.transactions || [],
        validation: parsedData.validation,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getStatementPreview = async (req, res, next) => {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    }).populate('bankAccountId');

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    res.json({
      success: true,
      statement: {
        id: statement._id,
        originalFileName: statement.originalFileName,
        bankAccount: statement.bankAccountId,
        processingStatus: statement.processingStatus,
        columnMappingRequired: statement.columnMappingRequired,
        availableHeaders: statement.availableHeaders,
        warnings: statement.processingWarnings,
        errors: statement.processingErrors,
        extractedData: statement.extractedDataCache,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const confirmImport = async (req, res, next) => {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    if (statement.processingStatus === 'IMPORTED') {
      return res.status(400).json({ success: false, message: 'Statement has already been imported' });
    }

    // Transactions can be provided in request body (after user reviewed and modified preview) or taken from cache
    const transactionsToImport = req.body.transactions || statement.extractedDataCache?.transactions || [];

    if (!transactionsToImport || transactionsToImport.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid transactions found to import' });
    }

    // Fetch user rules for categorization
    const rules = await CategorizationRule.find({
      workspaceId: req.workspace._id,
      isActive: true,
    }).sort({ priority: -1 });

    const categories = await Category.find({ workspaceId: req.workspace._id });
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c._id]));

    const batchId = `BATCH-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const documentsToInsert = [];

    for (const item of transactionsToImport) {
      if (item.isDuplicate && !req.body.includeDuplicates) {
        continue;
      }

      let categoryId = null;
      let categoryName = item.category || 'Uncategorized';
      let categorizationSource = 'default';

      // 1. Check user categorization rules
      for (const rule of rules) {
        let matched = true;
        for (const cond of rule.matchingConditions) {
          const testVal = (item[cond.field] || item.description || '').toLowerCase();
          const targetVal = (cond.value || '').toLowerCase();

          if (cond.operator === 'contains' && !testVal.includes(targetVal)) matched = false;
          if (cond.operator === 'equals' && testVal !== targetVal) matched = false;
          if (cond.operator === 'startsWith' && !testVal.startsWith(targetVal)) matched = false;
          if (cond.operator === 'greaterThan' && parseFloat(item.amount) <= parseFloat(targetVal)) matched = false;
          if (cond.operator === 'lessThan' && parseFloat(item.amount) >= parseFloat(targetVal)) matched = false;
        }

        if (matched) {
          categoryId = rule.targetCategoryId;
          categoryName = rule.targetCategoryName || categoryName;
          categorizationSource = 'auto_rule';
          break;
        }
      }

      // If categoryId not found from rule, check category name map
      if (!categoryId && categoryMap.has(categoryName.toLowerCase())) {
        categoryId = categoryMap.get(categoryName.toLowerCase());
      }

      const txDate = new Date(item.transactionDate);
      const debit = parseFloat(item.debit) || 0;
      const credit = parseFloat(item.credit) || 0;
      const amount = credit > 0 ? credit : debit;
      const txType = credit > 0 ? 'credit' : 'debit';

      // Generate fingerprint for duplicate prevention
      const fp = crypto
        .createHash('sha256')
        .update(`${item.transactionDate}|${amount.toFixed(2)}|${txType}|${(item.referenceNumber || item.description || '').slice(0, 25)}`)
        .digest('hex');

      documentsToInsert.push({
        workspaceId: req.workspace._id,
        bankAccountId: statement.bankAccountId,
        statementId: statement._id,
        importBatchId: batchId,
        transactionDate: isNaN(txDate.getTime()) ? new Date() : txDate,
        description: item.description,
        normalizedDescription: item.normalizedDescription || item.description,
        referenceNumber: item.referenceNumber || undefined,
        debit,
        credit,
        amount,
        transactionType: txType,
        categoryId: categoryId || undefined,
        categoryName,
        merchant: item.merchant || undefined,
        runningBalance: item.runningBalance !== undefined ? parseFloat(item.runningBalance) : undefined,
        categorizationSource,
        categorizationConfidence: item.confidenceScore || 0.8,
        fingerprint: fp,
        notes: item.notes || '',
      });
    }

    if (documentsToInsert.length > 0) {
      await Transaction.insertMany(documentsToInsert);
    }

    // Update statement status
    statement.processingStatus = 'IMPORTED';
    statement.importedTransactionCount = documentsToInsert.length;
    statement.importBatchId = batchId;
    await statement.save();

    // Recalculate bank balance dynamically
    await recalculateBankAccountBalance(statement.bankAccountId, req.workspace._id);

    // Detect internal transfers between accounts
    await detectInternalTransfers(req.workspace._id);

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'TRANSACTION_IMPORT',
      entityType: 'Statement',
      entityId: statement._id,
      metadata: { importedCount: documentsToInsert.length },
    });

    res.json({
      success: true,
      message: `Successfully imported ${documentsToInsert.length} transactions.`,
      importedCount: documentsToInsert.length,
    });
  } catch (err) {
    next(err);
  }
};

export const getStatements = async (req, res, next) => {
  try {
    const filter = { workspaceId: req.workspace._id };
    if (req.query.bankAccountId) {
      filter.bankAccountId = req.query.bankAccountId;
    }

    const statements = await Statement.find(filter)
      .populate('bankAccountId', 'bankName accountNickname maskedAccountNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, statements });
  } catch (err) {
    next(err);
  }
};

export const deleteStatement = async (req, res, next) => {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    // Delete associated transactions if requested
    if (req.query.deleteTransactions === 'true') {
      await Transaction.deleteMany({
        statementId: statement._id,
        workspaceId: req.workspace._id,
      });
      await recalculateBankAccountBalance(statement.bankAccountId, req.workspace._id);
    }

    // Clean up stored file if exists
    if (statement.storedFilePath && fs.existsSync(statement.storedFilePath)) {
      try {
        fs.unlinkSync(statement.storedFilePath);
      } catch (e) {}
    }

    await statement.deleteOne();

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'STATEMENT_DELETED',
      entityType: 'Statement',
      entityId: statement._id,
    });

    res.json({ success: true, message: 'Statement deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const rollbackImport = async (req, res, next) => {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    if (statement.processingStatus !== 'IMPORTED') {
      return res.status(400).json({ success: false, message: 'Only imported statements can be rolled back' });
    }

    // Delete all transactions linked to this statement / import batch
    const deleteResult = await Transaction.deleteMany({
      statementId: statement._id,
      workspaceId: req.workspace._id,
    });

    statement.processingStatus = 'PREVIEW_READY';
    statement.importedTransactionCount = 0;
    statement.importBatchId = undefined;
    await statement.save();

    // Recalculate balance and internal transfers
    await recalculateBankAccountBalance(statement.bankAccountId, req.workspace._id);
    await detectInternalTransfers(req.workspace._id);

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'IMPORT_ROLLBACK',
      entityType: 'Statement',
      entityId: statement._id,
      metadata: { rolledBackCount: deleteResult.deletedCount },
    });

    res.json({
      success: true,
      message: `Successfully rolled back ${deleteResult.deletedCount} transactions. Statement is reset to preview status.`,
      rolledBackCount: deleteResult.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

export const reprocessStatement = async (req, res, next) => {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!statement) {
      return res.status(404).json({ success: false, message: 'Statement not found' });
    }

    if (!statement.storedFilePath || !fs.existsSync(statement.storedFilePath)) {
      return res.status(400).json({ success: false, message: 'Original statement file is no longer on disk' });
    }

    const { customMapping } = req.body;
    let parsedMapping = customMapping || null;

    statement.processingStatus = 'PARSING';
    await statement.save();

    const absolutePath = path.resolve(statement.storedFilePath);
    const parsedData = await requestPythonExtraction(absolutePath, parsedMapping, statement.processingJobId);

    statement.extractedDataCache = parsedData;
    statement.processingStatus = 'PREVIEW_READY';
    statement.extractedTransactionCount = parsedData.transactions?.length || 0;
    statement.openingBalance = parsedData.summary?.openingBalance || 0;
    statement.closingBalance = parsedData.summary?.closingBalance || 0;
    statement.columnMappingRequired = !!parsedData.columnMappingRequired;
    statement.availableHeaders = parsedData.availableHeaders || [];
    statement.processingWarnings = parsedData.validation?.warnings || [];
    statement.processingErrors = parsedData.validation?.errors || [];

    if (parsedData.statementPeriod?.start) {
      statement.statementPeriodStart = new Date(parsedData.statementPeriod.start);
    }
    if (parsedData.statementPeriod?.end) {
      statement.statementPeriodEnd = new Date(parsedData.statementPeriod.end);
    }

    await statement.save();

    res.json({
      success: true,
      message: 'Statement successfully reprocessed.',
      statement: {
        id: statement._id,
        originalFileName: statement.originalFileName,
        processingStatus: statement.processingStatus,
        columnMappingRequired: statement.columnMappingRequired,
        availableHeaders: statement.availableHeaders,
        summary: parsedData.summary,
        detectedBank: parsedData.detectedBank,
        extractedTransactions: parsedData.transactions || [],
        validation: parsedData.validation,
      },
    });
  } catch (err) {
    next(err);
  }
};

