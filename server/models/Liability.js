import mongoose from 'mongoose';

const liabilitySchema = new mongoose.Schema(
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
    liabilityType: {
      type: String,
      enum: [
        'Accounts Payable',
        'Loans',
        'Credit Card Outstanding',
        'Taxes Payable',
        'Other Liabilities',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
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

export default mongoose.model('Liability', liabilitySchema);

