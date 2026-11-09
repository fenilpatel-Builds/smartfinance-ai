import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

const MODELS = {
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
};

const runRestore = async () => {
  console.log('\n=== SMARTFINANCE AI DATABASE RESTORE UTILITY ===\n');

  const targetDirName = process.argv[2];
  if (!targetDirName) {
    console.error('Usage: node scripts/restore-db.js <backup-directory-or-path>');
    process.exit(1);
  }

  const backupDir = path.isAbsolute(targetDirName)
    ? targetDirName
    : path.resolve('./backups', targetDirName);

  if (!fs.existsSync(backupDir)) {
    console.error(`Error: Backup directory not found at ${backupDir}`);
    process.exit(1);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: manifest.json not found in ${backupDir}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`[Restore] Loaded manifest from ${manifest.timestamp}. Total documents: ${manifest.totalDocuments}`);

  await connectDB();

  let totalRestored = 0;

  for (const [modelName, info] of Object.entries(manifest.collections)) {
    const Model = MODELS[modelName];
    if (!Model) {
      console.warn(`[Restore Skip] Unknown model: ${modelName}`);
      continue;
    }

    const filePath = path.join(backupDir, info.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[Restore Skip] File missing: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    if (hash !== info.sha256) {
      console.error(`[Restore Integrity Warning] Checksum mismatch for ${info.file}!`);
    }

    const docs = JSON.parse(content);
    if (docs.length === 0) continue;

    // Upsert each document by _id to avoid destroying non-conflicting records
    let restoredCount = 0;
    for (const doc of docs) {
      await Model.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true });
      restoredCount++;
    }

    totalRestored += restoredCount;
    console.log(`[Restore] Restored ${modelName}: ${restoredCount} documents.`);
  }

  console.log(`\n[Restore Complete] Total documents restored/upserted: ${totalRestored}\n`);
  await closeDB();
  process.exit(0);
};

runRestore().catch((err) => {
  console.error('[Restore Failed]', err);
  process.exit(1);
});
