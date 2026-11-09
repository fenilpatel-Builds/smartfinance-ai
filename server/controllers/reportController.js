import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Statement from '../models/Statement.js';
import AIInsight from '../models/AIInsight.js';
import { calculateCompleteBalanceSheet, recalculateBankAccountBalance } from '../services/financialEngine.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, bankAccountId } = req.query;
    const workspaceId = req.workspace._id;

    // 1. Bank Accounts & Combined Balance
    const accounts = await BankAccount.find({ workspaceId, isActive: true });
    let combinedBankBalance = 0;
    const bankBreakdown = [];

    for (const acc of accounts) {
      const freshBal = await recalculateBankAccountBalance(acc._id, workspaceId);
      combinedBankBalance += freshBal;
      bankBreakdown.push({
        id: acc._id,
        name: acc.accountNickname || acc.bankName,
        bankName: acc.bankName,
        maskedAccountNumber: acc.maskedAccountNumber,
        balance: freshBal,
      });
    }

    combinedBankBalance = Math.round(combinedBankBalance * 100) / 100;

    // 2. Transaction Filters
    const txFilter = { workspaceId, isInternalTransfer: false };
    if (bankAccountId) txFilter.bankAccountId = bankAccountId;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.$lte = e;
    }
    if (Object.keys(dateFilter).length > 0) {
      txFilter.transactionDate = dateFilter;
    }

    // Aggregations
    const totalsAgg = await Transaction.aggregate([
      { $match: txFilter },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$credit' },
          totalExpenses: { $sum: '$debit' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = totalsAgg.length > 0 ? Math.round(totalsAgg[0].totalIncome * 100) / 100 : 0;
    const totalExpenses = totalsAgg.length > 0 ? Math.round(totalsAgg[0].totalExpenses * 100) / 100 : 0;
    const totalTransactions = totalsAgg.length > 0 ? totalsAgg[0].count : 0;
    const netCashFlow = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // Uncategorized Transactions count
    const uncategorizedCount = await Transaction.countDocuments({
      workspaceId,
      $or: [{ categoryName: 'Uncategorized' }, { categoryId: { $exists: false } }],
    });

    // Pending Reconciliations (unreconciled tx count)
    const pendingReconciliationCount = await Transaction.countDocuments({
      workspaceId,
      reconciliationStatus: { $in: ['Unreconciled', 'Needs Review'] },
    });

    // 3. Category Breakdown (Expenses)
    const categoryAgg = await Transaction.aggregate([
      { $match: { ...txFilter, transactionType: 'debit' } },
      {
        $group: {
          _id: '$categoryName',
          amount: { $sum: '$debit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const categoryExpenses = categoryAgg.map((c) => ({
      name: c._id || 'Uncategorized',
      amount: Math.round(c.amount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0,
      count: c.count,
    }));

    // 4. Monthly Income vs Expenses (Last 6 months)
    const monthlyAgg = await Transaction.aggregate([
      { $match: { workspaceId, isInternalTransfer: false } },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
          },
          income: { $sum: '$credit' },
          expenses: { $sum: '$debit' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = monthlyAgg.map((m) => ({
      month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      income: Math.round(m.income * 100) / 100,
      expenses: Math.round(m.expenses * 100) / 100,
      net: Math.round((m.income - m.expenses) * 100) / 100,
    }));

    // 5. Recent Transactions & Statements
    const recentTransactions = await Transaction.find({ workspaceId })
      .populate('bankAccountId', 'bankName accountNickname')
      .sort({ transactionDate: -1 })
      .limit(6);

    const recentStatements = await Statement.find({ workspaceId })
      .populate('bankAccountId', 'bankName')
      .sort({ createdAt: -1 })
      .limit(4);

    // 6. Latest AI Insights
    const latestInsight = await AIInsight.findOne({ workspaceId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      summary: {
        totalBankAccounts: accounts.length,
        combinedBankBalance,
        totalIncome,
        totalExpenses,
        netCashFlow,
        totalTransactions,
        uncategorizedCount,
        pendingReconciliationCount,
      },
      bankBreakdown,
      categoryExpenses: categoryExpenses.slice(0, 7),
      monthlyTrends: monthlyTrends.slice(-6),
      recentTransactions,
      recentStatements,
      latestInsight,
    });
  } catch (err) {
    next(err);
  }
};

export const getBankSummary = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const accounts = await BankAccount.find({ workspaceId, isActive: true });

    const summaryList = await Promise.all(
      accounts.map(async (acc) => {
        const freshBal = await recalculateBankAccountBalance(acc._id, workspaceId);

        const txStats = await Transaction.aggregate([
          { $match: { bankAccountId: acc._id, workspaceId } },
          {
            $group: {
              _id: null,
              totalCredits: { $sum: '$credit' },
              totalDebits: { $sum: '$debit' },
              count: { $sum: 1 },
            },
          },
        ]);

        const totalCredits = txStats.length > 0 ? txStats[0].totalCredits : 0;
        const totalDebits = txStats.length > 0 ? txStats[0].totalDebits : 0;

        return {
          id: acc._id,
          bankName: acc.bankName,
          accountNickname: acc.accountNickname || acc.bankName,
          accountType: acc.accountType,
          maskedAccountNumber: acc.maskedAccountNumber,
          currency: acc.currency,
          openingBalance: acc.openingBalance,
          totalCredits: Math.round(totalCredits * 100) / 100,
          totalDebits: Math.round(totalDebits * 100) / 100,
          netMovement: Math.round((totalCredits - totalDebits) * 100) / 100,
          closingBalance: freshBal,
          transactionCount: txStats.length > 0 ? txStats[0].count : 0,
        };
      })
    );

    const totalClosing = summaryList.reduce((s, a) => s + a.closingBalance, 0);
    const totalOpening = summaryList.reduce((s, a) => s + a.openingBalance, 0);
    const totalCredits = summaryList.reduce((s, a) => s + a.totalCredits, 0);
    const totalDebits = summaryList.reduce((s, a) => s + a.totalDebits, 0);

    res.json({
      success: true,
      bankAccounts: summaryList,
      totals: {
        totalOpening: Math.round(totalOpening * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        totalDebits: Math.round(totalDebits * 100) / 100,
        netCashMovement: Math.round((totalCredits - totalDebits) * 100) / 100,
        totalClosingBalance: Math.round(totalClosing * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getBalanceSheetReport = async (req, res, next) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate) : new Date();
    const balanceSheet = await calculateCompleteBalanceSheet(req.workspace._id, asOfDate);
    res.json({ success: true, balanceSheet });
  } catch (err) {
    next(err);
  }
};

export const getIncomeExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { workspaceId: req.workspace._id, isInternalTransfer: false };

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    const [incomeList, expenseList] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...filter, transactionType: 'credit' } },
        { $group: { _id: '$categoryName', total: { $sum: '$credit' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        { $match: { ...filter, transactionType: 'debit' } },
        { $group: { _id: '$categoryName', total: { $sum: '$debit' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const totalIncome = incomeList.reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenseList.reduce((s, e) => s + e.total, 0);
    const netProfitOrLoss = Math.round((totalIncome - totalExpenses) * 100) / 100;

    res.json({
      success: true,
      incomeCategories: incomeList.map((i) => ({ category: i._id, total: Math.round(i.total * 100) / 100, count: i.count })),
      expenseCategories: expenseList.map((e) => ({ category: e._id, total: Math.round(e.total * 100) / 100, count: e.count })),
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfitOrLoss,
    });
  } catch (err) {
    next(err);
  }
};

export const getCashFlowReport = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const monthlyAgg = await Transaction.aggregate([
      { $match: { workspaceId, isInternalTransfer: false } },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
          },
          inflow: { $sum: '$credit' },
          outflow: { $sum: '$debit' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let runningCumulative = 0;

    const series = monthlyAgg.map((m) => {
      const net = Math.round((m.inflow - m.outflow) * 100) / 100;
      runningCumulative += net;
      return {
        period: `${monthNames[m._id.month - 1]} ${m._id.year}`,
        inflow: Math.round(m.inflow * 100) / 100,
        outflow: Math.round(m.outflow * 100) / 100,
        netCashFlow: net,
        cumulativeCash: Math.round(runningCumulative * 100) / 100,
      };
    });

    res.json({ success: true, cashFlow: series });
  } catch (err) {
    next(err);
  }
};

