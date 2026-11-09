import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import { attachWorkspace, requireWorkspacePermission } from '../middleware/workspaceIsolation.js';
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '../controllers/documentVaultController.js';

const vaultDir = path.resolve(process.cwd(), 'uploads', 'vault');
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vaultDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const router = express.Router();

router.use(requireAuth, attachWorkspace);

router.get('/', requireWorkspacePermission('viewer'), getDocuments);
router.post('/upload', requireWorkspacePermission('editor'), upload.single('file'), uploadDocument);
router.get('/:id/download', requireWorkspacePermission('viewer'), downloadDocument);
router.delete('/:id', requireWorkspacePermission('editor'), deleteDocument);

export default router;
