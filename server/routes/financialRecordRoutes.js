import express from 'express';
import {
  getAssets,
  createAsset,
  deleteAsset,
  getLiabilities,
  createLiability,
  deleteLiability,
  getEquityRecords,
  createEquityRecord,
  deleteEquityRecord,
} from '../controllers/financialRecordController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const router = express.Router();

router.use(protect, requireWorkspace);

router.get('/assets', getAssets);
router.post('/assets', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createAsset);
router.delete('/assets/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), deleteAsset);

router.get('/liabilities', getLiabilities);
router.post('/liabilities', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createLiability);
router.delete('/liabilities/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), deleteLiability);

router.get('/equity', getEquityRecords);
router.post('/equity', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'), createEquityRecord);
router.delete('/equity/:id', requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'), deleteEquityRecord);

export default router;

