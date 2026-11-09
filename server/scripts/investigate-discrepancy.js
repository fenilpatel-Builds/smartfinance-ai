import { connectDB, closeDB } from '../config/db.js';
import Workspace from '../models/Workspace.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Asset from '../models/Asset.js';
import Liability from '../models/Liability.js';
import EquityRecord from '../models/EquityRecord.js';
import { calculateCompleteBalanceSheet } from '../services/financialEngine.js';

async function investigate() {
  await connectDB();
  const ws = await Workspace.findOne();
  console.log('=== WORKSPACE:', ws.name, ws._id.toString());

  const accounts = await BankAccount.find({ workspaceId: ws._id });
  let totalOpening = 0;
  let totalCurrentBalances = 0;

  for (const acc of accounts) {
    const agg = await Transaction.aggregate([
      { $match: { bankAccountId: acc._id, workspaceId: ws._id } },
      { $group: { _id: null, credits: { $sum: '$credit' }, debits: { $sum: '$debit' } } },
    ]);
    const credits = agg[0]?.credits || 0;
    const debits = agg[0]?.debits || 0;
    console.log(`Account: ${acc.bankName} (${acc.maskedAccountNumber})`, {
      openingBalance: acc.openingBalance,
      credits,
      debits,
      netChange: credits - debits,
      currentBalance: acc.currentCalculatedBalance,
    });
    totalOpening += acc.openingBalance;
    totalCurrentBalances += acc.currentCalculatedBalance;
  }
  console.log('Total Opening Balances across all accounts:', totalOpening);
  console.log('Total Current Bank Balances:', totalCurrentBalances);

  // Check all transactions
  const txs = await Transaction.find({ workspaceId: ws._id });
  const internalTxs = txs.filter((t) => t.isInternalTransfer);
  const externalTxs = txs.filter((t) => !t.isInternalTransfer);

  console.log(`Transactions: ${txs.length} total, ${internalTxs.length} internal, ${externalTxs.length} external`);

  let totalExtIncome = 0;
  let totalExtExpense = 0;
  for (const t of externalTxs) {
    if (t.transactionType === 'credit') totalExtIncome += t.amount;
    if (t.transactionType === 'debit') totalExtExpense += t.amount;
  }

  const netPeriodProfit = totalExtIncome - totalExtExpense;
  console.log('External Income:', totalExtIncome);
  console.log('External Expenses:', totalExtExpense);
  console.log('Net Period Profit (P&L):', netPeriodProfit);

  // Check Assets
  const assets = await Asset.find({ workspaceId: ws._id });
  let nonBankAssets = 0;
  console.log('\n--- ASSET RECORDS ---');
  for (const a of assets) {
    console.log(`  Asset: ${a.name} | Type: ${a.assetType} | Amount: ₹${a.amount}`);
    nonBankAssets += a.amount;
  }
  console.log('Total Non-Bank Assets:', nonBankAssets);
  console.log('Total Assets (Bank + Non-Bank):', totalCurrentBalances + nonBankAssets);

  // Check Liabilities
  const liabilities = await Liability.find({ workspaceId: ws._id });
  let totalLiabilities = 0;
  console.log('\n--- LIABILITY RECORDS ---');
  for (const l of liabilities) {
    console.log(`  Liability: ${l.name} | Type: ${l.liabilityType} | Amount: ₹${l.amount}`);
    totalLiabilities += l.amount;
  }
  console.log('Total Liabilities:', totalLiabilities);

  // Check Equity
  const equityRecords = await EquityRecord.find({ workspaceId: ws._id });
  let totalManualEquity = 0;
  console.log('\n--- EQUITY RECORDS ---');
  for (const e of equityRecords) {
    console.log(`  Equity: ${e.name} | Type: ${e.equityType} | Amount: ₹${e.amount}`);
    totalManualEquity += e.amount;
  }
  console.log('Total Manual Equity:', totalManualEquity);
  console.log('Net Period Profit from transactions:', netPeriodProfit);
  console.log('Total Equity (Manual + Net Period Profit):', totalManualEquity + netPeriodProfit);

  // Total Liabilities + Equity
  const totalLAndE = totalLiabilities + totalManualEquity + netPeriodProfit;
  const totalA = totalCurrentBalances + nonBankAssets;
  console.log('\n--- BALANCE SHEET EQUATION ---');
  console.log('Total Assets:', totalA);
  console.log('Total Liabilities + Equity:', totalLAndE);
  console.log('Discrepancy (Assets - [Liabilities + Equity]):', totalA - totalLAndE);

  // Run official calculation function
  const bs = await calculateCompleteBalanceSheet(ws._id);
  console.log('\nFrom calculateCompleteBalanceSheet():', {
    assetsTotal: bs.assets.total,
    liabilitiesTotal: bs.liabilities.total,
    equityTotal: bs.equity.total,
    totalLiabilitiesAndEquity: bs.totalLiabilitiesAndEquity,
    balanceDifference: bs.balanceDifference,
    isEquationBalanced: bs.isEquationBalanced,
  });

  await closeDB();
}

investigate();

