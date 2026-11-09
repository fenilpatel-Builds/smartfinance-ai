import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  recordPayment,
  deleteInvoice,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/', requireWorkspacePermission('viewer'), getInvoices);
router.get('/:id', requireWorkspacePermission('viewer'), getInvoiceById);
router.post('/', requireWorkspacePermission('editor'), createInvoice);
router.put('/:id', requireWorkspacePermission('editor'), updateInvoice);
router.post('/:id/payment', requireWorkspacePermission('editor'), recordPayment);
router.delete('/:id', requireWorkspacePermission('editor'), deleteInvoice);

export default router;

