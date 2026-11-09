import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';

import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import BankAccount from '../models/BankAccount.js';
import Statement from '../models/Statement.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import CategorizationRule from '../models/CategorizationRule.js';
import Budget from '../models/Budget.js';
import Asset from '../models/Asset.js';
import Liability from '../models/Liability.js';
import EquityRecord from '../models/EquityRecord.js';
import Reconciliation from '../models/Reconciliation.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Goal from '../models/Goal.js';
import Invoice from '../models/Invoice.js';
import Loan from '../models/Loan.js';
import DocumentVault from '../models/DocumentVault.js';
import Anomaly from '../models/Anomaly.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

const MODELS = [
  User,
  Workspace,
  WorkspaceMember,
  BankAccount,
  Statement,
  Transaction,
  Category,
  CategorizationRule,
  Budget,
  Asset,
  Liability,
  EquityRecord,
  Reconciliation,
  RecurringTransaction,
  Goal,
  Invoice,
  Loan,
  DocumentVault,
  Anomaly,
  AuditLog,
  Notification,
];

const runMigration = async () => {
  console.log('\n=== SMARTFINANCE AI DATABASE INDEX & SCHEMA MIGRATION ===\n');
  await connectDB();

  for (const Model of MODELS) {
    try {
      const modelName = Model.modelName;
      console.log(`[Migration] Synchronizing indexes for: ${modelName}...`);
      await Model.syncIndexes();
      const indexes = await Model.collection.indexes();
      console.log(`  ✓ ${modelName} active indexes: ${indexes.map((idx) => idx.name).join(', ')}`);
    } catch (err) {
      console.error(`  ✗ Error synchronizing indexes for ${Model.modelName}:`, err.message);
    }
  }

  console.log('\n[Migration Complete] All database collections and indexes are synchronized.\n');
  await closeDB();
  process.exit(0);
};

runMigration().catch((err) => {
  console.error('[Migration Failed]', err);
  process.exit(1);
});
