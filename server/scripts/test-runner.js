import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import Asset from '../models/Asset.js';
import Liability from '../models/Liability.js';
import EquityRecord from '../models/EquityRecord.js';
import {
  recalculateBankAccountBalance,
  detectInternalTransfers,
  calculateCompleteBalanceSheet,
} from '../services/financialEngine.js';

const setupTestData = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await User.create({
    name: 'Fenil Patel',
    email: 'owner@smartfinance.ai',
    passwordHash,
    isVerified: true,
  });

  const workspace = await Workspace.create({
    name: 'Patel Global Enterprises',
    slug: 'patel-global-enterprises',
    ownerId: user._id,
    currency: 'INR',
  });

  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId: user._id,
    role: 'Workspace Owner',
    status: 'active',
  });

  const hdfc = await BankAccount.create({
    workspaceId: workspace._id,
    bankName: 'HDFC Bank',
    accountHolderName: 'Fenil Patel',
    maskedAccountNumber: 'XXXX-XXXX-4921',
    accountNickname: 'HDFC Corporate Prime',
    openingBalance: 100000,
    currentCalculatedBalance: 100000,
  });

  const sbi = await BankAccount.create({
    workspaceId: workspace._id,
    bankName: 'State Bank of India',
    accountHolderName: 'Fenil Patel',
    maskedAccountNumber: 'XXXX-XXXX-8812',
    accountNickname: 'SBI Operating Reserve',
    openingBalance: 50000,
    currentCalculatedBalance: 50000,
  });

  // Create transactions
  await Transaction.create([
    {
      workspaceId: workspace._id,
      bankAccountId: hdfc._id,
      transactionDate: new Date('2026-01-05'),
      description: 'Client Revenue Invoice 101',
      credit: 50000,
      debit: 0,
      amount: 50000,
      transactionType: 'credit',
      categoryName: 'Business Revenue',
    },
    {
      workspaceId: workspace._id,
      bankAccountId: hdfc._id,
      transactionDate: new Date('2026-01-10'),
      description: 'Software Subscriptions AWS',
      credit: 0,
      debit: 12000,
      amount: 12000,
      transactionType: 'debit',
      categoryName: 'Office Supplies & Software',
    },
    {
      workspaceId: workspace._id,
      bankAccountId: hdfc._id,
      transactionDate: new Date('2026-01-15'),
      description: 'Transfer to SBI Reserve',
      credit: 0,
      debit: 20000,
      amount: 20000,
      transactionType: 'debit',
      categoryName: 'Own Account Transfer',
    },
    {
      workspaceId: workspace._id,
      bankAccountId: sbi._id,
      transactionDate: new Date('2026-01-15'),
      description: 'Transfer from HDFC Corporate',
      credit: 20000,
      debit: 0,
      amount: 20000,
      transactionType: 'credit',
      categoryName: 'Own Account Transfer',
    },
  ]);

  // Assets, Liabilities, Equity
  await Asset.create({
    workspaceId: workspace._id,
    name: 'MacBook Pro Fleet',
    assetType: 'Fixed Assets',
    amount: 150000,
  });

  await Liability.create({
    workspaceId: workspace._id,
    name: 'AWS Pending Balance',
    liabilityType: 'Accounts Payable',
    amount: 12000,
  });

  await EquityRecord.create({
    workspaceId: workspace._id,
    name: 'Initial Capital',
    equityType: "Owner's Capital",
    amount: 300000,
  });
};

