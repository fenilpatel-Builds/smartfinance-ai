import express from 'express';
import {
  getDashboardSummary,
  getBankSummary,
  getBalanceSheetReport,
  getIncomeExpenseReport,
  getCashFlowReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.get('/dashboard', getDashboardSummary);
router.get('/bank-summary', getBankSummary);
router.get('/balance-sheet', getBalanceSheetReport);
router.get('/income-expense', getIncomeExpenseReport);
router.get('/cash-flow', getCashFlowReport);

export default router;

