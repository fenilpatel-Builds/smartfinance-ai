import express from 'express';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.get('/', getBudgets);
router.post('/', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createBudget);
router.patch('/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), updateBudget);
router.delete('/:id', requireRoles('Super Admin', 'Workspace Owner'), deleteBudget);

export default router;

