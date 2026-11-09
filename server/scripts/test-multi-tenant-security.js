import axios from 'axios';
import jwt from 'jsonwebtoken';
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
import CategorizationRule from '../models/CategorizationRule.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Invoice from '../models/Invoice.js';
import Loan from '../models/Loan.js';
import DocumentVault from '../models/DocumentVault.js';
import Anomaly from '../models/Anomaly.js';
import Reconciliation from '../models/Reconciliation.js';
import { encryptVaultFile } from '../utils/vaultEncryption.js';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_smartfinance_prod_2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      userId: user._id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runMultiTenantSecurityTest() {
  console.log('================================================================');
  console.log('  SMARTFINANCE AI — MULTI-TENANT ISOLATION & SECURITY TEST SUITE ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartfinance');

  const runId = Date.now().toString().slice(-5);

  // 1. Setup User Alpha and Workspace Alpha
  const userAlpha = await User.create({
    name: `User Alpha ${runId}`,
    email: `alpha.${runId}@smartfinance.ai`,
    passwordHash: '$2a$10$Wp83h79f0kR651jVskY1G.L45h3b0Ua99VpEw3W9X4b/uM88753yG',
  });
  const wsAlpha = await Workspace.create({
    name: `Alpha Corp ${runId}`,
    slug: `alpha-corp-${runId}`,
    ownerId: userAlpha._id,
    currency: 'INR',
  });
  await WorkspaceMember.create({
    workspaceId: wsAlpha._id,
    userId: userAlpha._id,
    role: 'Workspace Owner',
    status: 'active',
  });
  const tokenAlpha = generateToken(userAlpha);

  // 2. Setup User Beta and Workspace Beta
  const userBeta = await User.create({
    name: `User Beta ${runId}`,
    email: `beta.${runId}@smartfinance.ai`,
    passwordHash: '$2a$10$Wp83h79f0kR651jVskY1G.L45h3b0Ua99VpEw3W9X4b/uM88753yG',
  });
  const wsBeta = await Workspace.create({
    name: `Beta Industries ${runId}`,
    slug: `beta-industries-${runId}`,
    ownerId: userBeta._id,
    currency: 'INR',
  });
  await WorkspaceMember.create({
    workspaceId: wsBeta._id,
    userId: userBeta._id,
    role: 'Workspace Owner',
    status: 'active',
  });
  const tokenBeta = generateToken(userBeta);

  console.log(`✓ Workspace Alpha initialized: ${wsAlpha.name} (ID: ${wsAlpha._id})`);
  console.log(`✓ Workspace Beta initialized:  ${wsBeta.name} (ID: ${wsBeta._id})\n`);

  // 3. Create Resources Belonging Exclusively to Workspace Beta
  console.log('[Setup] Instantiating 14 Distinct Entities inside Workspace Beta:');

  const betaBank = await BankAccount.create({
    workspaceId: wsBeta._id,
    bankName: 'ICICI Commercial Beta',
    accountHolderName: 'Beta Industries Ltd',
    maskedAccountNumber: `112233${runId}`,
    accountType: 'Current',
    currency: 'INR',
    currentBalance: 500000,
  });

  const betaStmt = await Statement.create({
    workspaceId: wsBeta._id,
    bankAccountId: betaBank._id,
    originalFileName: `ICICI_Beta_Statement_${runId}.pdf`,
    storedFilePath: `uploads/statements/beta_${runId}.pdf`,
    mimeType: 'application/pdf',
    fileSize: 10240,
    fileHash: 'sha256_dummy_hash_beta',
    importBatchId: `batch_beta_${runId}`,
    status: 'processed',
  });

  const betaTx = await Transaction.create({
    workspaceId: wsBeta._id,
    bankAccountId: betaBank._id,
    statementId: betaStmt._id,
    importBatchId: betaStmt.importBatchId,
    transactionDate: new Date(),
    description: 'Secret Beta Strategic Acquisition',
    amount: 150000,
    transactionType: 'debit',
    debit: 150000,
    credit: 0,
    runningBalance: 350000,
    status: 'posted',
  });

  const betaCat = await Category.create({
    workspaceId: wsBeta._id,
    name: `Beta Confidential R&D ${runId}`,
    type: 'expense',
  });

  const betaRule = await CategorizationRule.create({
    workspaceId: wsBeta._id,
    ruleName: 'Auto-tag Beta R&D',
    matchingConditions: [
      {
        field: 'description',
        operator: 'contains',
        value: 'STRATEGIC_ACQUISITION',
      },
    ],
    targetCategoryId: betaCat._id,
    priority: 1,
  });

  const betaBudget = await Budget.create({
    workspaceId: wsBeta._id,
    categoryId: betaCat._id,
    period: 'monthly',
    budgetAmount: 500000,
  });

  const betaGoal = await Goal.create({
    workspaceId: wsBeta._id,
    title: 'Beta Proprietary Buyback',
    name: 'Beta Proprietary Buyback',
    targetAmount: 2000000,
    currentSavedAmount: 500000,
    currentAmount: 500000,
  });

  const betaRecur = await RecurringTransaction.create({
    workspaceId: wsBeta._id,
    bankAccountId: betaBank._id,
    description: 'Beta Enterprise Cloud Infrastructure',
    expectedAmount: 35000,
    nextExpectedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    frequency: 'Monthly',
  });

  const betaInvoice = await Invoice.create({
    workspaceId: wsBeta._id,
    invoiceNumber: `INV-BETA-${runId}`,
    customerName: 'Top Secret Beta Customer',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    items: [{ description: 'Beta Defense Tech Consult', quantity: 1, unitPrice: 200000, amount: 200000 }],
    subtotal: 200000,
    taxTotal: 36000,
    grandTotal: 236000,
    totalAmount: 236000,
    status: 'Sent',
  });

  const betaLoan = await Loan.create({
    workspaceId: wsBeta._id,
    loanName: 'Beta Working Capital Facility',
    lenderName: 'Axis Commercial Bank',
    principalAmount: 3000000,
    annualInterestRate: 9.0,
    tenureMonths: 36,
    startDate: new Date(),
    emiAmount: 95400,
    remainingPrincipal: 3000000,
    status: 'Active',
  });

  // Vault document
  const vaultPath = path.resolve(`./uploads/vault/beta_secret_${runId}.txt`);
  fs.writeFileSync(vaultPath, `BETA CONFIDENTIAL ASSETS $5,000,000 - RUN ${runId}`, 'utf8');
  const encRes = await encryptVaultFile(vaultPath);

  const betaDoc = await DocumentVault.create({
    workspaceId: wsBeta._id,
    uploadedBy: userBeta._id,
    title: 'Beta Patents & Trade Secrets',
    category: 'Financial Agreement',
    originalFileName: `Patents_${runId}.txt`,
    storedFilePath: encRes.storedFilePath,
    fileSize: 100,
    mimeType: 'text/plain',
    fileHash: 'beta_hash',
    isEncrypted: true,
    encryptionIv: encRes.iv,
    encryptionAuthTag: encRes.authTag,
  });

  const betaAnomaly = await Anomaly.create({
    workspaceId: wsBeta._id,
    transactionId: betaTx._id,
    anomalyType: 'SPIKE_EXPENSE',
    title: 'Unusual Spike in Strategic Spending',
    severity: 'High',
    description: 'Unusual spike in strategic spending',
    confidenceScore: 0.92,
  });

  console.log('✓ All 12 model entities created inside Workspace Beta.\n');

  // 4. Multi-Tenant Penetration Matrix
  console.log('[Security Test Matrix] Executing Cross-Tenant Access Attempts from Alpha -> Beta Resources:');

  const clientAlpha = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${tokenAlpha}`,
      'x-workspace-id': wsAlpha._id.toString(),
    },
    validateStatus: () => true, // Don't throw on 4xx/5xx
  });

  const tests = [
    // Spoofing workspace header
    {
      name: 'Workspace Header Spoofing (Alpha attempts using Beta Workspace ID)',
      method: 'get',
      url: `/bank-accounts`,
      headers: { 'x-workspace-id': wsBeta._id.toString() },
      expectedStatus: 403,
    },
    // Entity 1: Bank Accounts
    {
      name: 'Bank Account - Read Beta ID',
      method: 'get',
      url: `/bank-accounts/${betaBank._id}`,
      expectedStatus: 404,
    },
    {
      name: 'Bank Account - Update Beta ID',
      method: 'put',
      url: `/bank-accounts/${betaBank._id}`,
      data: { bankName: 'Compromised by Alpha' },
      expectedStatus: 404,
    },
    {
      name: 'Bank Account - Delete Beta ID',
      method: 'delete',
      url: `/bank-accounts/${betaBank._id}`,
      expectedStatus: 404,
    },
    // Entity 2: Transactions
    {
      name: 'Transaction - Read Beta ID',
      method: 'get',
      url: `/transactions/${betaTx._id}`,
      expectedStatus: 404,
    },
    {
      name: 'Transaction - Update Beta ID',
      method: 'put',
      url: `/transactions/${betaTx._id}`,
      data: { description: 'Tampered by Alpha' },
      expectedStatus: 404,
    },
    {
      name: 'Transaction - Delete Beta ID',
      method: 'delete',
      url: `/transactions/${betaTx._id}`,
      expectedStatus: 404,
    },
    // Entity 3: Statements
    {
      name: 'Statement - Reprocess Beta Statement',
      method: 'post',
      url: `/statements/${betaStmt._id}/reprocess`,
      expectedStatus: 404,
    },
    {
      name: 'Statement - Rollback Beta Statement Import',
      method: 'post',
      url: `/statements/${betaStmt._id}/rollback`,
      expectedStatus: 404,
    },
    // Entity 4: Invoices
    {
      name: 'Invoice - Read Beta ID',
      method: 'get',
      url: `/invoices/${betaInvoice._id}`,
      expectedStatus: 404,
    },
    {
      name: 'Invoice - Update Beta ID',
      method: 'put',
      url: `/invoices/${betaInvoice._id}`,
      data: { grandTotal: 0 },
      expectedStatus: 404,
    },
    {
      name: 'Invoice - Delete Beta ID',
      method: 'delete',
      url: `/invoices/${betaInvoice._id}`,
      expectedStatus: 404,
    },
    // Entity 5: Loans
    {
      name: 'Loan - Read Beta ID',
      method: 'get',
      url: `/loans/${betaLoan._id}`,
      expectedStatus: 404,
    },
    {
      name: 'Loan - Delete Beta ID',
      method: 'delete',
      url: `/loans/${betaLoan._id}`,
      expectedStatus: 404,
    },
    // Entity 6: Document Vault
    {
      name: 'Document Vault - Read Beta ID',
      method: 'get',
      url: `/documents/${betaDoc._id}`,
      expectedStatus: 404,
    },
    {
      name: 'Document Vault - Download Beta Document',
      method: 'get',
      url: `/documents/${betaDoc._id}/download`,
      expectedStatus: 404,
    },
    {
      name: 'Document Vault - Delete Beta Document',
      method: 'delete',
      url: `/documents/${betaDoc._id}`,
      expectedStatus: 404,
    },
    // Entity 7: Goals
    {
      name: 'Goal - Read Beta ID',
      method: 'get',
      url: `/goals/${betaGoal._id}`,
      expectedStatus: 404,
    },
    {
      name: 'Goal - Delete Beta ID',
      method: 'delete',
      url: `/goals/${betaGoal._id}`,
      expectedStatus: 404,
    },
    // Entity 8: Categories
    {
      name: 'Category - Delete Beta ID',
      method: 'delete',
      url: `/categories/${betaCat._id}`,
      expectedStatus: 404,
    },
    // Entity 9: Anomalies
    {
      name: 'Anomaly - Update/Resolve Beta Anomaly',
      method: 'put',
      url: `/anomalies/${betaAnomaly._id}`,
      data: { status: 'Resolved' },
      expectedStatus: 404,
    },
  ];

  let passedTests = 0;
  const results = [];

  for (const t of tests) {
    const config = {
      method: t.method,
      url: t.url,
      data: t.data,
      headers: t.headers,
    };
    const res = await clientAlpha(config);
    const passed = res.status === t.expectedStatus;
    if (passed) passedTests++;

    results.push({
      Test: t.name,
      Attempted: `${t.method.toUpperCase()} ${t.url}`,
      Expected: t.expectedStatus,
      Received: res.status,
      Status: passed ? 'PASSED (Protected)' : 'FAILED (Vulnerable)',
    });
  }

  console.table(results);

  // Check List Operation Isolation
  console.log('\n[List Operations Isolation Check]');
  const listChecks = [
    { entity: 'Bank Accounts', url: '/bank-accounts', key: 'bankAccounts' },
    { entity: 'Transactions', url: '/transactions', key: 'transactions' },
    { entity: 'Invoices', url: '/invoices', key: 'invoices' },
    { entity: 'Loans', url: '/loans', key: 'loans' },
    { entity: 'Goals', url: '/goals', key: 'goals' },
    { entity: 'Document Vault', url: '/documents', key: 'documents' },
    { entity: 'Anomalies', url: '/anomalies', key: 'anomalies' },
  ];

  for (const check of listChecks) {
    const res = await clientAlpha.get(check.url);
    const items = res.data[check.key] || res.data.data || [];
    const leakedItems = items.filter(item => item.workspaceId?.toString() === wsBeta._id.toString());
    const isIsolated = leakedItems.length === 0;
    console.log(`✓ List ${check.entity}: Retrieved ${items.length} records. Leaked Beta records: ${leakedItems.length} (${isIsolated ? '100% Isolated' : 'LEAK DETECTED'})`);
  }

  console.log('\n================================================================');
  console.log(`  MULTI-TENANT TEST COMPLETE: ${passedTests}/${tests.length} CHECKS PASSED`);
  console.log('================================================================\n');

  await mongoose.disconnect();
}

runMultiTenantSecurityTest().catch(err => {
  console.error('[Multi-Tenant Test Error]', err);
  process.exit(1);
});
