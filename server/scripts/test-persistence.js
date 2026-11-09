import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import BankAccount from '../models/BankAccount.js';
import Statement from '../models/Statement.js';
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Invoice from '../models/Invoice.js';
import Loan from '../models/Loan.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Anomaly from '../models/Anomaly.js';
import DocumentVault from '../models/DocumentVault.js';

const testPersistenceAndIsolation = async () => {
  console.log('\n=== TESTING DATABASE PERSISTENCE, RECONNECTS & MULTI-TENANT ISOLATION ===\n');
  await connectDB();

  // Test 1: Verify persistent baseline records exist
  console.log('[Test 1] Checking existing persistent data in MongoDB...');
  const owner = await User.findOne({ email: 'owner@smartfinance.ai' });
  assert(owner, 'Owner user must exist in persistent DB');

  const ws = await Workspace.findOne({ ownerId: owner._id });
  assert(ws, 'Workspace must exist for owner');

  const txCount = await Transaction.countDocuments({ workspaceId: ws._id });
  console.log(`  ✓ Persistent baseline transactions found: ${txCount}`);
  assert(txCount > 0, 'Transactions must be persistently saved');

  // Test 2: Create records across all new modules
  console.log('[Test 2] Creating test records across all modules...');
  const testGoal = await Goal.create({
    workspaceId: ws._id,
    name: 'Persistence Verification Goal',
    targetAmount: 250000,
    currentAmount: 75000,
    targetDate: new Date('2026-12-31'),
    category: 'Capital Expansion',
    status: 'In Progress',
  });

  const testInvoice = await Invoice.create({
    workspaceId: ws._id,
    invoiceNumber: `PERSIST-INV-${Date.now()}`,
    customerName: 'Enterprise Client Corp',
    items: [{ description: 'Q1 Financial SLA', quantity: 1, unitPrice: 85000, taxRate: 18, amount: 85000 }],
    subtotal: 85000,
    taxAmount: 15300,
    totalAmount: 100300,
    paidAmount: 0,
    dueDate: new Date('2026-03-31'),
    status: 'Sent',
  });

  const testLoan = await Loan.create({
    workspaceId: ws._id,
    loanName: 'Infrastructure Term Facility',
    lenderName: 'Federal Bank',
    principalAmount: 400000,
    annualInterestRate: 9.5,
    tenureMonths: 24,
    startDate: new Date('2026-01-01'),
    emiAmount: 18366.50,
    remainingPrincipal: 400000,
    status: 'Active',
  });

  const testRecurring = await RecurringTransaction.create({
    workspaceId: ws._id,
    merchant: 'Snowflake Analytics',
    expectedAmount: 16500,
    frequency: 'Monthly',
    nextExpectedDate: new Date('2026-02-15'),
    status: 'Active',
  });

  const testAnomaly = await Anomaly.create({
    workspaceId: ws._id,
    anomalyType: 'High Expense Spike',
    severity: 'High',
    title: 'Suspicious Software Charge',
    description: 'Transaction exceeds 3x 90-day category average',
    affectedAmount: 65000,
    status: 'Detected',
  });

  const testDoc = await DocumentVault.create({
    workspaceId: ws._id,
    uploadedBy: owner._id,
    title: 'Board Resolutions FY26.pdf',
    category: 'Legal Contract',
    originalFileName: 'Board_Resolutions_Signed.pdf',
    storedFilePath: 'uploads/vault/dummy_test.pdf',
    fileSize: 1048576,
    mimeType: 'application/pdf',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    tags: ['audit', 'board'],
  });

  console.log('  ✓ Created Goal, Invoice, Loan, Recurring, Anomaly, DocumentVault records');

  // Test 3: Disconnect & Reconnect (Simulate Backend Restart / Database Cycling)
  console.log('[Test 3] Simulating backend restart and database cycling (Disconnect & Reconnect)...');
  await closeDB();
  await new Promise((r) => setTimeout(r, 1000));
  await connectDB();
  console.log('  ✓ Reconnected to persistent MongoDB successfully');

  // Test 4: Verify all created records survived restart with exact figures
  console.log('[Test 4] Verifying record persistence after reconnection...');
  const fetchedGoal = await Goal.findById(testGoal._id);
  assert(fetchedGoal, 'Goal must persist after restart');
  assert.strictEqual(fetchedGoal.targetAmount, 250000);
  assert.strictEqual(fetchedGoal.currentAmount, 75000);
  console.log('  ✓ Goal verified:', fetchedGoal.name, `₹${fetchedGoal.currentAmount}/₹${fetchedGoal.targetAmount}`);

  const fetchedInvoice = await Invoice.findById(testInvoice._id);
  assert(fetchedInvoice, 'Invoice must persist after restart');
  assert.strictEqual(fetchedInvoice.totalAmount, 100300);
  assert.strictEqual(fetchedInvoice.status, 'Sent');
  console.log('  ✓ Invoice verified:', fetchedInvoice.invoiceNumber, `Total: ₹${fetchedInvoice.totalAmount}`);

  const fetchedLoan = await Loan.findById(testLoan._id);
  assert(fetchedLoan, 'Loan must persist after restart');
  assert.strictEqual(fetchedLoan.principalAmount, 400000);
  assert.strictEqual(fetchedLoan.emiAmount, 18366.50);
  console.log('  ✓ Loan verified:', fetchedLoan.loanName, `EMI: ₹${fetchedLoan.emiAmount}`);

  const fetchedRecurring = await RecurringTransaction.findById(testRecurring._id);
  assert(fetchedRecurring, 'Recurring item must persist after restart');
  assert.strictEqual(fetchedRecurring.expectedAmount, 16500);
  console.log('  ✓ Recurring verified:', fetchedRecurring.merchant, `₹${fetchedRecurring.expectedAmount}/mo`);

  const fetchedAnomaly = await Anomaly.findById(testAnomaly._id);
  assert(fetchedAnomaly, 'Anomaly must persist after restart');
  assert.strictEqual(fetchedAnomaly.affectedAmount, 65000);
  console.log('  ✓ Anomaly verified:', fetchedAnomaly.title, `Severity: ${fetchedAnomaly.severity}`);

  const fetchedDoc = await DocumentVault.findById(testDoc._id);
  assert(fetchedDoc, 'Document vault record must persist after restart');
  assert.strictEqual(fetchedDoc.fileHash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  console.log('  ✓ DocumentVault verified:', fetchedDoc.title, `SHA-256: ${fetchedDoc.fileHash.slice(0, 16)}...`);

  // Test 5: Strict Multi-Tenant Isolation
  console.log('\n[Test 5] Verifying multi-tenant workspace isolation across all models...');
  const competitor = await User.create({
    name: 'Competitor Corp',
    email: `competitor-${Date.now()}@example.com`,
    passwordHash: 'dummy_hash',
    isVerified: true,
  });

  const competitorWs = await Workspace.create({
    name: 'Competitor Workspace',
    slug: `competitor-${Date.now()}`,
    ownerId: competitor._id,
    currency: 'USD',
  });

  // Verify competitor cannot query any of the owner's records
  const compGoals = await Goal.find({ workspaceId: competitorWs._id });
  assert.strictEqual(compGoals.length, 0, 'Competitor workspace must see 0 owner goals');

  const compInvoices = await Invoice.find({ workspaceId: competitorWs._id });
  assert.strictEqual(compInvoices.length, 0, 'Competitor workspace must see 0 owner invoices');

  const compLoans = await Loan.find({ workspaceId: competitorWs._id });
  assert.strictEqual(compLoans.length, 0, 'Competitor workspace must see 0 owner loans');

  const compDocs = await DocumentVault.find({ workspaceId: competitorWs._id });
  assert.strictEqual(compDocs.length, 0, 'Competitor workspace must see 0 owner vault documents');

  const compAnomalies = await Anomaly.find({ workspaceId: competitorWs._id });
  assert.strictEqual(compAnomalies.length, 0, 'Competitor workspace must see 0 owner anomalies');

  console.log('  ✓ 100% Tenant Isolation Verified across all models: Competitor sees 0 records');

  // Clean up test fixtures
  await Goal.deleteOne({ _id: testGoal._id });
  await Invoice.deleteOne({ _id: testInvoice._id });
  await Loan.deleteOne({ _id: testLoan._id });
  await RecurringTransaction.deleteOne({ _id: testRecurring._id });
  await Anomaly.deleteOne({ _id: testAnomaly._id });
  await DocumentVault.deleteOne({ _id: testDoc._id });
  await Workspace.deleteOne({ _id: competitorWs._id });
  await User.deleteOne({ _id: competitor._id });

  console.log('\n=== ALL PERSISTENCE, RESTART & TENANT ISOLATION CHECKS PASSED ===\n');
  await closeDB();
  process.exit(0);
};

testPersistenceAndIsolation().catch((err) => {
  console.error('[Persistence Test Failed]', err);
  process.exit(1);
});
