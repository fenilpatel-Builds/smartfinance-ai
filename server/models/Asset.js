import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
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
    assetType: {
      type: String,
      enum: [
        'Cash',
        'Bank Accounts',
        'Accounts Receivable',
        'Inventory',
        'Fixed Assets',
        'Investments',
        'Other Assets',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    valuationDate: {
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

export default mongoose.model('Asset', assetSchema);

