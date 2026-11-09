import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({ workspaceId, userId, action, entityType, entityId, metadata }) => {
  try {
    await AuditLog.create({
      workspaceId,
      userId,
      action,
      entityType,
      entityId,
      metadata,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit:', err.message);
  }
};

