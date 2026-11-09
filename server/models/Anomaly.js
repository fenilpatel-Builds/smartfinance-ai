import mongoose from 'mongoose';

const anomalySchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
    },
    anomalyType: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      default: 'Medium',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    affectedAmount: {
      type: Number,
      default: 0.0,
    },
    confidenceScore: {
      type: Number,
      default: 0.85,
    },
    status: {
      type: String,
      default: 'Detected',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    flaggedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

anomalySchema.index({ workspaceId: 1, status: 1 });

export default mongoose.model('Anomaly', anomalySchema);
