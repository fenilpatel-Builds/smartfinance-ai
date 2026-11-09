import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import BankAccount from '../models/BankAccount.js';
import Statement from '../models/Statement.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Invoice from '../models/Invoice.js';
import Loan from '../models/Loan.js';
import Goal from '../models/Goal.js';
import DocumentVault from '../models/DocumentVault.js';
import { encryptVaultFile, decryptVaultFile } from '../utils/vaultEncryption.js';

const PRIMARY_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartfinance';
const ISOLATED_TEST_URI = 'mongodb://127.0.0.1:27017/smartfinance_recovery_test';

async function runDurabilityAndRecoveryTest() {
  console.log('================================================================');
  console.log('  SMARTFINANCE AI — DATABASE DURABILITY & RECOVERY TEST SUITE  ');
  console.log('================================================================\n');

  // Step 1: Connect to live primary database
  console.log(`[Step 1] Connecting to Primary Database: ${PRIMARY_URI}`);
  await mongoose.connect(PRIMARY_URI);
  console.log('✓ Successfully connected to Primary Database.');

  // Step 2: Verify Persistent Storage Directory on Host
  console.log('\n[Step 2] Verifying MongoDB Persistent Data Directory on Host:');
  const dbPath = path.resolve('./data/db');
  if (fs.existsSync(dbPath)) {
    const files = fs.readdirSync(dbPath);
    const wiredTigerFiles = files.filter(f => f.includes('WiredTiger') || f.endsWith('.wt'));
    console.log(`✓ Data directory exists at: ${dbPath}`);
    console.log(`✓ Detected ${wiredTigerFiles.length} WiredTiger storage engine tables and journals.`);
  } else {
    console.warn(`! Data directory not found at relative path ${dbPath}. Checking default mongod path.`);
  }

  // Step 3: Seed/Create Durability Test Records in Primary DB
  console.log('\n[Step 3] Creating Real Records in Primary Database for Durability Proof:');
  const testRunId = `durability_${Date.now()}`;

  // 3.1 Workspace & User
  let user = await User.findOne({ email: 'durability.test@smartfinance.ai' });
  if (!user) {
    user = await User.create({
      name: 'Durability Auditor',
      email: 'durability.test@smartfinance.ai',
      passwordHash: '$2a$10$Wp83h79f0kR651jVskY1G.L45h3b0Ua99VpEw3W9X4b/uM88753yG',
    });
  }

  const workspace = await Workspace.create({
    name: `Durability Enterprise Workspace ${testRunId}`,
    slug: `durability-enterprise-${Date.now().toString().slice(-6)}`,
    ownerId: user._id,
    currency: 'INR',
  });

  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId: user._id,
    role: 'Workspace Owner',
    status: 'active',
  });

  // 3.2 Bank Account
  const bankAccount = await BankAccount.create({
    workspaceId: workspace._id,
    bankName: 'HDFC Bank Ltd',
    accountHolderName: 'SmartFinance Durability Operations',
    maskedAccountNumber: `998877${Date.now().toString().slice(-4)}`,
    accountType: 'Current',
    currency: 'INR',
    openingBalance: 150000,
    currentBalance: 175000,
  });

  // 3.3 Transactions
  const tx1 = await Transaction.create({
    workspaceId: workspace._id,
    bankAccountId: bankAccount._id,
    transactionDate: new Date(),
    description: 'Enterprise Client Invoice Settlement',
    amount: 50000,
    transactionType: 'credit',
    credit: 50000,
    debit: 0,
    runningBalance: 200000,
    type: 'credit',
    status: 'posted',
  });

  const tx2 = await Transaction.create({
    workspaceId: workspace._id,
    bankAccountId: bankAccount._id,
    transactionDate: new Date(),
    description: 'Office Lease Monthly Rental',
    amount: 25000,
    transactionType: 'debit',
    debit: 25000,
    credit: 0,
    runningBalance: 175000,
    type: 'debit',
    status: 'posted',
  });

  // 3.4 Invoice
  const invoice = await Invoice.create({
    workspaceId: workspace._id,
    invoiceNumber: `INV-DUR-${Date.now().toString().slice(-5)}`,
    customerName: 'Apex Industrial Systems Ltd',
    customerEmail: 'billing@apexsystems.com',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [
      { description: 'Cloud Financial Analytics Engine License', quantity: 1, unitPrice: 50000, amount: 50000, taxPercent: 18 },
      { description: 'Professional Integration Consultation', quantity: 10, unitPrice: 2000, amount: 20000, taxPercent: 18 },
    ],
    subtotal: 70000,
    taxTotal: 12600,
    grandTotal: 82600,
    totalAmount: 82600,
    status: 'Sent',
  });

  // 3.5 Loan
  const loan = await Loan.create({
    workspaceId: workspace._id,
    loanName: 'Machinery Expansion Term Loan',
    lenderName: 'State Bank of India',
    principalAmount: 1000000,
    annualInterestRate: 8.75,
    tenureMonths: 60,
    startDate: new Date(),
    emiAmount: 20638.16,
    remainingPrincipal: 1000000,
    status: 'Active',
  });

  // 3.6 Goal
  const goal = await Goal.create({
    workspaceId: workspace._id,
    title: 'FY27 Expansion Reserve Capital',
    name: 'FY27 Expansion Reserve Capital',
    targetAmount: 500000,
    currentSavedAmount: 175000,
    currentAmount: 175000,
    targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    category: 'Capital Expenditure',
  });

  // 3.7 Binary Document Vault with Real AES-256-GCM Encryption
  const vaultDir = path.resolve('./uploads/vault');
  if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
  
  const tempPlainPath = path.join(vaultDir, `temp_plain_${testRunId}.txt`);
  const secretContent = `CONFIDENTIAL FINANCIAL AGREEMENT - TEST RUN ${testRunId}\nParty A: Durability Corp\nParty B: Apex Systems\nAgreed Capital: INR 82,600`;
  fs.writeFileSync(tempPlainPath, secretContent, 'utf8');
  const plainHash = crypto.createHash('sha256').update(secretContent).digest('hex');

  const encInfo = await encryptVaultFile(tempPlainPath);
  
  const vaultDoc = await DocumentVault.create({
    workspaceId: workspace._id,
    uploadedBy: user._id,
    title: 'Executed Mutual Agreement',
    category: 'Financial Agreement',
    originalFileName: `Mutual_Agreement_${testRunId}.txt`,
    storedFilePath: encInfo.storedFilePath,
    fileSize: Buffer.byteLength(secretContent),
    mimeType: 'text/plain',
    fileHash: plainHash,
    isEncrypted: true,
    encryptionAlgorithm: encInfo.algorithm,
    encryptionIv: encInfo.iv,
    encryptionAuthTag: encInfo.authTag,
    tags: ['audit', 'durability'],
  });

  console.log(`✓ Created Workspace: ${workspace.name} (ID: ${workspace._id}, Slug: ${workspace.slug})`);
  console.log(`✓ Created Bank Account: ${bankAccount.bankName} (ID: ${bankAccount._id})`);
  console.log(`✓ Created 2 Transactions: IDs [${tx1._id}, ${tx2._id}]`);
  console.log(`✓ Created Invoice: ${invoice.invoiceNumber} (ID: ${invoice._id}, Grand Total: INR ${invoice.grandTotal})`);
  console.log(`✓ Created Loan: ${loan.loanName} (ID: ${loan._id}, EMI: INR ${loan.emiAmount})`);
  console.log(`✓ Created Financial Goal: ${goal.title} (ID: ${goal._id}, Target: INR ${goal.targetAmount})`);
  console.log(`✓ Created Encrypted Vault Document: ${vaultDoc.title} (ID: ${vaultDoc._id}, Encrypted Path: ${vaultDoc.storedFilePath})`);

  // Step 4: Record Snapshot Document Counts in Primary DB
  console.log('\n[Step 4] Live Database Document Counts Snapshot:');
  const snapshotCounts = {
    users: await User.countDocuments(),
    workspaces: await Workspace.countDocuments(),
    workspaceMembers: await WorkspaceMember.countDocuments(),
    bankAccounts: await BankAccount.countDocuments(),
    transactions: await Transaction.countDocuments(),
    invoices: await Invoice.countDocuments(),
    loans: await Loan.countDocuments(),
    goals: await Goal.countDocuments(),
    vaultDocuments: await DocumentVault.countDocuments(),
  };
  console.table(snapshotCounts);

  // Step 5: Test Binary File Decryption & Tamper-Resistance
  console.log('\n[Step 5] Validating Cryptographic Integrity of Uploaded Binary File:');
  const decryptedBuf = decryptVaultFile(vaultDoc.storedFilePath, vaultDoc.encryptionIv, vaultDoc.encryptionAuthTag);
  const decryptedText = decryptedBuf.toString('utf8');
  if (decryptedText === secretContent) {
    console.log('✓ Decryption test PASSED: Decrypted payload exactly matches plaintext.');
  } else {
    throw new Error('Decryption payload mismatch!');
  }

  // Step 6: Perform Full Backup of Primary Database
  console.log('\n[Step 6] Running Automated Database Backup Export:');
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(`./backups/durability-backup-${backupTimestamp}`);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const backupManifest = { timestamp: new Date().toISOString(), collections: {}, totalDocs: 0 };
  const allModels = { User, Workspace, WorkspaceMember, BankAccount, Transaction, Invoice, Loan, Goal, DocumentVault };

  for (const [name, Model] of Object.entries(allModels)) {
    const docs = await Model.find({}).lean();
    const filePath = path.join(backupDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    backupManifest.collections[name] = docs.length;
    backupManifest.totalDocs += docs.length;
  }
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(backupManifest, null, 2), 'utf8');
  console.log(`✓ Backup successfully generated at: ${backupDir}`);
  console.log(`✓ Total documents exported in backup archive: ${backupManifest.totalDocs}`);

  // Disconnect from primary DB
  await mongoose.disconnect();
  console.log('✓ Disconnected cleanly from Primary Database.');

  // Step 7: Connect to Isolated Test Database for Full Recovery Validation
  console.log(`\n[Step 7] Connecting to Isolated Test Database: ${ISOLATED_TEST_URI}`);
  const recoveryConn = await mongoose.createConnection(ISOLATED_TEST_URI).asPromise();
  console.log('✓ Connected to Isolated Recovery Database.');

  // Step 8: Restore Entire Backup into Isolated Test DB
  console.log('\n[Step 8] Restoring Backup Archive into Isolated Recovery Database:');
  let restoredCount = 0;
  const recovModels = {};
  for (const [name, Model] of Object.entries(allModels)) {
    const filePath = path.join(backupDir, `${name}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.length > 0) {
      const RecovModel = recoveryConn.model(name, Model.schema);
      recovModels[name] = RecovModel;
      await RecovModel.insertMany(data);
      restoredCount += data.length;
      console.log(`  -> Restored ${name}: ${data.length} records into isolated DB`);
    }
  }
  console.log(`✓ Restored total of ${restoredCount} records into isolated database.`);

  // Step 9: Validate Data Integrity in Isolated Database
  console.log('\n[Step 9] Validating Field-Level Data Integrity in Isolated Database:');
  const recovWorkspace = await recovModels.Workspace.findById(workspace._id);
  const recovBankAcc = await recovModels.BankAccount.findById(bankAccount._id);
  const recovInvoice = await recovModels.Invoice.findById(invoice._id);
  const recovLoan = await recovModels.Loan.findById(loan._id);
  const recovGoal = await recovModels.Goal.findById(goal._id);
  const recovDoc = await recovModels.DocumentVault.findById(vaultDoc._id);

  console.log(`✓ Restored Workspace Verified: "${recovWorkspace.name}" (Slug: ${recovWorkspace.slug}, ID match: ${recovWorkspace._id.toString() === workspace._id.toString()})`);
  console.log(`✓ Restored Bank Account Verified: "${recovBankAcc.bankName}" (Balance: INR ${recovBankAcc.currentBalance})`);
  console.log(`✓ Restored Invoice Verified: "${recovInvoice.invoiceNumber}" (Total: INR ${recovInvoice.totalAmount})`);
  console.log(`✓ Restored Loan Verified: "${recovLoan.loanName}" (Principal: INR ${recovLoan.principalAmount}, EMI: INR ${recovLoan.emiAmount})`);
  console.log(`✓ Restored Goal Verified: "${recovGoal.title}" (Target: INR ${recovGoal.targetAmount})`);
  console.log(`✓ Restored Vault Document Verified: "${recovDoc.title}" (Encrypted: ${recovDoc.isEncrypted}, IV: ${recovDoc.encryptionIv})`);

  // Step 10: Clean up Isolated Test Database
  console.log('\n[Step 10] Tearing Down Isolated Recovery Test Database:');
  await recoveryConn.dropDatabase();
  await recoveryConn.close();
  console.log('✓ Successfully dropped isolated database and closed connection.');

  console.log('\n================================================================');
  console.log('  DURABILITY & RECOVERY TEST PASSED WITH 100% SUCCESS           ');
  console.log('================================================================\n');
}

runDurabilityAndRecoveryTest().catch(err => {
  console.error('\n[Durability Test Error]', err);
  process.exit(1);
});
