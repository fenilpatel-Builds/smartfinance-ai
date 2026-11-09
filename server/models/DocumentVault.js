import mongoose from 'mongoose';

const documentVaultSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Bank Statement', 'Invoice', 'Receipt', 'Tax Document', 'Loan Document', 'Financial Agreement', 'Other'],
      default: 'Receipt',
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    linkedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

documentVaultSchema.index({ workspaceId: 1, category: 1 });
documentVaultSchema.index({ workspaceId: 1, tags: 1 });

export default mongoose.model('DocumentVault', documentVaultSchema);
