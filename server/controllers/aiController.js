import Transaction from '../models/Transaction.js';
import BankAccount from '../models/BankAccount.js';
import AIInsight from '../models/AIInsight.js';
import { generateAIInsights } from '../services/aiService.js';
import { recalculateBankAccountBalance } from '../services/financialEngine.js';

export const analyzeSpending = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;

    // Fetch accounts & balances
    const accounts = await BankAccount.find({ workspaceId, isActive: true });
    let totalBalance = 0;
    for (const acc of accounts) {
      totalBalance += await recalculateBankAccountBalance(acc._id, workspaceId);
    }

    // Totals
    const totals = await Transaction.aggregate([
      { $match: { workspaceId, isInternalTransfer: false } },
      {
        $group: {
          _id: null,
          income: { $sum: '$credit' },
          expenses: { $sum: '$debit' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = totals.length > 0 ? totals[0].income : 0;
    const totalExpenses = totals.length > 0 ? totals[0].expenses : 0;
    const netCashFlow = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // Top categories
    const catAgg = await Transaction.aggregate([
      { $match: { workspaceId, transactionType: 'debit', isInternalTransfer: false } },
      { $group: { _id: '$categoryName', amount: { $sum: '$debit' } } },
      { $sort: { amount: -1 } },
      { $limit: 5 },
    ]);

    const topCategories = catAgg.map((c) => ({
      name: c._id || 'Uncategorized',
      amount: Math.round(c.amount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0,
    }));

    // Recent transactions sample
    const sampleTx = await Transaction.find({ workspaceId })
      .sort({ transactionDate: -1 })
      .limit(15);

    const formattedSample = sampleTx.map((t) => ({
      date: t.transactionDate.toISOString().split('T')[0],
      type: t.transactionType,
      amount: t.amount,
      category: t.categoryName,
      merchant: t.merchant,
      description: t.description,
    }));

    const result = await generateAIInsights({
      summaryData: {
        totalBalance: Math.round(totalBalance * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netCashFlow,
        transactionCount: totals.length > 0 ? totals[0].count : 0,
      },
      topCategories,
      recentTransactions: formattedSample,
      query: req.body.query,
    });

    // Save insight to database
    await AIInsight.create({
      workspaceId,
      insightType: 'spending_pattern',
      title: 'Spending Pattern & Cash Flow Analysis',
      description: result.text.slice(0, 300) + '...',
      severity: netCashFlow < 0 ? 'warning' : 'info',
      recommendations: [
        'Review high expenditure categories',
        'Verify recurring vendor charges',
      ],
    });

    res.json({
      success: true,
      analysis: result.text,
      provider: result.provider,
      isAiGenerated: result.isAiGenerated,
    });
  } catch (err) {
    next(err);
  }
};

export const chatAssistant = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    const workspaceId = req.workspace._id;
    const accounts = await BankAccount.find({ workspaceId, isActive: true });
    let totalBalance = 0;
    for (const acc of accounts) {
      totalBalance += await recalculateBankAccountBalance(acc._id, workspaceId);
    }

    const totals = await Transaction.aggregate([
      { $match: { workspaceId, isInternalTransfer: false } },
      {
        $group: {
          _id: null,
          income: { $sum: '$credit' },
          expenses: { $sum: '$debit' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = totals.length > 0 ? totals[0].income : 0;
    const totalExpenses = totals.length > 0 ? totals[0].expenses : 0;

    const catAgg = await Transaction.aggregate([
      { $match: { workspaceId, transactionType: 'debit', isInternalTransfer: false } },
      { $group: { _id: '$categoryName', amount: { $sum: '$debit' } } },
      { $sort: { amount: -1 } },
      { $limit: 6 },
    ]);

    const topCategories = catAgg.map((c) => ({
      name: c._id || 'Uncategorized',
      amount: Math.round(c.amount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0,
    }));

    const sampleTx = await Transaction.find({ workspaceId })
      .sort({ transactionDate: -1 })
      .limit(15);

    const formattedSample = sampleTx.map((t) => ({
      date: t.transactionDate.toISOString().split('T')[0],
      type: t.transactionType,
      amount: t.amount,
      category: t.categoryName,
      merchant: t.merchant,
      description: t.description,
    }));

    const result = await generateAIInsights({
      summaryData: {
        totalBalance: Math.round(totalBalance * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netCashFlow: Math.round((totalIncome - totalExpenses) * 100) / 100,
        transactionCount: totals.length > 0 ? totals[0].count : 0,
      },
      topCategories,
      recentTransactions: formattedSample,
      query: question,
    });

    res.json({
      success: true,
      answer: result.text,
      provider: result.provider,
    });
  } catch (err) {
    next(err);
  }
};