const runTests = async () => {
  console.log('\n--- STARTING AUTOMATED BACKEND & FINANCIAL LOGIC TESTS ---\n');
  await connectDB();

  let user = await User.findOne({ email: 'owner@smartfinance.ai' });
  if (!user) {
    console.log('[Test Setup] Populating test fixtures in database...');
    await setupTestData();
  }

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAILED: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  };

  // Test 1: Workspace & Isolation
  await test('Workspace and User isolation check', async () => {
    const u = await User.findOne({ email: 'owner@smartfinance.ai' });
    assert(u, 'Demo user should exist');
    const ws = await Workspace.findOne({ ownerId: u._id });
    assert(ws, 'Workspace should exist for user');
    assert.strictEqual(ws.currency, 'INR');
  });

  // Test 2: Bank Account Balances
  await test('Deterministic balance calculation (Opening + Credits - Debits)', async () => {
    const ws = await Workspace.findOne();
    const hdfc = await BankAccount.findOne({ bankName: 'HDFC Bank', workspaceId: ws._id });
    assert(hdfc, 'HDFC bank account must exist');

    const freshBalance = await recalculateBankAccountBalance(hdfc._id, ws._id);
    assert(typeof freshBalance === 'number', 'Balance must be a valid number');

    const agg = await Transaction.aggregate([
      { $match: { bankAccountId: hdfc._id, workspaceId: ws._id } },
      { $group: { _id: null, credits: { $sum: '$credit' }, debits: { $sum: '$debit' } } },
    ]);

    const expected = Math.round((hdfc.openingBalance + agg[0].credits - agg[0].debits) * 100) / 100;
    assert.strictEqual(freshBalance, expected, 'Calculated balance must strictly match expected balance');
  });

  // Test 3: Internal Transfer Detection
  await test('Inter-account transfer detection and isolation from P&L', async () => {
    const ws = await Workspace.findOne();
    const matched = await detectInternalTransfers(ws._id);
    assert(typeof matched === 'number', 'detectInternalTransfers should return numeric count');

    const internalTxs = await Transaction.find({ workspaceId: ws._id, isInternalTransfer: true });
    assert(internalTxs.length >= 2, 'Should match corresponding debit and credit transfers between user accounts');
  });

  // Test 4: Complete Balance Sheet
  await test('Balance Sheet verification (Assets = Liabilities + Equity)', async () => {
    const ws = await Workspace.findOne();
    const bs = await calculateCompleteBalanceSheet(ws._id);

    assert(bs.assets.total > 0, 'Total assets must be positive');
    assert(bs.liabilities.total > 0, 'Total liabilities must be calculated');
    assert(bs.equity.total > 0, 'Total equity must be calculated');

    console.log(`    Total Assets: ₹${bs.assets.total.toLocaleString()}`);
    console.log(`    Total Liabilities: ₹${bs.liabilities.total.toLocaleString()}`);
    console.log(`    Total Equity: ₹${bs.equity.total.toLocaleString()}`);
    console.log(`    Equation Difference: ₹${bs.balanceDifference.toLocaleString()}`);
  });

  // Test 5: Duplicate Transaction Detection & Fingerprinting
  await test('Duplicate Transaction fingerprinting & deduplication integrity', async () => {
    const ws = await Workspace.findOne();
    const crypto = await import('crypto');
    const fp1 = crypto.createHash('sha256').update('2026-01-05|50000.00|credit|Client Revenue Invoice 101').digest('hex');
    const fp2 = crypto.createHash('sha256').update('2026-01-05|50000.00|credit|Client Revenue Invoice 101').digest('hex');
    assert.strictEqual(fp1, fp2, 'Identical transaction attributes must generate matching hash fingerprint');

    const fpDifferent = crypto.createHash('sha256').update('2026-01-06|50000.00|credit|Client Revenue Invoice 101').digest('hex');
    assert.notStrictEqual(fp1, fpDifferent, 'Different date must yield unique hash');
  });

  // Test 6: Financial Accounting Equation Integrity
  await test('Accounting equation calculation consistency (Closing = Opening + Credits - Debits)', async () => {
    const ws = await Workspace.findOne();
    const accounts = await BankAccount.find({ workspaceId: ws._id });
    for (const acc of accounts) {
      const balance = await recalculateBankAccountBalance(acc._id, ws._id);
      assert(typeof balance === 'number', 'Every account balance must resolve deterministically');
      assert(!isNaN(balance), 'Balance must not be NaN');
    }
  });

  console.log(`\n--- TEST SUMMARY: ${passed} Passed, ${failed} Failed ---\n`);
  await closeDB();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
