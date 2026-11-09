import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import ExcelJS from 'exceljs';
import { recalculateBankAccountBalance } from '../services/financialEngine.js';
import { logAudit } from '../utils/auditLogger.js';

export const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      bankAccountId,
      startDate,
      endDate,
      transactionType,
      categoryId,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
    } = req.query;

    const filter = { workspaceId: req.workspace._id };

    if (bankAccountId) {
      filter.bankAccountId = bankAccountId;
    }

    if (transactionType && ['debit', 'credit'].includes(transactionType)) {
      filter.transactionType = transactionType;
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = end;
      }
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { description: regex },
        { merchant: regex },
        { referenceNumber: regex },
        { categoryName: regex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .populate('bankAccountId', 'bankName accountNickname maskedAccountNumber')
        .populate('categoryId', 'name color icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    })
      .populate('bankAccountId')
      .populate('categoryId');

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const {
      bankAccountId,
      transactionDate,
      description,
      amount,
      transactionType,
      categoryId,
      merchant,
      referenceNumber,
      notes,
    } = req.body;

    if (!bankAccountId || !transactionDate || !description || !amount || !transactionType) {
      return res.status(400).json({ success: false, message: 'Missing required transaction fields' });
    }

    const amt = parseFloat(amount);
    const debit = transactionType === 'debit' ? amt : 0;
    const credit = transactionType === 'credit' ? amt : 0;

    let categoryName = 'Uncategorized';
    if (categoryId) {
      const cat = await Category.findOne({ _id: categoryId, workspaceId: req.workspace._id });
      if (cat) categoryName = cat.name;
    }

    const tx = await Transaction.create({
      workspaceId: req.workspace._id,
      bankAccountId,
      transactionDate: new Date(transactionDate),
      description,
      normalizedDescription: description,
      debit,
      credit,
      amount: amt,
      transactionType,
      categoryId: categoryId || undefined,
      categoryName,
      merchant,
      referenceNumber,
      notes: notes || '',
      categorizationSource: 'manual',
    });

    await recalculateBankAccountBalance(bankAccountId, req.workspace._id);

    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { categoryId, categoryName, merchant, notes, reconciliationStatus, verificationStatus } = req.body;
    const tx = await Transaction.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (categoryId) {
      const cat = await Category.findOne({ _id: categoryId, workspaceId: req.workspace._id });
      if (cat) {
        tx.categoryId = cat._id;
        tx.categoryName = cat.name;
        tx.categorizationSource = 'manual';
      }
    } else if (categoryName) {
      tx.categoryName = categoryName;
      tx.categorizationSource = 'manual';
    }

    if (merchant !== undefined) tx.merchant = merchant;
    if (notes !== undefined) tx.notes = notes;
    if (reconciliationStatus) tx.reconciliationStatus = reconciliationStatus;
    if (verificationStatus) tx.verificationStatus = verificationStatus;

    await tx.save();

    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const bankAccountId = tx.bankAccountId;
    await tx.deleteOne();
    await recalculateBankAccountBalance(bankAccountId, req.workspace._id);

    res.json({ success: true, message: 'Transaction removed' });
  } catch (err) {
    next(err);
  }
};

export const bulkCategorizeTransactions = async (req, res, next) => {
  try {
    const { transactionIds, categoryId, categoryName } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No transaction IDs provided' });
    }

    let catName = categoryName;
    if (categoryId) {
      const cat = await Category.findOne({ _id: categoryId, workspaceId: req.workspace._id });
      if (cat) catName = cat.name;
    }

    await Transaction.updateMany(
      {
        _id: { $in: transactionIds },
        workspaceId: req.workspace._id,
      },
      {
        $set: {
          categoryId: categoryId || undefined,
          categoryName: catName,
          categorizationSource: 'manual',
        },
      }
    );

    res.json({
      success: true,
      message: `Updated ${transactionIds.length} transactions to "${catName}"`,
    });
  } catch (err) {
    next(err);
  }
};

export const exportTransactions = async (req, res, next) => {
  try {
    const { format = 'csv', bankAccountId, startDate, endDate } = req.query;
    const filter = { workspaceId: req.workspace._id };

    if (bankAccountId) filter.bankAccountId = bankAccountId;
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('bankAccountId', 'bankName maskedAccountNumber')
      .sort({ transactionDate: -1 });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Bank', key: 'bank', width: 20 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Debit', key: 'debit', width: 14 },
        { header: 'Credit', key: 'credit', width: 14 },
        { header: 'Balance', key: 'balance', width: 14 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Merchant', key: 'merchant', width: 20 },
        { header: 'Reference', key: 'reference', width: 22 },
      ];

      transactions.forEach((t) => {
        worksheet.addRow({
          date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
          bank: t.bankAccountId?.bankName || '',
          description: t.description,
          type: t.transactionType,
          debit: t.debit || 0,
          credit: t.credit || 0,
          balance: t.runningBalance !== undefined ? t.runningBalance : '',
          category: t.categoryName,
          merchant: t.merchant || '',
          reference: t.referenceNumber || '',
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      // CSV format
      let csv = 'Date,Bank,Description,Type,Debit,Credit,Balance,Category,Merchant,Reference\n';
      transactions.forEach((t) => {
        const d = t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '';
        const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
        const bank = `"${(t.bankAccountId?.bankName || '').replace(/"/g, '""')}"`;
        const cat = `"${(t.categoryName || '').replace(/"/g, '""')}"`;
        const merch = `"${(t.merchant || '').replace(/"/g, '""')}"`;
        const ref = `"${(t.referenceNumber || '').replace(/"/g, '""')}"`;
        csv += `${d},${bank},${desc},${t.transactionType},${t.debit},${t.credit},${t.runningBalance || ''},${cat},${merch},${ref}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv);
    }
  } catch (err) {
    next(err);
  }
};

export const splitTransaction = async (req, res, next) => {
  try {
    const { splits } = req.body;
    if (!splits || !Array.isArray(splits) || splits.length < 2) {
      return res.status(400).json({ success: false, message: 'At least two split line items are required' });
    }

    const tx = await Transaction.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const totalSplitAmt = splits.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    if (Math.abs(totalSplitAmt - tx.amount) > 0.05) {
      return res.status(400).json({
        success: false,
        message: `Sum of split amounts (${totalSplitAmt}) must equal original transaction amount (${tx.amount})`,
      });
    }

    tx.splits = splits.map((s) => ({
      categoryId: s.categoryId || undefined,
      categoryName: s.categoryName || 'General',
      amount: Number(s.amount),
      notes: s.notes || '',
    }));

    tx.categoryName = 'Split Transaction';
    tx.activityHistory.push({
      action: 'SPLIT_TRANSACTION',
      timestamp: new Date(),
      changedBy: req.user.name || 'User',
      details: { splitCount: splits.length },
    });

    await tx.save();
    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
};

export const updateTransactionTags = async (req, res, next) => {
  try {
    const { tags } = req.body;
    const tx = await Transaction.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    tx.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
    await tx.save();

    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
};


