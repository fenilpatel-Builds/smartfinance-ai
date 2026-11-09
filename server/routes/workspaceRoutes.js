import express from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getCurrentWorkspace,
  updateCurrentWorkspace,
  getWorkspaceMembers,
  inviteMember,
  getAuditLogs,
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect);

router.post('/', createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/current', requireWorkspace, getCurrentWorkspace);
router.patch('/current', requireWorkspace, requireRoles('Super Admin', 'Workspace Owner'), updateCurrentWorkspace);
router.get('/members', requireWorkspace, getWorkspaceMembers);
router.get('/audit-logs', requireWorkspace, getAuditLogs);
router.post('/invite', requireWorkspace, requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), inviteMember);

export default router;

