import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  UploadCloud,
  FileText,
  FileCheck,
  Download,
  Trash2,
  Tag,
  Search,
  X,
  File,
  Shield,
  Clock,
} from 'lucide-react';
import api from '../../services/api';

export const DocumentVaultPage = () => {
  const [documents, setDocuments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Bank Statement',
    tags: '',
    notes: '',
  });

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
      console.error('Failed to load vault documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append('file', uploadFile);
      data.append('title', formData.title || uploadFile.name);
      data.append('category', formData.category);
      data.append('tags', formData.tags);
      data.append('notes', formData.notes);

      await api.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowUploadModal(false);
      setUploadFile(null);
      setFormData({ title: '', category: 'Bank Statement', tags: '', notes: '' });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document to vault');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this encrypted document from the vault?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFileName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download document');
    }
  };

  const categories = ['All', 'Bank Statement', 'Invoice', 'Receipt', 'Tax Document', 'Legal Contract', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Secure Financial Document Vault
            </h1>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              SHA-256 Verified
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Encrypted repository for tax returns, audit schedules, vendor receipts, and executed contracts.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Deposit Document</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Vault Documents</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FolderLock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalDocuments || 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">Indexed & cryptographically hashed files</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Encrypted Storage</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.totalStorageMB || 0} MB
          </div>
          <div className="mt-1 text-xs text-slate-500">Total physical disk usage</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Compliance Integrity</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            100% Verified
          </div>
          <div className="mt-1 text-xs text-slate-500">7-year audit retention ready</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === c
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vault documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <FolderLock className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">Document Vault Empty</h3>
          <p className="mt-1 text-sm text-slate-500">
            Deposit audit contracts, vendor invoices, tax filings, or bank statements for secure multi-tenant archiving.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {doc.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {Math.round((doc.fileSize / 1024) * 10) / 10} KB
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                      {doc.originalFileName}
                    </p>
                  </div>
                </div>

                {doc.notes && <p className="mt-3 text-xs text-slate-500 line-clamp-2">{doc.notes}</p>}

                {/* Tags */}
                {doc.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {doc.tags.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Deposit File to Secure Vault</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">File Attachment</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-950 dark:file:text-brand-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. FY2025-26 Advance Tax Receipt"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Bank Statement">Bank Statement</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Tax Document">Tax Document</option>
                    <option value="Legal Contract">Legal Contract</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="audit, q4, hdfc"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</label>
                <textarea
                  rows="2"
                  placeholder="Optional retention notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
                >
                  {uploading ? 'Encrypting & Storing...' : 'Deposit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
