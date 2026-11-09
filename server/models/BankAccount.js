import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
    },
    maskedAccountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
    },
    encryptedAccountNumber: {
      type: String,
    },
    accountType: {
      type: String,
      enum: ['Savings', 'Current', 'Overdraft', 'Credit Card', 'Loan', 'Other'],
      default: 'Savings',
    },
    accountNickname: {
      type: String,
      trim: true,
    },
    ifscCode: {
      type: String,
      trim: true,
    },
    bankBranch: {
      type: String,
      trim: true,
    },
    accountGroup: {
      type: String,
      enum: ['Operating', 'Payroll', 'Reserve', 'Investment', 'Tax', 'General'],
      default: 'Operating',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    openingBalance: {
      type: Number,
      default: 0.0,
    },
    currentCalculatedBalance: {
      type: Number,
      default: 0.0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

bankAccountSchema.index({ workspaceId: 1, maskedAccountNumber: 1 });

export default mongoose.model('BankAccount', bankAccountSchema);

