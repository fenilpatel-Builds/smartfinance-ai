import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import {
  getAnomalies,
  scanAnomalies,
  updateAnomalyStatus,
} from '../controllers/anomalyController.js';

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/', requireWorkspacePermission('viewer'), getAnomalies);
router.post('/scan', requireWorkspacePermission('editor'), scanAnomalies);
router.put('/:id', requireWorkspacePermission('editor'), updateAnomalyStatus);

export default router;
