import Anomaly from '../models/Anomaly.js';
import Transaction from '../models/Transaction.js';
import BankAccount from '../models/BankAccount.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAnomalies = async (req, res, next) => {
  try {
    const { status, severity } = req.query;
    const filter = { workspaceId: req.workspace._id };

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (severity && severity !== 'All') {
      filter.severity = severity;
    }

    const anomalies = await Anomaly.find(filter)
      .populate('transactionId')
      .populate('bankAccountId', 'bankName accountNickname maskedAccountNumber')
      .sort({ createdAt: -1 });

    const totalDetected = anomalies.length;
    const criticalCount = anomalies.filter((a) => a.severity === 'Critical').length;
    const highCount = anomalies.filter((a) => a.severity === 'High').length;
    const pendingReview = anomalies.filter((a) => a.status === 'Detected').length;

    res.json({
      success: true,
      anomalies,
      metrics: {
        totalDetected,
        criticalCount,
        highCount,
        pendingReview,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const scanAnomalies = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const txs = await Transaction.find({ workspaceId }).sort({ transactionDate: 1 });

    if (txs.length === 0) {
      return res.json({ success: true, message: 'No transactions to scan.', newlyCreated: 0 });
    }

    const existingAnomalies = await Anomaly.find({ workspaceId });
    const existingTxAnomalyMap = new Set(
      existingAnomalies.map((a) => `${a.transactionId?.toString()}-${a.anomalyType}`)
    );

    const newAnomalies = [];

    // 1. Calculate category averages for debit spikes
    const categoryDebits = {};
    for (const t of txs) {
      if (t.transactionType === 'debit') {
        const cat = t.categoryName || 'General';
        if (!categoryDebits[cat]) categoryDebits[cat] = [];
        categoryDebits[cat].push(t.amount);
      }
    }

    const categoryAverages = {};
    for (const [cat, amounts] of Object.entries(categoryDebits)) {
      categoryAverages[cat] = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    }

    // 2. Scan each transaction for spikes & weekend large transfers
    for (const t of txs) {
      if (t.transactionType === 'debit') {
        const cat = t.categoryName || 'General';
        const avg = categoryAverages[cat] || 0;
        
        // Spike check (> 3x average and amount > 5000)
        if (avg > 0 && t.amount > avg * 3 && t.amount > 5000) {
          const key = `${t._id.toString()}-High Expense Spike`;
          if (!existingTxAnomalyMap.has(key)) {
            newAnomalies.push({
              workspaceId,
              bankAccountId: t.bankAccountId,
              transactionId: t._id,
              anomalyType: 'High Expense Spike',
              severity: t.amount > avg * 5 ? 'High' : 'Medium',
              title: `Unusually High ${cat} Expense`,
              description: `Transaction amount (${t.amount}) is ${Math.round((t.amount / avg) * 10) / 10}x higher than category average (${Math.round(avg)}).`,
              affectedAmount: t.amount,
              confidenceScore: 0.9,
              status: 'Detected',
            });
            existingTxAnomalyMap.add(key);
          }
        }
      }
    }

    // 3. Scan for duplicate charges (same amount, same merchant within 48h)
    for (let i = 0; i < txs.length; i++) {
      for (let j = i + 1; j < txs.length; j++) {
        const t1 = txs[i];
        const t2 = txs[j];

        const timeDiffHours = Math.abs(new Date(t2.transactionDate) - new Date(t1.transactionDate)) / (1000 * 60 * 60);
        if (timeDiffHours > 48) break; // sorted by date

        if (
          t1.amount === t2.amount &&
          t1.transactionType === t2.transactionType &&
          t1._id.toString() !== t2._id.toString()
        ) {
          const m1 = (t1.merchant || t1.description).toLowerCase();
          const m2 = (t2.merchant || t2.description).toLowerCase();
          if (m1 === m2 || m1.includes(m2) || m2.includes(m1)) {
            const key = `${t2._id.toString()}-Potential Duplicate`;
            if (!existingTxAnomalyMap.has(key)) {
              newAnomalies.push({
                workspaceId,
                bankAccountId: t2.bankAccountId,
                transactionId: t2._id,
                anomalyType: 'Potential Duplicate',
                severity: 'High',
                title: 'Potential Duplicate Transaction',
                description: `Identical charge of ${t2.amount} detected within ${Math.round(timeDiffHours)} hours of prior charge.`,
                affectedAmount: t2.amount,
                confidenceScore: 0.85,
                status: 'Detected',
              });
              existingTxAnomalyMap.add(key);
            }
          }
        }
      }
    }

    // 4. Scan for rapid sequence debits (> 4 debits on same day)
    const dayDebits = {};
    for (const t of txs) {
      if (t.transactionType === 'debit') {
        const dayKey = `${t.bankAccountId.toString()}_${new Date(t.transactionDate).toISOString().slice(0, 10)}`;
        if (!dayDebits[dayKey]) dayDebits[dayKey] = [];
        dayDebits[dayKey].push(t);
      }
    }

    for (const [dayKey, list] of Object.entries(dayDebits)) {
      if (list.length >= 4) {
        const lastTx = list[list.length - 1];
        const key = `${lastTx._id.toString()}-Rapid Frequency`;
        if (!existingTxAnomalyMap.has(key)) {
          newAnomalies.push({
            workspaceId,
            bankAccountId: lastTx.bankAccountId,
            transactionId: lastTx._id,
            anomalyType: 'Rapid Frequency',
            severity: 'Medium',
            title: 'High Transaction Velocity',
            description: `${list.length} consecutive debit transactions occurred in a single calendar day.`,
            affectedAmount: list.reduce((a, b) => a + b.amount, 0),
            confidenceScore: 0.8,
            status: 'Detected',
          });
          existingTxAnomalyMap.add(key);
        }
      }
    }

    if (newAnomalies.length > 0) {
      await Anomaly.insertMany(newAnomalies);
    }

    await logAudit({
      workspaceId,
      userId: req.user._id,
      action: 'SCAN_ANOMALIES',
      resourceType: 'Anomaly',
      details: { newlyDetected: newAnomalies.length },
    });

    res.json({
      success: true,
      message: `Scan finished. Found ${newAnomalies.length} new potential anomaly records.`,
      newlyCreated: newAnomalies.length,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAnomalyStatus = async (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body;
    const anomaly = await Anomaly.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!anomaly) {
      return res.status(404).json({ success: false, message: 'Anomaly record not found' });
    }

    if (status) anomaly.status = status;
    if (resolutionNotes) anomaly.resolutionNotes = resolutionNotes;
    if (status === 'Resolved' || status === 'Dismissed') {
      anomaly.resolvedAt = new Date();
    }

    await anomaly.save();
    res.json({ success: true, anomaly });
  } catch (err) {
    next(err);
  }
};
