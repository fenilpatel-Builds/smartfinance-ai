import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
import AIInsight from '../models/AIInsight.js';
import Reconciliation from '../models/Reconciliation.js';
import { recalculateBankAccountBalance, detectInternalTransfers } from '../services/financialEngine.js';

const seed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMember.deleteMany({}),
      BankAccount.deleteMany({}),
      Statement.deleteMany({}),
      Transaction.deleteMany({}),
      Category.deleteMany({}),
      CategorizationRule.deleteMany({}),
      Budget.deleteMany({}),
      Asset.deleteMany({}),
      Liability.deleteMany({}),
      EquityRecord.deleteMany({}),
      AIInsight.deleteMany({}),
      Reconciliation.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
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

    console.log('[Seed] Creating demo workspace...');
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

    console.log('[Seed] Creating default categories...');
    const defaultCategories = [
      // Income
      { name: 'Salary & Income', type: 'income', color: '#10b981', icon: 'Briefcase' },
      { name: 'Business Revenue', type: 'income', color: '#059669', icon: 'TrendingUp' },
      { name: 'Interest & Investment Returns', type: 'income', color: '#34d399', icon: 'DollarSign' },
      { name: 'Refunds & Cashbacks', type: 'income', color: '#6ee7b7', icon: 'RotateCcw' },
      // Expenses
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
      // Transfers
      { name: 'Own Account Transfer', type: 'transfer', color: '#0284c7', icon: 'Repeat' },
      { name: 'Bank Transfer', type: 'transfer', color: '#0ea5e9', icon: 'ArrowRightLeft' },
    ];

    const categoryDocs = await Category.insertMany(
      defaultCategories.map((c) => ({ ...c, workspaceId: workspace._id, isDefault: true }))
    );
    const categoryMap = new Map(categoryDocs.map((c) => [c.name, c._id]));

    console.log('[Seed] Creating bank accounts...');
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

    console.log('[Seed] Creating sample statements...');
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
      extractedTransactionCount: 30,
      importedTransactionCount: 30,
      processingStatus: 'IMPORTED',
    });

    const statement2 = await Statement.create({
      workspaceId: workspace._id,
      bankAccountId: sbi._id,
      originalFileName: 'SBI_Statement_Jan2026.xlsx',
      storedFilePath: './uploads/statements/sample_sbi.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 180000,
      statementPeriodStart: new Date('2026-01-01'),
      statementPeriodEnd: new Date('2026-01-31'),
      openingBalance: 85000.0,
      closingBalance: 112000.0,
      extractedTransactionCount: 22,
      importedTransactionCount: 22,
      processingStatus: 'IMPORTED',
    });

    console.log('[Seed] Creating 50+ realistic transactions...');
    const rawTxList = [
      // HDFC Transactions (Revenue & Business Expenses)
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
      { d: '2026-01-16', desc: 'AIRTEL BROADBAND FIBER BILL', amt: 1499, t: 'debit', cat: 'Utilities & Bills', m: 'Airtel', ref: 'AIRT99120' },
      { d: '2026-01-17', desc: 'STARBUCKS COFFEE INDIRANAGAR', amt: 720, t: 'debit', cat: 'Food & Dining', m: 'Starbucks', ref: 'UPI99182' },
      { d: '2026-01-18', desc: 'GOOGLE WORKSPACE ANNUAL SEATS', amt: 18500, t: 'debit', cat: 'Office Supplies & Software', m: 'Google', ref: 'GOOG4491' },
      { d: '2026-01-19', desc: 'AMAZON RETAIL INDIA GOODS', amt: 6200, t: 'debit', cat: 'Shopping & Retail', m: 'Amazon', ref: 'AMZ99102' },
      { d: '2026-01-20', desc: 'CLIENT CONSULTING INVOICE 108', amt: 85000, t: 'credit', cat: 'Business Revenue', m: 'Apex Ventures', ref: 'NEFT99210' },
      { d: '2026-01-21', desc: 'ANNUAL MAINTENANCE CHARGE HDFC', amt: 590, t: 'debit', cat: 'Bank Charges & Fees', m: 'HDFC Bank', ref: 'CHRG9912' },
      { d: '2026-01-22', desc: 'BLINKIT GROCERIES INSTANT TRF', amt: 1120, t: 'debit', cat: 'Food & Dining', m: 'Blinkit', ref: 'UPI55019' },
      { d: '2026-01-23', desc: 'SHELL PETROL STATION WHITEFIELD', amt: 3400, t: 'debit', cat: 'Fuel & Transportation', m: 'Shell', ref: 'POS3391' },
      { d: '2026-01-24', desc: 'CULT.FIT ANNUAL GYM MEMBERSHIP', amt: 14999, t: 'debit', cat: 'Healthcare & Wellness', m: 'Cult.fit', ref: 'UPI11829' },
      { d: '2026-01-25', desc: 'SWIGGY DINING GOURMET', amt: 1420, t: 'debit', cat: 'Food & Dining', m: 'Swiggy', ref: 'UPI99104' },
      { d: '2026-01-26', desc: 'SPOTIFY PREMIUM FAMILY', amt: 179, t: 'debit', cat: 'Entertainment & Subscriptions', m: 'Spotify', ref: 'SPOT9910' },
      { d: '2026-01-27', desc: 'MAKEMYTRIP BUSINESS FLIGHT DEL-BLR', amt: 9400, t: 'debit', cat: 'Travel & Commute', m: 'MakeMyTrip', ref: 'MMT88129' },
      { d: '2026-01-28', desc: 'INDIGO AIRLINES IN-FLIGHT', amt: 650, t: 'debit', cat: 'Travel & Commute', m: 'IndiGo', ref: 'POS7719' },
      { d: '2026-01-29', desc: 'CROMA ELECTRONICS MONITORS', amt: 24500, t: 'debit', cat: 'Shopping & Retail', m: 'Croma', ref: 'CRO88129' },
      { d: '2026-01-30', desc: 'AMAZON REFUND RETURN ITEM', amt: 1890, t: 'credit', cat: 'Refunds & Cashbacks', m: 'Amazon', ref: 'REF99102' },
      { d: '2026-01-31', desc: 'REVENUE SHARE CONSULTANCY JAN', amt: 65000, t: 'credit', cat: 'Business Revenue', m: 'Vanguard Corp', ref: 'NEFT66190' },
    ];

    const sbiTxList = [
      { d: '2026-01-01', desc: 'OPENING DEPOSIT DIVIDEND TRF', amt: 12000, t: 'credit', cat: 'Interest & Investment Returns', m: 'SBI Mutual Fund', ref: 'DIV99102' },
      { d: '2026-01-04', desc: 'DOMINOS PIZZA ONLINE ORDER', amt: 650, t: 'debit', cat: 'Food & Dining', m: 'Dominos', ref: 'UPI11920' },
      { d: '2026-01-06', desc: 'RAPIDO BIKE TAXI RIDES', amt: 140, t: 'debit', cat: 'Travel & Commute', m: 'Rapido', ref: 'UPI77192' },
      { d: '2026-01-08', desc: 'ZEPTO 10 MIN GROCERY ORDER', amt: 780, t: 'debit', cat: 'Food & Dining', m: 'Zepto', ref: 'UPI99120' },
      { d: '2026-01-10', desc: 'BESCOM POWER SUPPLY BANGALORE', amt: 2100, t: 'debit', cat: 'Utilities & Bills', m: 'BESCOM', ref: 'EB99102' },
      { d: '2026-01-12', desc: 'DECATHLON SPORTS GEAR', amt: 3499, t: 'debit', cat: 'Shopping & Retail', m: 'Decathlon', ref: 'DEC8819' },
      { d: '2026-01-15', desc: 'NEFT CR FROM HDFC BANK A/C', amt: 35000, t: 'credit', cat: 'Own Account Transfer', m: 'Self Transfer', ref: 'TRF001928' },
      { d: '2026-01-17', desc: 'HOTSTAR DISNEY ANNUAL SUB', amt: 1499, t: 'debit', cat: 'Entertainment & Subscriptions', m: 'Hotstar', ref: 'HOT9910' },
      { d: '2026-01-19', desc: 'BOOKMYSHOW PVR CINEMA TICKETS', amt: 980, t: 'debit', cat: 'Entertainment & Subscriptions', m: 'BookMyShow', ref: 'BMS8819' },
      { d: '2026-01-21', desc: 'PHARMEASY MEDICINE ORDER', amt: 1650, t: 'debit', cat: 'Healthcare & Wellness', m: 'PharmEasy', ref: 'UPI6610' },
      { d: '2026-01-23', desc: 'HPCL FUEL STATION KORAMANGALA', amt: 2800, t: 'debit', cat: 'Fuel & Transportation', m: 'HPCL', ref: 'POS5519' },
      { d: '2026-01-25', desc: 'MYNTRA FASHION CLOTHING', amt: 4120, t: 'debit', cat: 'Shopping & Retail', m: 'Myntra', ref: 'MYN9910' },
      { d: '2026-01-27', desc: 'BIGBASKET MONTHLY GROCERIES', amt: 6400, t: 'debit', cat: 'Food & Dining', m: 'BigBasket', ref: 'BB88190' },
      { d: '2026-01-28', desc: 'ACT FIBERNET 300MBPS PLAN', amt: 1150, t: 'debit', cat: 'Utilities & Bills', m: 'ACT Fibernet', ref: 'ACT9910' },
      { d: '2026-01-29', desc: 'ZERODHA BROKING DIVIDEND PAYOUT', amt: 8400, t: 'credit', cat: 'Interest & Investment Returns', m: 'Zerodha', ref: 'ZER99102' },
      { d: '2026-01-30', desc: 'SMS CHARGES SBI QUARTERLY', amt: 25, t: 'debit', cat: 'Bank Charges & Fees', m: 'State Bank of India', ref: 'CHRG881' },
      { d: '2026-01-31', desc: 'MONTHLY INTEREST CREDIT', amt: 1240, t: 'credit', cat: 'Interest & Investment Returns', m: 'State Bank of India', ref: 'INTCR771' },
    ];

    const iciciTxList = [
      { d: '2026-01-05', desc: 'IMPS CR FREELANCE MOBILE APP ENGAGEMENT', amt: 45000, t: 'credit', cat: 'Business Revenue', m: 'Orbit Labs', ref: 'IMPS88190' },
      { d: '2026-01-11', desc: 'NOTION AI TEAM WORKSPACE', amt: 3200, t: 'debit', cat: 'Office Supplies & Software', m: 'Notion', ref: 'NOT8819' },
      { d: '2026-01-16', desc: 'FIGMA PROFESSIONAL SEATS', amt: 4800, t: 'debit', cat: 'Office Supplies & Software', m: 'Figma', ref: 'FIG9910' },
      { d: '2026-01-22', desc: 'ZOOM VIDEO COMMUNICATIONS PRO', amt: 1800, t: 'debit', cat: 'Office Supplies & Software', m: 'Zoom', ref: 'ZM99102' },
      { d: '2026-01-29', desc: 'CLIENT STRATEGY RETAINER', amt: 35000, t: 'credit', cat: 'Business Revenue', m: 'Apex Global', ref: 'NEFT44910' },
    ];

    const createBatch = (list, accountDoc, statementDoc) => {
      let running = accountDoc.openingBalance;
      return list.map((item) => {
        const debit = item.t === 'debit' ? item.amt : 0;
        const credit = item.t === 'credit' ? item.amt : 0;
        running = running + credit - debit;
        const fp = crypto
          .createHash('sha256')
          .update(`${item.d}|${item.amt.toFixed(2)}|${item.t}|${(item.ref || item.desc || '').slice(0, 25)}`)
          .digest('hex');

        return {
          workspaceId: workspace._id,
          bankAccountId: accountDoc._id,
          statementId: statementDoc?._id,
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
          runningBalance: Math.round(running * 100) / 100,
          reconciliationStatus: 'Matched',
          verificationStatus: 'Verified',
          categorizationSource: 'auto_rule',
          fingerprint: fp,
        };
      });
    };

    const hdfcDocs = createBatch(rawTxList, hdfc, statement1);
    const sbiDocs = createBatch(sbiTxList, sbi, statement2);
    const iciciDocs = createBatch(iciciTxList, icici, null);

    await Transaction.insertMany([...hdfcDocs, ...sbiDocs, ...iciciDocs]);

    console.log('[Seed] Recalculating bank balances & matching inter-account transfers...');
    await recalculateBankAccountBalance(hdfc._id, workspace._id);
    await recalculateBankAccountBalance(sbi._id, workspace._id);
    await recalculateBankAccountBalance(icici._id, workspace._id);
    await detectInternalTransfers(workspace._id);

    console.log('[Seed] Creating sample categorization rules...');
    await CategorizationRule.create({
      workspaceId: workspace._id,
      ruleName: 'Swiggy & Zomato to Food',
      matchingConditions: [{ field: 'description', operator: 'contains', value: 'swiggy' }],
      targetCategoryId: categoryMap.get('Food & Dining'),
      targetCategoryName: 'Food & Dining',
      priority: 20,
    });

    await CategorizationRule.create({
      workspaceId: workspace._id,
      ruleName: 'AWS & Cloud to Software',
      matchingConditions: [{ field: 'description', operator: 'contains', value: 'aws' }],
      targetCategoryId: categoryMap.get('Office Supplies & Software'),
      targetCategoryName: 'Office Supplies & Software',
      priority: 25,
    });

    console.log('[Seed] Creating sample budgets...');
    await Budget.create({
      workspaceId: workspace._id,
      categoryId: categoryMap.get('Food & Dining'),
      budgetAmount: 15000,
      period: 'monthly',
    });

    await Budget.create({
      workspaceId: workspace._id,
      categoryId: categoryMap.get('Travel & Commute'),
      budgetAmount: 20000,
      period: 'monthly',
    });

    await Budget.create({
      workspaceId: workspace._id,
      categoryId: categoryMap.get('Office Supplies & Software'),
      budgetAmount: 50000,
      period: 'monthly',
    });

    console.log('[Seed] Creating Balance Sheet Assets, Liabilities, and Equity...');
    // Assets
    await Asset.create({
      workspaceId: workspace._id,
      name: 'Petty Cash in Safe',
      assetType: 'Cash',
      amount: 25000,
      valuationDate: new Date(),
    });

    await Asset.create({
      workspaceId: workspace._id,
      name: 'Unbilled Client Receivables',
      assetType: 'Accounts Receivable',
      amount: 145000,
      valuationDate: new Date(),
    });

    await Asset.create({
      workspaceId: workspace._id,
      name: 'Office MacBooks & Workstations',
      assetType: 'Fixed Assets',
      amount: 320000,
      valuationDate: new Date(),
    });

    await Asset.create({
      workspaceId: workspace._id,
      name: 'Corporate Mutual Fund Portfolio',
      assetType: 'Investments',
      amount: 500000,
      valuationDate: new Date(),
    });

    // Liabilities
    await Liability.create({
      workspaceId: workspace._id,
      name: 'AWS Outstanding Cloud Invoice',
      liabilityType: 'Accounts Payable',
      amount: 28000,
      dueDate: new Date('2026-02-15'),
    });

    await Liability.create({
      workspaceId: workspace._id,
      name: 'HDFC Corporate Credit Card',
      liabilityType: 'Credit Card Outstanding',
      amount: 42500,
      dueDate: new Date('2026-02-10'),
    });

    await Liability.create({
      workspaceId: workspace._id,
      name: 'GST Payable Q3',
      liabilityType: 'Taxes Payable',
      amount: 38000,
      dueDate: new Date('2026-02-20'),
    });

    // Equity
    await EquityRecord.create({
      workspaceId: workspace._id,
      name: "Fenil Patel Founder's Capital",
      equityType: "Owner's Capital",
      amount: 800000,
      effectiveDate: new Date('2025-01-01'),
    });

    await EquityRecord.create({
      workspaceId: workspace._id,
      name: 'FY2025 Retained Earnings',
      equityType: 'Retained Earnings',
      amount: 356500,
      effectiveDate: new Date('2025-12-31'),
    });

    console.log('[Seed] Creating sample AI Insights...');
    await AIInsight.create({
      workspaceId: workspace._id,
      insightType: 'spending_pattern',
      title: 'Healthy 48% Operating Margin Detected',
      description:
        'Client retainers and project revenue generated ₹3,05,000 against operating outflows of ₹1,58,000. Rent and Cloud software represent 42% of total business overhead.',
      severity: 'positive',
      recommendations: [
        'Maintain 3-month operational cash reserve in liquid treasury',
        'Review software license utilization before annual renewals',
      ],
    });

    console.log('\n======================================================');
    console.log('  SMARTFINANCE AI SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Demo Login Credentials:');
    console.log('  1. Workspace Owner:');
    console.log('     Email:    owner@smartfinance.ai');
    console.log('     Password: password123');
    console.log('  2. Accountant:');
    console.log('     Email:    accountant@smartfinance.ai');
    console.log('     Password: password123');
    console.log('Workspace: Patel Global Enterprises (INR)');
    console.log('======================================================\n');

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
};

seed();

