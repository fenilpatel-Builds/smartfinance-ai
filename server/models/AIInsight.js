import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    insightType: {
      type: String,
      enum: [
        'spending_pattern',
        'unusual_transaction',
        'merchant_analysis',
        'budget_alert',
        'financial_summary',
        'cash_flow_optimization',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical', 'positive'],
      default: 'info',
    },
    relatedTransactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    recommendations: [String],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('AIInsight', aiInsightSchema);

