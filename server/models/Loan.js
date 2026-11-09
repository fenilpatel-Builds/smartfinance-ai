import mongoose from 'mongoose';

const amortizationRowSchema = new mongoose.Schema({
  monthNumber: Number,
  installmentNumber: Number,
  paymentDate: Date,
  dueDate: Date,
  emi: Number,
  principalPaid: Number,
  principal: Number,
  interestPaid: Number,
  interest: Number,
  remainingPrincipal: Number,
  remainingBalance: Number,
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidDate: Date,
});

const loanSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    loanName: {
      type: String,
      trim: true,
    },
    lenderName: {
      type: String,
      required: true,
      trim: true,
    },
    loanType: {
      type: String,
      default: 'Term Loan',
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    annualInterestRate: {
      type: Number,
      required: true,
      min: 0,
    },
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    emiAmount: {
      type: Number,
      required: true,
    },
    remainingPrincipal: {
      type: Number,
      required: true,
    },
    totalInterestPayable: {
      type: Number,
      default: 0,
    },
    totalAmountPayable: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    nextPaymentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Active', 'Paid Off', 'Defaulted', 'Restructured'],
      default: 'Active',
    },
    amortizationSchedule: [amortizationRowSchema],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

loanSchema.index({ workspaceId: 1, nextPaymentDate: 1 });

export default mongoose.model('Loan', loanSchema);
