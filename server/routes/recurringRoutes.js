import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  detectRecurringTransactions,
} from '../controllers/recurringController.js';

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/', requireWorkspacePermission('viewer'), getRecurringTransactions);
router.post('/detect', requireWorkspacePermission('editor'), detectRecurringTransactions);
router.post('/', requireWorkspacePermission('editor'), createRecurringTransaction);
router.put('/:id', requireWorkspacePermission('editor'), updateRecurringTransaction);
router.delete('/:id', requireWorkspacePermission('editor'), deleteRecurringTransaction);

export default router;

