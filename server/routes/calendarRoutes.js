import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import { getFinancialCalendarEvents } from '../controllers/calendarController.js';

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/events', requireWorkspacePermission('viewer'), getFinancialCalendarEvents);

export default router;

