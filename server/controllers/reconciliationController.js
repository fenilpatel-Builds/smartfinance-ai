import Reconciliation from '../models/Reconciliation.js';
import BankAccount from '../models/BankAccount.js';
import Statement from '../models/Statement.js';
import Transaction from '../models/Transaction.js';
import { logAudit } from '../utils/auditLogger.js';

export const getReconciliations = async (req, res, next) => {
  try {
    const filter = { workspaceId: req.workspace._id };
    if (req.query.bankAccountId) filter.bankAccountId = req.query.bankAccountId;

    const reconciliations = await Reconciliation.find(filter)
      .populate('bankAccountId', 'bankName accountNickname maskedAccountNumber')
      .populate('statementId', 'originalFileName')
      .sort({ createdAt: -1 });

    res.json({ success: true, reconciliations });
  } catch (err) {
    next(err);
  }
};

export const getReconciliationById = async (req, res, next) => {
  try {
    const rec = await Reconciliation.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    })
      .populate('bankAccountId')
      .populate('statementId')
      .populate('matchedTransactionIds')
      .populate('unmatchedTransactionIds');

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Reconciliation record not found' });
    }

    res.json({ success: true, reconciliation: rec });
  } catch (err) {
    next(err);
  }
};

export const startReconciliation = async (req, res, next) => {
  try {
    const { bankAccountId, statementId, statementBalance } = req.body;

    if (!bankAccountId) {
      return res.status(400).json({ success: false, message: 'Bank account is required' });
    }

    const account = await BankAccount.findOne({
      _id: bankAccountId,
      workspaceId: req.workspace._id,
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }

    let statement = null;
    if (statementId) {
      statement = await Statement.findOne({ _id: statementId, workspaceId: req.workspace._id });
    }

    // Get transactions for this account
    const txFilter = { bankAccountId, workspaceId: req.workspace._id };
    if (statementId) {
      txFilter.statementId = statementId;
    }

    const txs = await Transaction.find(txFilter).sort({ transactionDate: 1 });

    let totalCredits = 0;
    let totalDebits = 0;
    const matchedIds = [];
    const unmatchedIds = [];

    txs.forEach((t) => {
      totalCredits += t.credit;
      totalDebits += t.debit;
      if (t.reconciliationStatus === 'Reconciled' || t.reconciliationStatus === 'Matched') {
        matchedIds.push(t._id);
      } else {
        unmatchedIds.push(t._id);
      }
    });

    totalCredits = Math.round(totalCredits * 100) / 100;
    totalDebits = Math.round(totalDebits * 100) / 100;

    const openingBalance = statement ? statement.openingBalance : account.openingBalance;
    const expectedBalance = Math.round((openingBalance + totalCredits - totalDebits) * 100) / 100;
    const targetStatementBalance = statementBalance !== undefined
      ? parseFloat(statementBalance)
      : statement
      ? statement.closingBalance
      : expectedBalance;

    const difference = Math.round(Math.abs(expectedBalance - targetStatementBalance) * 100) / 100;
    const status = difference < 0.01 ? 'Matched' : 'Needs Review';

    const reconciliation = await Reconciliation.create({
      workspaceId: req.workspace._id,
      bankAccountId,
      statementId: statement?._id,
      reconciliationDate: new Date(),
      statementPeriodStart: statement?.statementPeriodStart,
      statementPeriodEnd: statement?.statementPeriodEnd,
      openingBalance,
      totalCredits,
      totalDebits,
      expectedBalance,
      statementBalance: targetStatementBalance,
      difference,
      status,
      matchedTransactionIds: matchedIds,
      unmatchedTransactionIds: unmatchedIds,
    });

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'RECONCILIATION_RUN',
      entityType: 'Reconciliation',
      entityId: reconciliation._id,
      metadata: { expectedBalance, statementBalance: targetStatementBalance, difference, status },
    });

    res.status(201).json({ success: true, reconciliation });
  } catch (err) {
    next(err);
  }
};

export const matchTransactions = async (req, res, next) => {
  try {
    const { transactionIds, markAs = 'Reconciled' } = req.body;
    const rec = await Reconciliation.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Reconciliation not found' });
    }

    if (transactionIds && transactionIds.length > 0) {
      await Transaction.updateMany(
        { _id: { $in: transactionIds }, workspaceId: req.workspace._id },
        { $set: { reconciliationStatus: markAs } }
      );
    }

    res.json({ success: true, message: `Updated status for ${transactionIds.length} transactions.` });
  } catch (err) {
    next(err);
  }
};

export const completeReconciliation = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const rec = await Reconciliation.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Reconciliation not found' });
    }

    rec.status = 'Reconciled';
    if (notes) rec.notes = notes;
    await rec.save();

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'RECONCILIATION_COMPLETED',
      entityType: 'Reconciliation',
      entityId: rec._id,
    });

    res.json({ success: true, reconciliation: rec });
  } catch (err) {
    next(err);
  }
};

