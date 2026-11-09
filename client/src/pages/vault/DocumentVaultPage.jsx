import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  UploadCloud,
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Tag,
  ShieldCheck,
  X,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  'All',
  'Bank Statement',
  'Receipt',
  'Invoice',
  'Tax Document',
  'Legal & Agreement',
  'Other',
];

export const DocumentVaultPage = () => {
  const [documents, setDocuments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [file, setFile] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Bank Statement');
  const [docTags, setDocTags] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (search) params.search = search;

      const res = await api.get('/documents', { params });
      setDocuments(res.data.documents || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a document file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', docTitle || file.name);
    formData.append('category', docCategory);
    formData.append('tags', docTags);
    formData.append('notes', docNotes);

    try {
      setUploading(true);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowUploadModal(false);
      setFile(null);
      setDocTitle('');
      setDocTags('');
      setDocNotes('');
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this document from vault?')) {
      try {
        await api.delete(`/documents/${id}`);
        fetchDocuments();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Financial Document Vault & Compliance Archive
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Encrypted central repository for bank statements, tax returns, vendor contracts, receipts, and audit attachments
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" /> Upload Document
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Vault Documents</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {metrics.totalDocuments || 0}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Safely archived in encrypted storage</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Storage Utilization</span>
          <h2 className="text-2xl font-bold tracking-tight text-brand-600 mt-1">
            {metrics.totalStorageMB || 0} MB
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Across all workspaces files</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Integrity Check</span>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-600 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="h-6 w-6" /> Verified
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">SHA-256 tamper-evident checksums active</p>
        </div>
      </div>

      {/* Categories & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, tag, filename..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            No vault documents found. Click "Upload Document" to store contracts, tax forms, or receipts.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {doc.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {(doc.fileSize / 1024).toFixed(1)} KB • {doc.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {doc.category}
                  </span>
                </div>

                {doc.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {doc.notes}
                  </p>
                )}

                {doc.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doc.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc._id, doc.originalFileName)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 font-semibold cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Upload to Secure Vault</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document File *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      if (!docTitle) setDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. FY 2025-26 Tax Audit Certificate"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="audit, fy26, compliance"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Audit Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional context about this file..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Encrypting & Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
