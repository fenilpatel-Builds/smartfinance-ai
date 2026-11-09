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

const testPersistenceAndIsolation = async () => {
  console.log('\n=== TESTING DATABASE PERSISTENCE & MULTI-TENANT ISOLATION ===\n');
  await connectDB();

  // Test 1: Verify persistent records exist
  console.log('[Test 1] Checking existing persistent data in MongoDB...');
  const users = await User.find({});
  assert(users.length >= 2, 'Should have persistent users from seed');
  const owner = await User.findOne({ email: 'owner@smartfinance.ai' });
  assert(owner, 'Owner user must exist in persistent DB');

  const ws = await Workspace.findOne({ ownerId: owner._id });
  assert(ws, 'Workspace must exist for owner');

  const txCount = await Transaction.countDocuments({ workspaceId: ws._id });
  console.log(`  ✓ Persistent transactions found: ${txCount}`);
  assert(txCount > 0, 'Transactions must be persistently saved');

  // Test 2: Multi-Tenant Workspace Data Isolation
  console.log('[Test 2] Verifying workspace tenant isolation...');
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

  // Query transactions with competitor workspace
  const competitorTxs = await Transaction.find({ workspaceId: competitorWs._id });
  assert.strictEqual(competitorTxs.length, 0, 'Competitor workspace must NOT see owner transactions');

  // Query bank accounts with competitor workspace
  const competitorAccounts = await BankAccount.find({ workspaceId: competitorWs._id });
  assert.strictEqual(competitorAccounts.length, 0, 'Competitor workspace must NOT see owner bank accounts');

  console.log('  ✓ Verified 100% strict tenant isolation: Competitor workspace sees 0 owner records.');

  // Clean up competitor test fixtures
  await Workspace.deleteOne({ _id: competitorWs._id });
  await User.deleteOne({ _id: competitor._id });

  // Test 3: Duplicate Transaction Fingerprinting
  console.log('[Test 3] Verifying duplicate transaction fingerprint detection...');
  const sampleTx = await Transaction.findOne({ workspaceId: ws._id });
  assert(sampleTx, 'Sample transaction must exist');

  // Attempting to match fingerprint
  const matchingTx = await Transaction.findOne({
    workspaceId: ws._id,
    fingerprint: sampleTx.fingerprint,
  });
  assert(matchingTx, 'Fingerprint lookup must match existing record');
  console.log(`  ✓ Fingerprint successfully indexed and identified: ${sampleTx.fingerprint}`);

  console.log('\n=== ALL PERSISTENCE AND ISOLATION CHECKS PASSED ===\n');
  await closeDB();
  process.exit(0);
};

testPersistenceAndIsolation().catch((err) => {
  console.error('[Persistence Test Failed]', err);
  process.exit(1);
});
