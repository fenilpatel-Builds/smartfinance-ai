import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Asset from '../models/Asset.js';
import Liability from '../models/Liability.js';
import EquityRecord from '../models/EquityRecord.js';

export const recalculateBankAccountBalance = async (bankAccountId, workspaceId) => {
  const account = await BankAccount.findOne({ _id: bankAccountId, workspaceId });
  if (!account) return 0;

  const result = await Transaction.aggregate([
    { $match: { bankAccountId: account._id, workspaceId } },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: '$credit' },
        totalDebits: { $sum: '$debit' },
      },
    },
  ]);

  const totalCredits = result.length > 0 ? result[0].totalCredits : 0;
  const totalDebits = result.length > 0 ? result[0].totalDebits : 0;

  const currentBalance = Math.round((account.openingBalance + totalCredits - totalDebits) * 100) / 100;
  account.currentCalculatedBalance = currentBalance;
  await account.save();

  return currentBalance;
};

export const detectInternalTransfers = async (workspaceId, thresholdDays = 3) => {
  // Find debit transactions that haven't been matched yet
  const debits = await Transaction.find({
    workspaceId,
    transactionType: 'debit',
    isInternalTransfer: false,
  }).sort({ transactionDate: 1 });

  let matchedCount = 0;

  for (const debitTx of debits) {
    const minDate = new Date(debitTx.transactionDate);
    minDate.setDate(minDate.getDate() - thresholdDays);
    const maxDate = new Date(debitTx.transactionDate);
    maxDate.setDate(maxDate.getDate() + thresholdDays);

    // Look for a credit in a DIFFERENT bank account belonging to the same workspace with the same amount
    const matchingCredit = await Transaction.findOne({
      workspaceId,
      bankAccountId: { $ne: debitTx.bankAccountId },
      transactionType: 'credit',
      amount: debitTx.amount,
      isInternalTransfer: false,
      transactionDate: { $gte: minDate, $lte: maxDate },
    });

    if (matchingCredit) {
      debitTx.isInternalTransfer = true;
      debitTx.linkedTransferTransactionId = matchingCredit._id;
      debitTx.categoryName = 'Own Account Transfer';
      await debitTx.save();

      matchingCredit.isInternalTransfer = true;
      matchingCredit.linkedTransferTransactionId = debitTx._id;
      matchingCredit.categoryName = 'Own Account Transfer';
      await matchingCredit.save();

      matchedCount++;
    }
  }

  return matchedCount;
};

export const calculateCompleteBalanceSheet = async (workspaceId, asOfDate = new Date()) => {
  // 1. Assets
  // Dynamic bank account balances
  const bankAccounts = await BankAccount.find({ workspaceId, isActive: true });
  const totalBankBalances = bankAccounts.reduce(
    (sum, acc) => sum + (acc.currentCalculatedBalance || 0),
    0
  );

  const manualAssets = await Asset.find({
    workspaceId,
    valuationDate: { $lte: asOfDate },
  });

  const assetCategories = {
    'Bank Accounts': Math.round(totalBankBalances * 100) / 100,
    'Cash': 0,
    'Accounts Receivable': 0,
    'Inventory': 0,
    'Fixed Assets': 0,
    'Investments': 0,
    'Other Assets': 0,
  };

  manualAssets.forEach((a) => {
    if (assetCategories[a.assetType] !== undefined) {
      assetCategories[a.assetType] += a.amount;
    } else {
      assetCategories['Other Assets'] += a.amount;
    }
  });

  const totalAssets = Math.round(
    Object.values(assetCategories).reduce((s, v) => s + v, 0) * 100
  ) / 100;

  // 2. Liabilities
  const manualLiabilities = await Liability.find({
    workspaceId,
    $or: [{ dueDate: { $exists: false } }, { dueDate: { $lte: asOfDate } }],
  });

  const liabilityCategories = {
    'Accounts Payable': 0,
    'Loans': 0,
    'Credit Card Outstanding': 0,
    'Taxes Payable': 0,
    'Other Liabilities': 0,
  };

  manualLiabilities.forEach((l) => {
    if (liabilityCategories[l.liabilityType] !== undefined) {
      liabilityCategories[l.liabilityType] += l.amount;
    } else {
      liabilityCategories['Other Liabilities'] += l.amount;
    }
  });

  const totalLiabilities = Math.round(
    Object.values(liabilityCategories).reduce((s, v) => s + v, 0) * 100
  ) / 100;

  // 3. Equity
  // Calculate Current Period Profit/Loss from transactions (excluding internal transfers)
  const txSummary = await Transaction.aggregate([
    {
      $match: {
        workspaceId,
        isInternalTransfer: false,
        transactionDate: { $lte: asOfDate },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: '$credit' },
        totalExpenses: { $sum: '$debit' },
      },
    },
  ]);

  const netPeriodProfit =
    txSummary.length > 0
      ? Math.round((txSummary[0].totalIncome - txSummary[0].totalExpenses) * 100) / 100
      : 0;

  const manualEquity = await EquityRecord.find({
    workspaceId,
    effectiveDate: { $lte: asOfDate },
  });

  const equityCategories = {
    "Owner's Capital": 0,
    'Retained Earnings': 0,
    'Current Period Profit/Loss': netPeriodProfit,
    'Other Equity': 0,
  };

  manualEquity.forEach((e) => {
    if (equityCategories[e.equityType] !== undefined) {
      equityCategories[e.equityType] += e.amount;
    } else {
      equityCategories['Other Equity'] += e.amount;
    }
  });

  const totalEquity = Math.round(
    Object.values(equityCategories).reduce((s, v) => s + v, 0) * 100
  ) / 100;

  const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;
  const balanceDifference = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;
  const roundingTolerance = 0.01;
  const isEquationBalanced = Math.abs(balanceDifference) <= roundingTolerance;

  const reconciliationStatus = isEquationBalanced
    ? 'BALANCED'
    : 'DISCREPANCY_DETECTED';

  const auditNote = isEquationBalanced
    ? 'Accounting equation verified: Assets = Liabilities + Equity'
    : `Balance sheet discrepancy detected: Assets (${totalAssets}) != Liabilities + Equity (${totalLiabilitiesAndEquity}). Difference: ₹${balanceDifference}`;

  return {
    asOfDate,
    roundingTolerance,
    reconciliationStatus,
    auditNote,
    assets: {
      items: assetCategories,
      total: totalAssets,
      bankAccountBreakdown: bankAccounts.map((b) => ({
        id: b._id,
        bankName: b.bankName,
        accountNickname: b.accountNickname || b.bankName,
        maskedNumber: b.maskedAccountNumber,
        balance: b.currentCalculatedBalance,
      })),
    },
    liabilities: {
      items: liabilityCategories,
      total: totalLiabilities,
      list: manualLiabilities,
    },
    equity: {
      items: equityCategories,
      total: totalEquity,
      currentPeriodProfit: netPeriodProfit,
      list: manualEquity,
    },
    totalLiabilitiesAndEquity,
    balanceDifference,
    isEquationBalanced,
  };
};

