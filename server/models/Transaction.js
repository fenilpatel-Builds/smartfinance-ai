import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
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
      index: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    valueDate: {
      type: Date,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedDescription: {
      type: String,
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    debit: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    categoryName: {
      type: String,
      default: 'Uncategorized',
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    merchant: {
      type: String,
      trim: true,
    },
    runningBalance: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    reconciliationStatus: {
      type: String,
      enum: ['Unreconciled', 'Matched', 'Reconciled', 'Needs Review'],
      default: 'Unreconciled',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['Verified', 'Pending', 'Flagged'],
      default: 'Verified',
    },
    isInternalTransfer: {
      type: Boolean,
      default: false,
    },
    linkedTransferTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    categorizationSource: {
      type: String,
      enum: ['auto_rule', 'ai_suggested', 'manual', 'default'],
      default: 'default',
    },
    categorizationConfidence: {
      type: Number,
      default: 1.0,
    },
    fingerprint: {
      type: String,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    chequeNumber: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    splits: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category',
        },
        categoryName: String,
        amount: {
          type: Number,
          required: true,
        },
        notes: String,
      },
    ],
    attachments: [
      {
        fileName: String,
        filePath: String,
        fileSize: Number,
        mimeType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
    },
    originalCurrency: {
      type: String,
      default: 'INR',
    },
    originalAmount: {
      type: Number,
    },
    exchangeRate: {
      type: Number,
      default: 1.0,
    },
    activityHistory: [
      {
        action: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: String,
          default: 'System',
        },
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ workspaceId: 1, transactionDate: -1 });
transactionSchema.index({ workspaceId: 1, bankAccountId: 1, transactionDate: -1 });
transactionSchema.index({ workspaceId: 1, fingerprint: 1 });

export default mongoose.model('Transaction', transactionSchema);

