import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import { recalculateBankAccountBalance } from '../services/financialEngine.js';
import { logAudit } from '../utils/auditLogger.js';

export const calculateAmortizationSchedule = (principal, annualRate, tenureMonths, startDate = new Date()) => {
  const p = Number(principal);
  const rAnnual = Number(annualRate);
  const n = parseInt(tenureMonths, 10);
  const monthlyRate = rAnnual / (12 * 100);

  let emi = 0;
  if (monthlyRate === 0) {
    emi = p / n;
  } else {
    const factor = Math.pow(1 + monthlyRate, n);
    emi = (p * monthlyRate * factor) / (factor - 1);
  }
  emi = Math.round(emi * 100) / 100;

  const schedule = [];
  let remaining = p;
  const start = new Date(startDate);

  for (let month = 1; month <= n; month++) {
    const interest = Math.round(remaining * monthlyRate * 100) / 100;
    let principalPaid = Math.round((emi - interest) * 100) / 100;

    if (month === n || principalPaid > remaining) {
      principalPaid = remaining;
      emi = Math.round((principalPaid + interest) * 100) / 100;
      remaining = 0;
    } else {
      remaining = Math.round((remaining - principalPaid) * 100) / 100;
    }

    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + month);

    schedule.push({
      installmentNumber: month,
      dueDate,
      emi,
      principal: principalPaid,
      interest,
      remainingBalance: Math.max(0, remaining),
      isPaid: false,
    });
  }

  const totalInterest = Math.round(schedule.reduce((acc, s) => acc + s.interest, 0) * 100) / 100;
  const totalAmount = Math.round((p + totalInterest) * 100) / 100;

  return {
    emi,
    totalInterest,
    totalAmount,
    schedule,
  };
};

export const getLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find({ workspaceId: req.workspace._id }).sort({ createdAt: -1 });

    const totalPrincipal = Math.round(loans.reduce((acc, l) => acc + l.principalAmount, 0) * 100) / 100;
    const totalRemaining = Math.round(loans.reduce((acc, l) => acc + l.remainingPrincipal, 0) * 100) / 100;
    const totalMonthlyEmi = Math.round(loans.reduce((acc, l) => (l.status === 'Active' ? acc + l.emiAmount : acc), 0) * 100) / 100;

    res.json({
      success: true,
      loans,
      metrics: {
        totalLoans: loans.length,
        activeLoans: loans.filter((l) => l.status === 'Active').length,
        totalPrincipal,
        totalRemainingDebt: totalRemaining,
        totalMonthlyEmi,
        totalPaidOff: Math.round((totalPrincipal - totalRemaining) * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

export const createLoan = async (req, res, next) => {
  try {
    const {
      loanName,
      lenderName,
      loanType = 'Business Loan',
      principalAmount,
      annualInterestRate,
      tenureMonths,
      startDate = new Date(),
      accountNumber,
      notes,
    } = req.body;

    if (!loanName || !lenderName || !principalAmount || !annualInterestRate || !tenureMonths) {
      return res.status(400).json({ success: false, message: 'Missing required loan parameters' });
    }

    const { emi, totalInterest, totalAmount, schedule } = calculateAmortizationSchedule(
      principalAmount,
      annualInterestRate,
      tenureMonths,
      startDate
    );

    const firstDue = schedule[0] ? schedule[0].dueDate : new Date();

    const loan = await Loan.create({
      workspaceId: req.workspace._id,
      loanName,
      lenderName,
      loanType,
      principalAmount: Number(principalAmount),
      annualInterestRate: Number(annualInterestRate),
      tenureMonths: parseInt(tenureMonths, 10),
      startDate: new Date(startDate),
      nextPaymentDate: firstDue,
      emiAmount: emi,
      remainingPrincipal: Number(principalAmount),
      totalInterestPayable: totalInterest,
      totalAmountPayable: totalAmount,
      accountNumber,
      notes,
      amortizationSchedule: schedule,
      status: 'Active',
    });

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'CREATE_LOAN',
      resourceType: 'Loan',
      resourceId: loan._id,
      details: { loanName, principalAmount, emiAmount: emi },
    });

    res.status(201).json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

export const recordLoanPayment = async (req, res, next) => {
  try {
    const { paymentAmount, paymentDate = new Date(), bankAccountId, notes } = req.body;

    const loan = await Loan.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const payAmt = Number(paymentAmount) || loan.emiAmount;

    // Find next unpaid installment in schedule
    const unpaidInstallment = loan.amortizationSchedule.find((s) => !s.isPaid);
    if (unpaidInstallment) {
      unpaidInstallment.isPaid = true;
      unpaidInstallment.paidDate = new Date(paymentDate);
      loan.remainingPrincipal = unpaidInstallment.remainingBalance;
    } else {
      loan.remainingPrincipal = Math.max(0, Math.round((loan.remainingPrincipal - payAmt) * 100) / 100);
    }

    if (loan.remainingPrincipal <= 0) {
      loan.status = 'Paid Off';
      loan.remainingPrincipal = 0;
    }

    // Advance next payment date
    const nextUnpaid = loan.amortizationSchedule.find((s) => !s.isPaid);
    if (nextUnpaid) {
      loan.nextPaymentDate = nextUnpaid.dueDate;
    }

    // Optional: create debit transaction from bank account
    if (bankAccountId) {
      await Transaction.create({
        workspaceId: req.workspace._id,
        bankAccountId,
        transactionDate: new Date(paymentDate),
        description: `Loan EMI Payment - ${loan.lenderName} (${loan.loanName})`,
        normalizedDescription: `Loan EMI - ${loan.loanName}`,
        debit: payAmt,
        credit: 0,
        amount: payAmt,
        transactionType: 'debit',
        categoryName: 'Debt & Loans',
        merchant: loan.lenderName,
        notes: notes || `Installment for ${loan.loanName}`,
        categorizationSource: 'auto_rule',
      });

      await recalculateBankAccountBalance(bankAccountId, req.workspace._id);
    }

    await loan.save();

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'RECORD_LOAN_PAYMENT',
      resourceType: 'Loan',
      resourceId: loan._id,
      details: { paymentAmount: payAmt, remaining: loan.remainingPrincipal },
    });

    res.json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

export const deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findOneAndDelete({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({ success: true, message: 'Loan deleted successfully' });
  } catch (err) {
    next(err);
  }
};

