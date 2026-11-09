import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'STATEMENT_UPLOADED', 'TRANSACTION_IMPORT', 'RECONCILIATION_COMPLETED'
    },
    entityType: {
      type: String,
      required: true, // e.g. 'Statement', 'Transaction', 'BankAccount'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('AuditLog', auditLogSchema);

