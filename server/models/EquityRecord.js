import mongoose from 'mongoose';

const equityRecordSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    equityType: {
      type: String,
      enum: [
        "Owner's Capital",
        'Retained Earnings',
        'Current Period Profit/Loss',
        'Other Equity',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
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

export default mongoose.model('EquityRecord', equityRecordSchema);

