import express from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkCategorizeTransactions,
  exportTransactions,
  splitTransaction,
  updateTransactionTags,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.get('/export', exportTransactions);
router.get('/', getTransactions);
router.post('/', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createTransaction);
router.post('/bulk-categorize', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), bulkCategorizeTransactions);
router.post('/:id/split', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), splitTransaction);
router.patch('/:id/tags', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), updateTransactionTags);
router.get('/:id', getTransactionById);
router.patch('/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), updateTransaction);
router.delete('/:id', requireRoles('Super Admin', 'Workspace Owner'), deleteTransaction);

export default router;

