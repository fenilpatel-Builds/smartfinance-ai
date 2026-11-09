import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.get('/', getCategories);
router.post('/', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createCategory);
router.patch('/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), updateCategory);
router.delete('/:id', requireRoles('Super Admin', 'Workspace Owner'), deleteCategory);

export default router;

