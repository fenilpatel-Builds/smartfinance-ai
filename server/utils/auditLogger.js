import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  workspaceId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
  resourceType,
  resourceId,
  details,
}) => {
  try {
    await AuditLog.create({
      workspaceId,
      userId,
      action: action || 'ACTION',
      entityType: entityType || resourceType || 'System',
      entityId: entityId || resourceId || undefined,
      metadata: metadata || details || {},
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit:', err.message);
  }
};
