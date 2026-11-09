import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Invoice from '../models/Invoice.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Loan from '../models/Loan.js';
import Anomaly from '../models/Anomaly.js';
import Budget from '../models/Budget.js';

// Deterministic Currency Conversion Matrix (Base INR)
const FX_RATES_TO_INR = {
  INR: 1.0,
  USD: 86.5,
  EUR: 91.2,
  GBP: 109.8,
  AED: 23.55,
  SGD: 64.2,
  JPY: 0.56,
  CAD: 61.4,
  AUD: 56.1,
};

export const getCurrencyRates = async (req, res, next) => {
  try {
    const base = req.query.base || 'INR';
    const baseToInr = FX_RATES_TO_INR[base] || 1.0;

    const rates = {};
    for (const [curr, toInr] of Object.entries(FX_RATES_TO_INR)) {
      rates[curr] = Math.round((toInr / baseToInr) * 10000) / 10000;
    }

    res.json({
      success: true,
      base,
      rates,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

export const convertCurrency = async (req, res, next) => {
  try {
    const { amount, from = 'USD', to = 'INR' } = req.body;
    const num = Number(amount);
    if (isNaN(num)) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const fromRate = FX_RATES_TO_INR[from.toUpperCase()] || 1.0;
    const toRate = FX_RATES_TO_INR[to.toUpperCase()] || 1.0;

    const inrValue = num * fromRate;
    const convertedAmount = Math.round((inrValue / toRate) * 100) / 100;

    res.json({
      success: true,
      originalAmount: num,
      fromCurrency: from.toUpperCase(),
      toCurrency: to.toUpperCase(),
      rate: Math.round((fromRate / toRate) * 10000) / 10000,
      convertedAmount,
    });
  } catch (err) {
    next(err);
  }
};

export const getCashFlowForecast = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const days = parseInt(req.query.days, 10) || 90;

    // 1. Current liquid balance
    const bankAccounts = await BankAccount.find({ workspaceId, isActive: true });
    const startingBalance = Math.round(
      bankAccounts.reduce((acc, b) => acc + (b.currentCalculatedBalance || 0), 0) * 100
    ) / 100;

    // 2. Scheduled receivables (unpaid invoices due in period)
    const now = new Date();
    const forecastEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const pendingInvoices = await Invoice.find({
      workspaceId,
      status: { $in: ['Draft', 'Sent', 'Partially Paid'] },
      dueDate: { $gte: now, $lte: forecastEnd },
    });

    const scheduledInflows = pendingInvoices.map((inv) => ({
      date: new Date(inv.dueDate),
      amount: Math.max(0, inv.totalAmount - (inv.paidAmount || 0)),
      source: `Invoice ${inv.invoiceNumber} - ${inv.customerName}`,
    }));

    // 3. Scheduled Recurring Outflows
    const recurring = await RecurringTransaction.find({
      workspaceId,
      status: 'Active',
    });

    const scheduledOutflows = [];
    recurring.forEach((item) => {
      let curDate = new Date(item.nextExpectedDate || now);
      while (curDate <= forecastEnd) {
        if (curDate >= now) {
          scheduledOutflows.push({
            date: new Date(curDate),
            amount: item.expectedAmount,
            source: `Recurring: ${item.merchant}`,
          });
        }
        // Advance according to frequency
        if (item.frequency === 'Daily') curDate.setDate(curDate.getDate() + 1);
        else if (item.frequency === 'Weekly') curDate.setDate(curDate.getDate() + 7);
        else if (item.frequency === 'Bi-Weekly') curDate.setDate(curDate.getDate() + 14);
        else if (item.frequency === 'Monthly') curDate.setMonth(curDate.getMonth() + 1);
        else if (item.frequency === 'Quarterly') curDate.setMonth(curDate.getMonth() + 3);
        else curDate.setFullYear(curDate.getFullYear() + 1);
      }
    });

    // 4. Scheduled Loan EMIs
    const activeLoans = await Loan.find({ workspaceId, status: 'Active' });
    activeLoans.forEach((loan) => {
      loan.amortizationSchedule.forEach((installment) => {
        const d = new Date(installment.dueDate);
        if (!installment.isPaid && d >= now && d <= forecastEnd) {
          scheduledOutflows.push({
            date: d,
            amount: installment.emi,
            source: `Loan EMI: ${loan.loanName}`,
          });
        }
      });
    });

    // 5. Daily timeline computation (Expected, Conservative, Best-Case)
    const timeline = [];
    let curBalExpected = startingBalance;
    let curBalConservative = startingBalance;
    let curBalBest = startingBalance;

    for (let day = 0; day <= days; day += (days > 30 ? 5 : 1)) {
      const pointDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);

      // Inflows up to this day
      const dayInflows = scheduledInflows.filter((i) => i.date <= pointDate);
      const dayOutflows = scheduledOutflows.filter((o) => o.date <= pointDate);

      const totalInflow = dayInflows.reduce((a, b) => a + b.amount, 0);
      const totalOutflow = dayOutflows.reduce((a, b) => a + b.amount, 0);

      // Expected
      curBalExpected = Math.round((startingBalance + totalInflow - totalOutflow) * 100) / 100;
      // Conservative (70% invoice collection, 110% expenses)
      curBalConservative = Math.round((startingBalance + totalInflow * 0.7 - totalOutflow * 1.1) * 100) / 100;
      // Best-case (100% invoices, 95% expenses)
      curBalBest = Math.round((startingBalance + totalInflow * 1.05 - totalOutflow * 0.95) * 100) / 100;

      timeline.push({
        date: pointDate.toISOString().slice(0, 10),
        dayOffset: day,
        expectedBalance: curBalExpected,
        conservativeBalance: curBalConservative,
        bestCaseBalance: curBalBest,
      });
    }

    const totalExpectedInflow = scheduledInflows.reduce((a, b) => a + b.amount, 0);
    const totalExpectedOutflow = scheduledOutflows.reduce((a, b) => a + b.amount, 0);
    const netProjectedDelta = Math.round((totalExpectedInflow - totalExpectedOutflow) * 100) / 100;

    res.json({
      success: true,
      forecast: {
        forecastDays: days,
        startingBalance,
        totalProjectedInflow: Math.round(totalExpectedInflow * 100) / 100,
        totalProjectedOutflow: Math.round(totalExpectedOutflow * 100) / 100,
        netProjectedDelta,
        endProjectedBalance: curBalExpected,
        timeline,
        scheduledInflowsCount: scheduledInflows.length,
        scheduledOutflowsCount: scheduledOutflows.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getFinancialHealthScore = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;

    // Gather data
    const [bankAccounts, txs, loans, anomalies, budgets] = await Promise.all([
      BankAccount.find({ workspaceId, isActive: true }),
      Transaction.find({ workspaceId }),
      Loan.find({ workspaceId, status: 'Active' }),
      Anomaly.find({ workspaceId }),
      Budget.find({ workspaceId }),
    ]);

    const liquidCash = Math.max(0, bankAccounts.reduce((acc, b) => acc + (b.currentCalculatedBalance || 0), 0));

    // Calculate total debits (expenses) and credits (income) over past 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentTxs = txs.filter((t) => new Date(t.transactionDate) >= ninetyDaysAgo);

    const totalIncome90 = recentTxs.filter((t) => t.transactionType === 'credit').reduce((a, b) => a + b.amount, 0);
    const totalExpense90 = recentTxs.filter((t) => t.transactionType === 'debit').reduce((a, b) => a + b.amount, 0);

    const monthlyAvgIncome = (totalIncome90 || 1) / 3;
    const monthlyAvgExpense = (totalExpense90 || 1) / 3;

    // Pillar 1: Savings & Net Cash Flow (0 to 25 pts)
    const netFlowRate = (totalIncome90 - totalExpense90) / (totalIncome90 || 1);
    let savingsScore = 0;
    if (netFlowRate >= 0.25) savingsScore = 25;
    else if (netFlowRate >= 0.15) savingsScore = 21;
    else if (netFlowRate >= 0.05) savingsScore = 17;
    else if (netFlowRate >= 0) savingsScore = 12;
    else savingsScore = Math.max(2, Math.round(12 + netFlowRate * 20));

    // Pillar 2: Solvency & Debt-to-Asset (0 to 25 pts)
    const totalDebt = loans.reduce((acc, l) => acc + (l.remainingPrincipal || 0), 0);
    const totalAssets = liquidCash + (totalIncome90 || 0);
    const debtRatio = totalDebt / (totalAssets || 1);

    let solvencyScore = 0;
    if (debtRatio <= 0.2) solvencyScore = 25;
    else if (debtRatio <= 0.4) solvencyScore = 20;
    else if (debtRatio <= 0.6) solvencyScore = 15;
    else if (debtRatio <= 0.8) solvencyScore = 10;
    else solvencyScore = Math.max(0, 8 - Math.round(debtRatio * 5));

    // Pillar 3: Cash Runway & Liquidity (0 to 25 pts)
    const runwayMonths = liquidCash / (monthlyAvgExpense || 1);
    let runwayScore = 0;
    if (runwayMonths >= 6) runwayScore = 25;
    else if (runwayMonths >= 3) runwayScore = 20;
    else if (runwayMonths >= 1.5) runwayScore = 15;
    else if (runwayMonths >= 1) runwayScore = 10;
    else runwayScore = Math.max(0, Math.round(runwayMonths * 10));

    // Pillar 4: Anomaly & Budget Hygiene (0 to 25 pts)
    const pendingCritical = anomalies.filter((a) => a.status === 'Detected' && (a.severity === 'Critical' || a.severity === 'High')).length;
    let hygieneScore = 25;
    hygieneScore -= pendingCritical * 4;
    if (budgets.length > 0) {
      const overBudgetCount = budgets.filter((b) => b.spentAmount > b.budgetAmount).length;
      hygieneScore -= overBudgetCount * 3;
    }
    hygieneScore = Math.max(0, Math.min(25, hygieneScore));

    const totalScore = savingsScore + solvencyScore + runwayScore + hygieneScore;

    let grade = 'Needs Attention';
    if (totalScore >= 90) grade = 'A+ (Exceptional)';
    else if (totalScore >= 80) grade = 'A (Very Strong)';
    else if (totalScore >= 70) grade = 'B (Good / Stable)';
    else if (totalScore >= 55) grade = 'C (Fair)';

    const recommendations = [];
    if (runwayMonths < 3) {
      recommendations.push('Build a minimum 3-month operating cash buffer to improve liquidity stability.');
    }
    if (netFlowRate < 0.1) {
      recommendations.push('Review non-essential recurring subscriptions and vendor costs to increase monthly net margin.');
    }
    if (debtRatio > 0.5) {
      recommendations.push('Prioritize paying down high-interest liabilities to improve overall solvency.');
    }
    if (pendingCritical > 0) {
      recommendations.push(`Review and resolve ${pendingCritical} pending high-priority anomalies in transactions.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Financial posture is in excellent health. Continue maintaining prudent reserve allocations.');
    }

    res.json({
      success: true,
      healthScore: {
        totalScore,
        grade,
        pillars: {
          savingsAndCashFlow: {
            score: savingsScore,
            maxScore: 25,
            label: 'Savings & Net Flow',
            netFlowRate: Math.round(netFlowRate * 1000) / 10,
          },
          solvencyAndDebt: {
            score: solvencyScore,
            maxScore: 25,
            label: 'Solvency & Debt-to-Asset',
            debtRatio: Math.round(debtRatio * 1000) / 10,
            totalDebt,
          },
          cashRunway: {
            score: runwayScore,
            maxScore: 25,
            label: 'Liquidity & Runway',
            runwayMonths: Math.round(runwayMonths * 10) / 10,
            liquidCash,
          },
          hygieneAndGovernance: {
            score: hygieneScore,
            maxScore: 25,
            label: 'Anomaly & Governance',
            pendingAnomalies: pendingCritical,
          },
        },
        recommendations,
      },
    });
  } catch (err) {
    next(err);
  }
};

