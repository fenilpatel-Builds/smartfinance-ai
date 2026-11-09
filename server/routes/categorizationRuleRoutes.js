import express from 'express';
import {
  getCategorizationRules,
  createCategorizationRule,
  updateCategorizationRule,
  deleteCategorizationRule,
} from '../controllers/categorizationRuleController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.get('/', getCategorizationRules);
router.post('/', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createCategorizationRule);
router.patch('/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), updateCategorizationRule);
router.delete('/:id', requireRoles('Super Admin', 'Workspace Owner'), deleteCategorizationRule);

export default router;

