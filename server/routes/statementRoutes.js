import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadStatement,
  getStatements,
  getStatementPreview,
  confirmImport,
  rollbackImport,
  reprocessStatement,
  deleteStatement,
} from '../controllers/statementController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspace, requireRoles } from '../middleware/workspace.js';

const uploadDir = path.resolve('uploads/statements');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `statement-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.xlsx', '.xls', '.csv', '.txt', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Allowed formats: PDF, Excel (.xlsx, .xls), CSV, PNG, JPG`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '25000000', 10) },
  fileFilter,
});

const router = express.Router();

router.use(protect, requireWorkspace);

router.post(
  '/upload',
  requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'),
  upload.single('statement'),
  uploadStatement
);

router.get('/', getStatements);
router.get('/:id/preview', getStatementPreview);
router.post(
  '/:id/confirm-import',
  requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'),
  confirmImport
);
router.post(
  '/:id/rollback',
  requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager'),
  rollbackImport
);
router.post(
  '/:id/reprocess',
  requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant'),
  reprocessStatement
);
router.delete('/:id', requireRoles('Super Admin', 'Workspace Owner'), deleteStatement);

export default router;

