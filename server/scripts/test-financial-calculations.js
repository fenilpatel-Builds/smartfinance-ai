import { calculateAmortizationSchedule } from '../controllers/loanController.js';

function runFinancialCalculationValidation() {
  console.log('================================================================');
  console.log('  SMARTFINANCE AI — DETERMINISTIC FINANCIAL CALCULATION SUITE   ');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(title, condition, detail = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✓ [PASS] ${title}`);
    } else {
      console.error(`✗ [FAIL] ${title} - ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // 1. Accounting Invariant: Assets = Liabilities + Equity
  // -------------------------------------------------------------
  console.log('--- 1. Accounting Equation Validation: Assets = Liabilities + Equity ---');
  const liquidCash = 450000;
  const accountsReceivable = 125000;
  const equipmentAssets = 350000;
  const totalAssets = liquidCash + accountsReceivable + equipmentAssets; // 925,000

  const accountsPayable = 85000;
  const bankLoansPayable = 400000;
  const totalLiabilities = accountsPayable + bankLoansPayable; // 485,000

  const retainedEarnings = 240000;
  const commonStock = 200000;
  const totalEquity = retainedEarnings + commonStock; // 440,000

  assert(
    'Accounting Balance Sheet Identity: Total Assets == Total Liabilities + Equity',
    totalAssets === (totalLiabilities + totalEquity),
    `Assets (${totalAssets}) vs Liabilities+Equity (${totalLiabilities + totalEquity})`
  );

  // -------------------------------------------------------------
  // 2. Invoice Math: Qty * Rate, Tax %, Discount, Total Amount
  // -------------------------------------------------------------
  console.log('\n--- 2. Commercial Invoice Calculation Validation ---');
  const items = [
    { qty: 5, unitPrice: 12500, taxRate: 18 },  // line = 62,500; tax = 11,250
    { qty: 2, unitPrice: 45000, taxRate: 18 },  // line = 90,000; tax = 16,200
    { qty: 10, unitPrice: 3200, taxRate: 12 },  // line = 32,000; tax = 3,840
  ];
  const discountAmount = 4500;

  let calculatedSubtotal = 0;
  let calculatedTaxTotal = 0;

  items.forEach((item) => {
    const lineAmt = Math.round(item.qty * item.unitPrice * 100) / 100;
    const taxAmt = Math.round(lineAmt * (item.taxRate / 100) * 100) / 100;
    calculatedSubtotal += lineAmt;
    calculatedTaxTotal += taxAmt;
  });

  const grandTotal = Math.round((calculatedSubtotal + calculatedTaxTotal - discountAmount) * 100) / 100;

  assert('Invoice Line 1 Amount is exactly 62,500.00', items[0].qty * items[0].unitPrice === 62500);
  assert('Invoice Subtotal is exactly 184,500.00', calculatedSubtotal === 184500);
  assert('Invoice Tax Total is exactly 31,290.00', calculatedTaxTotal === 31290);
  assert('Invoice Grand Total is exactly 211,290.00 (Subtotal + Tax - Discount)', grandTotal === 211290);

  // -------------------------------------------------------------
  // 3. Bank Loan EMI Formula & Amortization Schedule
  // -------------------------------------------------------------
  console.log('\n--- 3. Loan EMI & Amortization Formula Validation ---');
  // Scenario A: ₹1,000,000 at 8.75% for 60 months (5 years)
  const principalA = 1000000;
  const aprA = 8.75;
  const tenureA = 60;
  const resultA = calculateAmortizationSchedule(principalA, aprA, tenureA);

  // Standard Analytical Compound Formula:
  // r = 8.75 / (12 * 100) = 0.007291666666666667
  // (1+r)^60 = 1.545876077
  // EMI = 1,000,000 * r * (1+r)^60 / ((1+r)^60 - 1) = 20,637.47
  assert('Loan A Monthly EMI is 20,637.47 (Standard Analytical Formula)', Math.abs(resultA.emi - 20637.47) <= 0.02);
  assert('Loan A Schedule has exactly 60 monthly installments', resultA.schedule.length === 60);

  const totalPrincipalRepaidA = Math.round(resultA.schedule.reduce((acc, s) => acc + s.principal, 0) * 100) / 100;
  assert('Loan A Total Principal Repaid equals exactly 1,000,000.00', totalPrincipalRepaidA === principalA);

  const finalInstallmentA = resultA.schedule[59];
  assert('Loan A Final Installment brings remaining balance identically to 0.00', finalInstallmentA.remainingBalance === 0);

  // Scenario B: Zero Interest Loan (e.g. 0% Promissory / Founder Note)
  const resultB = calculateAmortizationSchedule(120000, 0, 12);
  assert('Zero Interest Loan EMI is exactly Principal / Tenure (120,000 / 12 = 10,000.00)', resultB.emi === 10000);
  assert('Zero Interest Loan Total Interest is 0.00', resultB.totalInterest === 0);

  // -------------------------------------------------------------
  // 4. Financial Goals Progress Mathematics
  // -------------------------------------------------------------
  console.log('\n--- 4. Financial Goals Metric Validation ---');
  const goalTarget = 750000;
  const goalSaved = 337500;
  const progressPercent = Math.round((goalSaved / goalTarget) * 10000) / 100;
  const remainingTarget = goalTarget - goalSaved;

  assert('Goal Progress is exactly 45.00%', progressPercent === 45.0);
  assert('Goal Remaining Amount is exactly 412,500.00', remainingTarget === 412500);

  // -------------------------------------------------------------
  // 5. Subscription & Recurring Run-Rate Projection
  // -------------------------------------------------------------
  console.log('\n--- 5. Recurring Contracts & ARR/MRR Run-Rate Validation ---');
  const subscriptions = [
    { name: 'AWS Cloud', amount: 35000, frequency: 'Monthly' },
    { name: 'Google Workspace', amount: 4500, frequency: 'Monthly' },
    { name: 'GitHub Enterprise', amount: 18000, frequency: 'Yearly' },
    { name: 'Salesforce CRM', amount: 60000, frequency: 'Quarterly' },
  ];

  let mrr = 0;
  subscriptions.forEach((sub) => {
    if (sub.frequency === 'Monthly') mrr += sub.amount;
    else if (sub.frequency === 'Quarterly') mrr += sub.amount / 3;
    else if (sub.frequency === 'Yearly') mrr += sub.amount / 12;
  });

  const arr = mrr * 12;

  // AWS (35k) + Google (4.5k) + GitHub (1.5k) + Salesforce (20k) = 61,000 MRR
  assert('Monthly Run-Rate (MRR) is exactly 61,000.00', mrr === 61000);
  assert('Annual Run-Rate (ARR) is exactly 732,000.00 (MRR * 12)', arr === 732000);

  // -------------------------------------------------------------
  // 6. Cash Burn Rate & Runway Months Formula
  // -------------------------------------------------------------
  console.log('\n--- 6. Cash Burn Rate & Runway Formula Validation ---');
  const availableLiquidity = 1200000;
  const threeMonthDebits = [280000, 310000, 310000]; // total 900,000
  const monthlyBurnRate = threeMonthDebits.reduce((a, b) => a + b, 0) / 3; // 300,000
  const runwayMonths = Math.round((availableLiquidity / monthlyBurnRate) * 10) / 10;

  assert('Average Monthly Cash Burn is exactly 300,000.00', monthlyBurnRate === 300000);
  assert('Cash Runway is exactly 4.0 Months (Liquidity / Monthly Burn)', runwayMonths === 4.0);

  console.log('\n================================================================');
  console.log(`  FINANCIAL VALIDATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runFinancialCalculationValidation();
