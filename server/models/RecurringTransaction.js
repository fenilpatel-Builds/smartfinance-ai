import mongoose from 'mongoose';

const recurringTransactionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    merchant: {
      type: String,
      trim: true,
    },
    categoryName: {
      type: String,
      default: 'Subscriptions',
    },
    recurringType: {
      type: String,
      enum: ['Subscription', 'Rent', 'EMI / Loan', 'Utility Bill', 'Insurance', 'Salary / Payroll', 'Vendor Payment'],
      default: 'Subscription',
    },
    expectedAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    lastPaymentDate: {
      type: Date,
    },
    nextExpectedDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Cancelled', 'Overdue'],
      default: 'Active',
    },
    isConfirmedByUser: {
      type: Boolean,
      default: true,
    },
    confidenceScore: {
      type: Number,
      default: 0.9,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

recurringTransactionSchema.index({ workspaceId: 1, nextExpectedDate: 1 });

export default mongoose.model('RecurringTransaction', recurringTransactionSchema);
