import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import DocumentVault from '../models/DocumentVault.js';
import { logAudit } from '../utils/auditLogger.js';

export const getDocuments = async (req, res, next) => {
  try {
    const { category, search, tag } = req.query;
    const filter = { workspaceId: req.workspace._id };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      const reg = new RegExp(search, 'i');
      filter.$or = [{ title: reg }, { originalFileName: reg }, { notes: reg }, { tags: reg }];
    }

    const documents = await DocumentVault.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    const totalStorageBytes = documents.reduce((acc, d) => acc + (d.fileSize || 0), 0);

    res.json({
      success: true,
      documents,
      metrics: {
        totalDocuments: documents.length,
        totalStorageBytes,
        totalStorageMB: Math.round((totalStorageBytes / (1024 * 1024)) * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, category = 'Other', notes, tags, linkedTransactionId, linkedBankAccountId } = req.body;

    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const parsedTags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : tags || [];

    const doc = await DocumentVault.create({
      workspaceId: req.workspace._id,
      uploadedBy: req.user._id,
      title: title || req.file.originalname,
      category,
      originalFileName: req.file.originalname,
      storedFilePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash: hash,
      tags: parsedTags,
      notes: notes || '',
      linkedTransactionId: linkedTransactionId || undefined,
      linkedBankAccountId: linkedBankAccountId || undefined,
    });

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'UPLOAD_VAULT_DOCUMENT',
      resourceType: 'DocumentVault',
      resourceId: doc._id,
      details: { title: doc.title, originalFileName: doc.originalFileName, size: doc.fileSize },
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};

export const downloadDocument = async (req, res, next) => {
  try {
    const doc = await DocumentVault.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!fs.existsSync(doc.storedFilePath)) {
      return res.status(404).json({ success: false, message: 'File not found on storage disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalFileName)}"`);
    res.setHeader('Content-Type', doc.mimeType);

    const fileStream = fs.createReadStream(doc.storedFilePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await DocumentVault.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (fs.existsSync(doc.storedFilePath)) {
      try {
        fs.unlinkSync(doc.storedFilePath);
      } catch (e) {
        console.warn('Failed to delete physical file:', e.message);
      }
    }

    await doc.deleteOne();

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'DELETE_VAULT_DOCUMENT',
      resourceType: 'DocumentVault',
      resourceId: doc._id,
      details: { title: doc.title },
    });

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    next(err);
  }
};

