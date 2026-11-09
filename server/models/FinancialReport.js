import mongoose from 'mongoose';

const financialReportSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: [
        'bank_position',
        'balance_sheet',
        'income_expense',
        'cash_flow',
        'category_expenses',
        'monthly_summary',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    dateRange: {
      start: Date,
      end: Date,
    },
    accountIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
      },
    ],
    generatedData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    fileReference: {
      type: String,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('FinancialReport', financialReportSchema);

