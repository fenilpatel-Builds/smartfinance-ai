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
    anomalyType: {
      type: String,
      enum: [
        'Unusually Large Amount',
        'Sudden Spending Surge',
        'Duplicate Risk',
        'Unusual Counterparty',
        'Unexpected Recurring Spike',
        'Balance Jump Discrepancy',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
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
    status: {
      type: String,
      enum: ['Pending Review', 'Confirmed Anomaly', 'Dismissed as Normal'],
      default: 'Pending Review',
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
