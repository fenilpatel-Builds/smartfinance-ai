import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import {
  getGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal,
} from '../controllers/goalController.js';

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/', requireWorkspacePermission('viewer'), getGoals);
router.post('/', requireWorkspacePermission('editor'), createGoal);
router.put('/:id', requireWorkspacePermission('editor'), updateGoal);
router.post('/:id/contribute', requireWorkspacePermission('editor'), contributeToGoal);
router.delete('/:id', requireWorkspacePermission('admin'), deleteGoal);

export default router;
