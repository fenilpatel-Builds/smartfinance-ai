import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';

// Import all models
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

const runBackup = async () => {
  console.log('\n=== SMARTFINANCE AI DATABASE BACKUP UTILITY ===\n');
  await connectDB();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(`./backups/backup-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    collections: {},
    totalDocuments: 0,
  };

  for (const [modelName, Model] of Object.entries(MODELS)) {
    try {
      const docs = await Model.find({}).lean();
      const filePath = path.join(backupDir, `${modelName}.json`);
      const content = JSON.stringify(docs, null, 2);

      fs.writeFileSync(filePath, content, 'utf8');

      const hash = crypto.createHash('sha256').update(content).digest('hex');

      manifest.collections[modelName] = {
        count: docs.length,
        file: `${modelName}.json`,
        sha256: hash,
      };

      manifest.totalDocuments += docs.length;
      console.log(`[Backup] Exported ${modelName}: ${docs.length} documents -> ${modelName}.json`);
    } catch (err) {
      console.error(`[Backup Error] Failed exporting ${modelName}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n[Backup Complete] Archive successfully created at:\n${backupDir}`);
  console.log(`[Backup Summary] Total Documents: ${manifest.totalDocuments}`);

  await closeDB();
  process.exit(0);
};

runBackup().catch((err) => {
  console.error('[Backup Failed]', err);
  process.exit(1);
});
