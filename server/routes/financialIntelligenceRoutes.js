import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import {
  getCashFlowForecast,
  getFinancialHealthScore,
  getCurrencyRates,
  convertCurrency,
} from '../controllers/financialIntelligenceController.js';

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/forecast', requireWorkspacePermission('viewer'), getCashFlowForecast);
router.get('/health-score', requireWorkspacePermission('viewer'), getFinancialHealthScore);
router.get('/currency/rates', requireWorkspacePermission('viewer'), getCurrencyRates);
router.post('/currency/convert', requireWorkspacePermission('viewer'), convertCurrency);

export default router;
