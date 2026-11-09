import mongoose from 'mongoose';

const statementSchema = new mongoose.Schema(
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
    originalFileName: {
      type: String,
      required: true,
    },
    storedFilePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileHash: {
      type: String,
    },
    statementPeriodStart: {
      type: Date,
    },
    statementPeriodEnd: {
      type: Date,
    },
    openingBalance: {
      type: Number,
      default: 0.0,
    },
    closingBalance: {
      type: Number,
      default: 0.0,
    },
    extractedTransactionCount: {
      type: Number,
      default: 0,
    },
    importedTransactionCount: {
      type: Number,
      default: 0,
    },
    importBatchId: {
      type: String,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ['UPLOADED', 'PARSING', 'PREVIEW_READY', 'IMPORTED', 'FAILED'],
      default: 'UPLOADED',
    },
    processingErrors: [String],
    processingWarnings: [String],
    ocrConfidence: {
      type: Number,
      default: 1.0,
    },
    extractionQuality: {
      type: String,
      enum: ['high', 'medium', 'low', 'review_required'],
      default: 'high',
    },
    pageProcessingStatuses: [
      {
        pageNumber: Number,
        status: String,
        hasTables: Boolean,
        ocrUsed: Boolean,
      },
    ],
    anomalies: [
      {
        anomalyType: String,
        description: String,
        severity: String,
        transactionIndex: Number,
      },
    ],
    processingJobId: {
      type: String,
      index: true,
    },
    columnMappingRequired: {
      type: Boolean,
      default: false,
    },
    availableHeaders: [String],
    extractedDataCache: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

statementSchema.index({ workspaceId: 1, fileHash: 1 });

export default mongoose.model('Statement', statementSchema);

