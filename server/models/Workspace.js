import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    financialYearStart: {
      type: String,
      default: '04-01', // April 1st for Indian financial year (or Jan 1st 01-01)
    },
    settings: {
      allowAIAnalysis: { type: Boolean, default: true },
      duplicateThresholdDays: { type: Number, default: 2 },
      strictBalanceCheck: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Workspace', workspaceSchema);

