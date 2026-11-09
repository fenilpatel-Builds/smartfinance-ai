import mongoose from 'mongoose';

const reconciliationSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    statementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Statement',
    },
    reconciliationDate: {
      type: Date,
      default: Date.now,
    },
    statementPeriodStart: Date,
    statementPeriodEnd: Date,
    openingBalance: {
      type: Number,
      default: 0.0,
    },
    totalCredits: {
      type: Number,
      default: 0.0,
    },
    totalDebits: {
      type: Number,
      default: 0.0,
    },
    expectedBalance: {
      type: Number,
      required: true,
    },
    statementBalance: {
      type: Number,
      required: true,
    },
    difference: {
      type: Number,
      default: 0.0,
    },
    status: {
      type: String,
      enum: ['Matched', 'Unmatched', 'Needs Review', 'Reconciled'],
      default: 'Needs Review',
    },
    matchedTransactionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    unmatchedTransactionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    notes: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Reconciliation', reconciliationSchema);

