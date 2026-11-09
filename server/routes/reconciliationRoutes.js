import express from 'express';
import {
  getReconciliations,
  getReconciliationById,
  startReconciliation,
  matchTransactions,
  completeReconciliation,
} from '../controllers/reconciliationController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.get('/', getReconciliations);
router.post('/', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), startReconciliation);
router.get('/:id', getReconciliationById);
router.post('/:id/match', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), matchTransactions);
router.post('/:id/complete', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), completeReconciliation);

export default router;

