import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import {
  getLoans,
  getLoanById,
  createLoan,
  recordLoanPayment,
  deleteLoan,
} from '../controllers/loanController.js';

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/', requireWorkspacePermission('viewer'), getLoans);
router.get('/:id', requireWorkspacePermission('viewer'), getLoanById);
router.post('/', requireWorkspacePermission('editor'), createLoan);
router.post('/:id/payment', requireWorkspacePermission('editor'), recordLoanPayment);
router.delete('/:id', requireWorkspacePermission('editor'), deleteLoan);

export default router;
