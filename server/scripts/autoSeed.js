import bcrypt from 'bcryptjs';
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
import AIInsight from '../models/AIInsight.js';
import Goal from '../models/Goal.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Invoice from '../models/Invoice.js';
import Loan from '../models/Loan.js';
import Anomaly from '../models/Anomaly.js';
import { calculateAmortizationSchedule } from '../controllers/loanController.js';
import { recalculateBankAccountBalance, detectInternalTransfers } from '../services/financialEngine.js';

export default async function autoSeed() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const owner = await User.create({
    name: 'Fenil Patel',
    email: 'owner@smartfinance.ai',
    passwordHash,
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  });

  const accountant = await User.create({
    name: 'Aditi Sharma',
    email: 'accountant@smartfinance.ai',
    passwordHash,
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  });

  const workspace = await Workspace.create({
    name: 'Patel Global Enterprises',
    slug: 'patel-global-enterprises',
    ownerId: owner._id,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    settings: {
      allowAIAnalysis: true,
      strictBalanceCheck: true,
    },
  });

  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId: owner._id,
    role: 'Workspace Owner',
    status: 'active',
  });

  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId: accountant._id,
    role: 'Accountant',
    status: 'active',
  });

  const defaultCategories = [
    { name: 'Salary & Income', type: 'income', color: '#10b981', icon: 'Briefcase' },
    { name: 'Business Revenue', type: 'income', color: '#059669', icon: 'TrendingUp' },
    { name: 'Interest & Investment Returns', type: 'income', color: '#34d399', icon: 'DollarSign' },
    { name: 'Refunds & Cashbacks', type: 'income', color: '#6ee7b7', icon: 'RotateCcw' },
    { name: 'Food & Dining', type: 'expense', color: '#f59e0b', icon: 'Utensils' },
    { name: 'Shopping & Retail', type: 'expense', color: '#ec4899', icon: 'ShoppingBag' },
    { name: 'Travel & Commute', type: 'expense', color: '#3b82f6', icon: 'Car' },
    { name: 'Fuel & Transportation', type: 'expense', color: '#6366f1', icon: 'Fuel' },
    { name: 'Rent & Lease', type: 'expense', color: '#8b5cf6', icon: 'Home' },
    { name: 'Utilities & Bills', type: 'expense', color: '#eab308', icon: 'Zap' },
    { name: 'Healthcare & Wellness', type: 'expense', color: '#ef4444', icon: 'Activity' },
    { name: 'Entertainment & Subscriptions', type: 'expense', color: '#d946ef', icon: 'Film' },
    { name: 'Office Supplies & Software', type: 'expense', color: '#06b6d4', icon: 'Monitor' },
    { name: 'Bank Charges & Fees', type: 'expense', color: '#64748b', icon: 'ShieldAlert' },
    { name: 'Other Expenses', type: 'expense', color: '#94a3b8', icon: 'Tag' },
    { name: 'Own Account Transfer', type: 'transfer', color: '#0284c7', icon: 'Repeat' },
    { name: 'Bank Transfer', type: 'transfer', color: '#0ea5e9', icon: 'ArrowRightLeft' },
  ];

  const categoryDocs = await Category.insertMany(
    defaultCategories.map((c) => ({ ...c, workspaceId: workspace._id, isDefault: true }))
  );
  const categoryMap = new Map(categoryDocs.map((c) => [c.name, c._id]));

  const hdfc = await BankAccount.create({
    workspaceId: workspace._id,
    bankName: 'HDFC Bank',
    accountHolderName: 'Fenil Patel',
    maskedAccountNumber: 'XXXX-XXXX-4921',
    accountNickname: 'HDFC Corporate Prime',
    accountType: 'Current',
    ifscCode: 'HDFC0001234',
    currency: 'INR',
    openingBalance: 150000.0,
    currentCalculatedBalance: 150000.0,
    isActive: true,
  });

  const sbi = await BankAccount.create({
    workspaceId: workspace._id,
    bankName: 'State Bank of India',
    accountHolderName: 'Fenil Patel',
    maskedAccountNumber: 'XXXX-XXXX-8812',
    accountNickname: 'SBI Operating Reserve',
    accountType: 'Savings',
    ifscCode: 'SBIN0005678',
    currency: 'INR',
    openingBalance: 85000.0,
    currentCalculatedBalance: 85000.0,
    isActive: true,
  });

  const icici = await BankAccount.create({
    workspaceId: workspace._id,
    bankName: 'ICICI Bank',
    accountHolderName: 'Fenil Patel',
    maskedAccountNumber: 'XXXX-XXXX-3341',
    accountNickname: 'ICICI Commercial A/C',
    accountType: 'Current',
    ifscCode: 'ICIC0009988',
    currency: 'INR',
    openingBalance: 40000.0,
    currentCalculatedBalance: 40000.0,
    isActive: true,
  });

  const statement1 = await Statement.create({
    workspaceId: workspace._id,
    bankAccountId: hdfc._id,
    originalFileName: 'HDFC_Statement_Jan2026.pdf',
    storedFilePath: './uploads/statements/sample_hdfc.pdf',
    mimeType: 'application/pdf',
    fileSize: 420000,
    statementPeriodStart: new Date('2026-01-01'),
    statementPeriodEnd: new Date('2026-01-31'),
    openingBalance: 150000.0,
    closingBalance: 245000.0,
    extractedTransactionCount: 20,
    importedTransactionCount: 20,
    processingStatus: 'IMPORTED',
  });

  const rawTxList = [
    { d: '2026-01-02', desc: 'ACH CR TECHCORP SOLUTIONS CLIENT PAYMENT', amt: 120000, t: 'credit', cat: 'Business Revenue', m: 'TechCorp Solutions', ref: 'CMS8821901' },
    { d: '2026-01-03', desc: 'SWIGGY FOOD ORDER BANGALORE', amt: 840, t: 'debit', cat: 'Food & Dining', m: 'Swiggy', ref: 'UPI662910' },
    { d: '2026-01-04', desc: 'AMAZON WEB SERVICES CLOUD HOSTING', amt: 14500, t: 'debit', cat: 'Office Supplies & Software', m: 'Amazon Web Services', ref: 'AWS992104' },
    { d: '2026-01-05', desc: 'ZOMATO DINING OUT PVT LTD', amt: 1650, t: 'debit', cat: 'Food & Dining', m: 'Zomato', ref: 'UPI991204' },
    { d: '2026-01-06', desc: 'UBER INDIA TRAVEL SERVICES', amt: 450, t: 'debit', cat: 'Travel & Commute', m: 'Uber', ref: 'UBER11029' },
    { d: '2026-01-07', desc: 'IOCL PETROL BUNK KORAMANGALA', amt: 3200, t: 'debit', cat: 'Fuel & Transportation', m: 'Indian Oil', ref: 'POS88129' },
    { d: '2026-01-08', desc: 'COMMERCIAL OFFICE RENT JAN 2026', amt: 45000, t: 'debit', cat: 'Rent & Lease', m: 'Prestige Estates', ref: 'NEFT440129' },
    { d: '2026-01-09', desc: 'TATA POWER ELECTRICITY BILL', amt: 5800, t: 'debit', cat: 'Utilities & Bills', m: 'Tata Power', ref: 'BILL99012' },
    { d: '2026-01-10', desc: 'INTEREST CREDIT CR Q3', amt: 2450, t: 'credit', cat: 'Interest & Investment Returns', m: 'HDFC Bank', ref: 'INTCR9912' },
    { d: '2026-01-11', desc: 'GITHUB ENTERPRISE SEATS', amt: 7200, t: 'debit', cat: 'Office Supplies & Software', m: 'GitHub', ref: 'POS99120' },
    { d: '2026-01-12', desc: 'NETFLIX SUBSCRIPTION PREMIUM', amt: 649, t: 'debit', cat: 'Entertainment & Subscriptions', m: 'Netflix', ref: 'SUB44910' },
    { d: '2026-01-13', desc: 'APOLLO PHARMACY MEDICAL SUPPLIES', amt: 1250, t: 'debit', cat: 'Healthcare & Wellness', m: 'Apollo Pharmacy', ref: 'UPI88120' },
    { d: '2026-01-14', desc: 'FLIPKART INTERNET PVT LTD', amt: 4890, t: 'debit', cat: 'Shopping & Retail', m: 'Flipkart', ref: 'OD8812901' },
    { d: '2026-01-15', desc: 'NEFT TRF TO SBI SAVINGS A/C', amt: 35000, t: 'debit', cat: 'Own Account Transfer', m: 'Self Transfer', ref: 'TRF001928' },
    { d: '2026-01-20', desc: 'CLIENT CONSULTING INVOICE 108', amt: 85000, t: 'credit', cat: 'Business Revenue', m: 'Apex Ventures', ref: 'NEFT99210' },
  ];

  const sbiTxList = [
    { d: '2026-01-01', desc: 'OPENING DEPOSIT DIVIDEND TRF', amt: 12000, t: 'credit', cat: 'Interest & Investment Returns', m: 'SBI Mutual Fund', ref: 'DIV99102' },
    { d: '2026-01-04', desc: 'DOMINOS PIZZA ONLINE ORDER', amt: 650, t: 'debit', cat: 'Food & Dining', m: 'Dominos', ref: 'UPI11920' },
    { d: '2026-01-15', desc: 'NEFT CR FROM HDFC BANK A/C', amt: 35000, t: 'credit', cat: 'Own Account Transfer', m: 'Self Transfer', ref: 'TRF001928' },
    { d: '2026-01-27', desc: 'BIGBASKET MONTHLY GROCERIES', amt: 6400, t: 'debit', cat: 'Food & Dining', m: 'BigBasket', ref: 'BB88190' },
    { d: '2026-01-31', desc: 'MONTHLY INTEREST CREDIT', amt: 1240, t: 'credit', cat: 'Interest & Investment Returns', m: 'State Bank of India', ref: 'INTCR771' },
  ];

  let running1 = hdfc.openingBalance;
  const hdfcDocs = rawTxList.map((item) => {
    const debit = item.t === 'debit' ? item.amt : 0;
    const credit = item.t === 'credit' ? item.amt : 0;
    running1 = running1 + credit - debit;
    return {
      workspaceId: workspace._id,
      bankAccountId: hdfc._id,
      statementId: statement1._id,
      transactionDate: new Date(item.d),
      description: item.desc,
      normalizedDescription: `${item.m} - ${item.desc.slice(0, 30)}`,
      referenceNumber: item.ref,
      debit,
      credit,
      amount: item.amt,
      transactionType: item.t,
      categoryId: categoryMap.get(item.cat),
      categoryName: item.cat,
      merchant: item.m,
      runningBalance: Math.round(running1 * 100) / 100,
      reconciliationStatus: 'Matched',
      verificationStatus: 'Verified',
      categorizationSource: 'auto_rule',
    };
  });

  let running2 = sbi.openingBalance;
  const sbiDocs = sbiTxList.map((item) => {
    const debit = item.t === 'debit' ? item.amt : 0;
    const credit = item.t === 'credit' ? item.amt : 0;
    running2 = running2 + credit - debit;
    return {
      workspaceId: workspace._id,
      bankAccountId: sbi._id,
      transactionDate: new Date(item.d),
      description: item.desc,
      normalizedDescription: `${item.m} - ${item.desc.slice(0, 30)}`,
      referenceNumber: item.ref,
      debit,
      credit,
      amount: item.amt,
      transactionType: item.t,
      categoryId: categoryMap.get(item.cat),
      categoryName: item.cat,
      merchant: item.m,
      runningBalance: Math.round(running2 * 100) / 100,
      reconciliationStatus: 'Matched',
      verificationStatus: 'Verified',
      categorizationSource: 'auto_rule',
    };
  });

  await Transaction.insertMany([...hdfcDocs, ...sbiDocs]);

  await recalculateBankAccountBalance(hdfc._id, workspace._id);
  await recalculateBankAccountBalance(sbi._id, workspace._id);
  await recalculateBankAccountBalance(icici._id, workspace._id);
  await detectInternalTransfers(workspace._id);

  // Balance sheet items
  await Asset.create({
    workspaceId: workspace._id,
    name: 'Petty Cash in Safe',
    assetType: 'Cash',
    amount: 25000,
  });

  await Asset.create({
    workspaceId: workspace._id,
    name: 'Office MacBooks & Hardware',
    assetType: 'Fixed Assets',
    amount: 320000,
  });

  await Liability.create({
    workspaceId: workspace._id,
    name: 'AWS Cloud Outstandings',
    liabilityType: 'Accounts Payable',
    amount: 28000,
  });

  await EquityRecord.create({
    workspaceId: workspace._id,
    name: "Founder's Initial Capital",
    equityType: "Owner's Capital",
    amount: 500000,
  });

  await EquityRecord.create({
    workspaceId: workspace._id,
    name: 'FY2025 Retained Earnings',
    equityType: 'Retained Earnings',
    amount: 92000,
    effectiveDate: new Date('2025-12-31'),
  });

  await AIInsight.create({
    workspaceId: workspace._id,
    insightType: 'spending_pattern',
    title: 'Healthy 48% Operating Margin Detected',
    description:
      'Client retainers and project revenue generated ₹2,05,000 against operating outflows of ₹92,000. Rent and Cloud software represent 42% of total business overhead.',
    severity: 'positive',
    recommendations: [
      'Maintain 3-month operational cash reserve in liquid treasury',
      'Review software license utilization before annual renewals',
    ],
  });

  // Seed Goals
  await Goal.create([
    {
      workspaceId: workspace._id,
      name: 'Corporate Tax & GST Reserve',
      targetAmount: 300000,
      currentAmount: 185000,
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      monthlyContributionTarget: 50000,
      category: 'Tax Planning',
      color: '#3b82f6',
      notes: 'Provision for upcoming quarterly advance corporate tax filing.',
    },
    {
      workspaceId: workspace._id,
      name: 'Server Infrastructure & AI GPU Fund',
      targetAmount: 500000,
      currentAmount: 220000,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      monthlyContributionTarget: 45000,
      category: 'Capital Expansion',
      color: '#10b981',
      notes: 'Dedicated fund for self-hosted LLM inference cluster.',
    },
  ]);

  // Seed Recurring / Subscriptions
  await RecurringTransaction.create([
    {
      workspaceId: workspace._id,
      bankAccountId: hdfc._id,
      merchant: 'Amazon Web Services (AWS)',
      description: 'AWS Cloud EC2 & S3 Infrastructure',
      expectedAmount: 14200,
      frequency: 'Monthly',
      nextExpectedDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      categoryName: 'Office Supplies & Software',
      isSubscription: true,
      detectionConfidence: 0.98,
      status: 'Active',
    },
    {
      workspaceId: workspace._id,
      bankAccountId: hdfc._id,
      merchant: 'GitHub Enterprise',
      description: 'GitHub Organization Team Licenses',
      expectedAmount: 3400,
      frequency: 'Monthly',
      nextExpectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      categoryName: 'Office Supplies & Software',
      isSubscription: true,
      detectionConfidence: 0.95,
      status: 'Active',
    },
    {
      workspaceId: workspace._id,
      bankAccountId: sbi._id,
      merchant: 'Google Workspace',
      description: 'Email, Docs, and Cloud Storage Licenses',
      expectedAmount: 2100,
      frequency: 'Monthly',
      nextExpectedDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      categoryName: 'Utilities & Bills',
      isSubscription: true,
      detectionConfidence: 0.92,
      status: 'Active',
    },
  ]);

  // Seed Invoices (Receivables)
  await Invoice.create([
    {
      workspaceId: workspace._id,
      invoiceNumber: 'INV-2026-0001',
      customerName: 'Acme Cloud Technologies',
      customerEmail: 'billing@acmecloud.io',
      issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      items: [
        { description: 'Quarterly AI Integration Retainer', quantity: 1, unitPrice: 150000, taxRate: 18, amount: 150000 },
      ],
      subtotal: 150000,
      taxAmount: 27000,
      totalAmount: 177000,
      paidAmount: 177000,
      status: 'Paid',
    },
    {
      workspaceId: workspace._id,
      invoiceNumber: 'INV-2026-0002',
      customerName: 'FinGlobal Analytics Corp',
      customerEmail: 'accounts@finglobal.org',
      issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      items: [
        { description: 'Document Parsing Engine Implementation', quantity: 1, unitPrice: 95000, taxRate: 18, amount: 95000 },
        { description: 'API Gateway Setup & SLA', quantity: 1, unitPrice: 25000, taxRate: 18, amount: 25000 },
      ],
      subtotal: 120000,
      taxAmount: 21600,
      totalAmount: 141600,
      paidAmount: 50000,
      status: 'Partially Paid',
    },
    {
      workspaceId: workspace._id,
      invoiceNumber: 'INV-2026-0003',
      customerName: 'BlueSky Logistics India',
      customerEmail: 'finance@blueskylogistics.in',
      issueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      items: [
        { description: 'Automated Bank Reconciliation Pipeline', quantity: 1, unitPrice: 75000, taxRate: 18, amount: 75000 },
      ],
      subtotal: 75000,
      taxAmount: 13500,
      totalAmount: 88500,
      paidAmount: 0,
      status: 'Sent',
    },
  ]);

  // Seed Loan
  const loanCalc = calculateAmortizationSchedule(800000, 10.5, 36, new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
  // Mark first 2 installments as paid
  if (loanCalc.schedule[0]) {
    loanCalc.schedule[0].isPaid = true;
    loanCalc.schedule[0].paidDate = loanCalc.schedule[0].dueDate;
  }
  if (loanCalc.schedule[1]) {
    loanCalc.schedule[1].isPaid = true;
    loanCalc.schedule[1].paidDate = loanCalc.schedule[1].dueDate;
  }
  const remainingDebt = loanCalc.schedule[1] ? loanCalc.schedule[1].remainingBalance : 765000;

  await Loan.create({
    workspaceId: workspace._id,
    loanName: 'Equipment & Server Capital Loan',
    lenderName: 'HDFC Bank Commercial',
    loanType: 'Business Loan',
    principalAmount: 800000,
    annualInterestRate: 10.5,
    tenureMonths: 36,
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    nextPaymentDate: loanCalc.schedule[2] ? loanCalc.schedule[2].dueDate : new Date(),
    emiAmount: loanCalc.emi,
    remainingPrincipal: remainingDebt,
    totalInterestPayable: loanCalc.totalInterest,
    totalAmountPayable: loanCalc.totalAmount,
    amortizationSchedule: loanCalc.schedule,
    status: 'Active',
  });

  // Seed Anomaly
  await Anomaly.create({
    workspaceId: workspace._id,
    bankAccountId: hdfc._id,
    anomalyType: 'High Expense Spike',
    severity: 'Medium',
    title: 'Unusually High Office Supplies & Software Expense',
    description: 'Transaction amount (₹45,000) is 3.8x higher than the historical 90-day category average (₹11,800).',
    affectedAmount: 45000,
    confidenceScore: 0.91,
    status: 'Detected',
  });

  console.log('[AutoSeed] Completed auto-seeding demo workspace!');
}

