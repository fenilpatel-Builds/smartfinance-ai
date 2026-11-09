import express from 'express';
import { analyzeSpending, chatAssistant } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.post('/analyze-spending', analyzeSpending);
router.post('/assistant', chatAssistant);
router.post('/chat', chatAssistant);
router.post('/financial-summary', analyzeSpending);

export default router;

