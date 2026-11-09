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
    description: {
      type: String,
      trim: true,
    },
    recurringType: {
      type: String,
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
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Yearly'],
      default: 'Monthly',
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

recurringTransactionSchema.pre('save', function (next) {
  if (!this.title) {
    this.title = this.merchant || this.description || 'Recurring Expense';
  }
  next();
});

recurringTransactionSchema.index({ workspaceId: 1, nextExpectedDate: 1 });

export default mongoose.model('RecurringTransaction', recurringTransactionSchema);
