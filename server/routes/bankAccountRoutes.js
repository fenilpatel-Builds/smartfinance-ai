import express from 'express';
import {
  createBankAccount,
  getBankAccounts,
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
} from '../controllers/bankAccountController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.post('/', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createBankAccount);
router.get('/', getBankAccounts);
router.get('/:id', getBankAccountById);
router.patch('/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), updateBankAccount);
router.delete('/:id', requireRoles('Super Admin', 'Workspace Owner'), deleteBankAccount);

export default router;

