import mongoose from 'mongoose';

const amortizationRowSchema = new mongoose.Schema({
  monthNumber: Number,
  paymentDate: Date,
  emi: Number,
  principalPaid: Number,
  interestPaid: Number,
  remainingPrincipal: Number,
});

const loanSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    lenderName: {
      type: String,
      required: true,
      trim: true,
    },
    loanType: {
      type: String,
      enum: ['Term Loan', 'Working Capital Loan', 'Vehicle Loan', 'Mortgage / Home Loan', 'Personal Loan', 'Credit Line'],
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
      required: true, // e.g. 9.5 for 9.5%
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
