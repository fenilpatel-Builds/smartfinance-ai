import RecurringTransaction from '../models/RecurringTransaction.js';
import Transaction from '../models/Transaction.js';
import BankAccount from '../models/BankAccount.js';
import { logAudit } from '../utils/auditLogger.js';

export const getRecurringTransactions = async (req, res, next) => {
  try {
    const recurring = await RecurringTransaction.find({ workspaceId: req.workspace._id })
      .populate('bankAccountId', 'bankName accountNickname maskedAccountNumber')
      .sort({ nextExpectedDate: 1 });

    let monthlyTotal = 0;
    recurring.forEach((item) => {
      if (item.status === 'Active') {
        const amt = item.expectedAmount || 0;
        if (item.frequency === 'Daily') monthlyTotal += amt * 30;
        else if (item.frequency === 'Weekly') monthlyTotal += amt * 4.33;
        else if (item.frequency === 'Bi-Weekly') monthlyTotal += amt * 2.16;
        else if (item.frequency === 'Monthly') monthlyTotal += amt;
        else if (item.frequency === 'Quarterly') monthlyTotal += amt / 3;
        else if (item.frequency === 'Yearly') monthlyTotal += amt / 12;
      }
    });

    const yearlyTotal = monthlyTotal * 12;

    res.json({
      success: true,
      recurring,
      metrics: {
        totalItems: recurring.length,
        activeItems: recurring.filter((r) => r.status === 'Active').length,
        pausedItems: recurring.filter((r) => r.status === 'Paused').length,
        projectedMonthlyCommitment: Math.round(monthlyTotal * 100) / 100,
        projectedAnnualCommitment: Math.round(yearlyTotal * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createRecurringTransaction = async (req, res, next) => {
  try {
    const {
      merchant,
      description,
      expectedAmount,
      frequency = 'Monthly',
      nextExpectedDate,
      categoryName,
      bankAccountId,
      isSubscription = true,
      notes,
    } = req.body;

    if (!merchant || !expectedAmount) {
      return res.status(400).json({ success: false, message: 'Merchant and expected amount are required' });
    }

    if (bankAccountId) {
      const bankAcc = await BankAccount.findOne({ _id: bankAccountId, workspaceId: req.workspace._id });
      if (!bankAcc) {
        return res.status(404).json({ success: false, message: 'Bank account not found in this workspace' });
      }
    }

    const item = await RecurringTransaction.create({
      workspaceId: req.workspace._id,
      merchant,
      description: description || merchant,
      expectedAmount: Number(expectedAmount),
      frequency,
      nextExpectedDate: nextExpectedDate ? new Date(nextExpectedDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      categoryName: categoryName || 'Subscription',
      bankAccountId: bankAccountId || undefined,
      isSubscription,
      notes: notes || '',
      status: 'Active',
      detectionConfidence: 1.0,
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

export const updateRecurringTransaction = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    const {
      merchant,
      description,
      expectedAmount,
      frequency,
      nextExpectedDate,
      categoryName,
      status,
      isSubscription,
      notes,
    } = req.body;

    if (merchant) item.merchant = merchant;
    if (description) item.description = description;
    if (expectedAmount !== undefined) item.expectedAmount = Number(expectedAmount);
    if (frequency) item.frequency = frequency;
    if (nextExpectedDate) item.nextExpectedDate = new Date(nextExpectedDate);
    if (categoryName) item.categoryName = categoryName;
    if (status) item.status = status;
    if (isSubscription !== undefined) item.isSubscription = isSubscription;
    if (notes !== undefined) item.notes = notes;

    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

export const deleteRecurringTransaction = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    res.json({ success: true, message: 'Recurring transaction deleted' });
  } catch (err) {
    next(err);
  }
};

export const detectRecurringTransactions = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    // Look at past transactions
    const txs = await Transaction.find({
      workspaceId,
      transactionType: 'debit',
    }).sort({ transactionDate: 1 });

    // Group by merchant or normalized description prefix
    const groups = {};
    for (const t of txs) {
      const key = (t.merchant || t.description.slice(0, 15)).toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }

    let detectedCount = 0;
    const detectedItems = [];

    for (const [key, list] of Object.entries(groups)) {
      if (list.length < 2) continue;

      // Check amount variance
      const amounts = list.map((x) => x.amount);
      const avgAmt = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const isConsistentAmount = amounts.every((a) => Math.abs(a - avgAmt) / (avgAmt || 1) < 0.2);

      if (!isConsistentAmount && list.length < 3) continue;

      // Check interval
      const dates = list.map((x) => new Date(x.transactionDate).getTime());
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      let frequency = 'Monthly';
      if (avgInterval >= 25 && avgInterval <= 35) frequency = 'Monthly';
      else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'Weekly';
      else if (avgInterval >= 80 && avgInterval <= 100) frequency = 'Quarterly';
      else if (avgInterval >= 350 && avgInterval <= 380) frequency = 'Yearly';

      const lastTx = list[list.length - 1];
      const merchantName = lastTx.merchant || lastTx.description;
      const nextDate = new Date(lastTx.transactionDate);
      nextDate.setDate(nextDate.getDate() + Math.round(avgInterval || 30));

      const existing = await RecurringTransaction.findOne({
        workspaceId,
        merchant: new RegExp(`^${merchantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });

      if (!existing) {
        const created = await RecurringTransaction.create({
          workspaceId,
          merchant: merchantName,
          description: lastTx.description,
          expectedAmount: Math.round(avgAmt * 100) / 100,
          frequency,
          nextExpectedDate: nextDate,
          categoryName: lastTx.categoryName || 'Subscription',
          bankAccountId: lastTx.bankAccountId,
          isSubscription: ['netflix', 'aws', 'github', 'spotify', 'slack', 'google', 'adobe', 'zoom'].some((s) =>
            merchantName.toLowerCase().includes(s)
          ),
          detectionConfidence: list.length >= 3 ? 0.95 : 0.8,
          status: 'Active',
        });
        detectedCount++;
        detectedItems.push(created);
      }
    }

    res.json({
      success: true,
      message: `Detection complete. Identified ${detectedCount} recurring pattern(s).`,
      detectedItems,
    });
  } catch (err) {
    next(err);
  }
};

