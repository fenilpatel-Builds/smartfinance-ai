import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Trash2,
  Check,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

export const StatementsUploadPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [statements, setStatements] = useState([]);
  const [previewStatement, setPreviewStatement] = useState(null);
  const [editableTxs, setEditableTxs] = useState([]);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchAccountsAndStatements = async () => {
    try {
      const [accRes, stmtRes] = await Promise.all([
        api.get('/bank-accounts'),
        api.get('/statements'),
      ]);
      setAccounts(accRes.data.accounts || []);
      if (accRes.data.accounts?.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accRes.data.accounts[0]._id);
      }
      setStatements(stmtRes.data.statements || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchAccountsAndStatements();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndProcess = async (e) => {
    e.preventDefault();
    if (!file || !selectedAccountId) {
      alert('Please select a bank account and file');
      return;
    }

    const formData = new FormData();
    formData.append('statement', file);
    formData.append('bankAccountId', selectedAccountId);

    setIsUploading(true);
    setProgressMsg('Uploading document to secure financial storage...');

    try {
      setTimeout(() => setProgressMsg('Python engine detecting bank layout & extracting tables...'), 1200);
      setTimeout(() => setProgressMsg('Normalizing transaction dates, amounts & calculating running balances...'), 2600);

      const res = await api.post('/statements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const stmt = res.data.statement;
      setPreviewStatement(stmt);
      setEditableTxs(stmt.extractedTransactions || []);
      setFile(null);
      fetchAccountsAndStatements();
    } catch (err) {
      alert(err.response?.data?.message || 'Processing failed');
    } finally {
      setIsUploading(false);
      setProgressMsg('');
    }
  };

  const handleConfirmImport = async () => {
    if (!previewStatement) return;
    setImporting(true);

    try {
      await api.post(`/statements/${previewStatement.id}/confirm-import`, {
        transactions: editableTxs,
        includeDuplicates,
      });

      alert('Transactions successfully confirmed and imported to your active ledger!');
      setPreviewStatement(null);
      setEditableTxs([]);
      fetchAccountsAndStatements();
    } catch (err) {
      alert(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleTxChange = (idx, field, value) => {
    const updated = [...editableTxs];
    updated[idx][field] = value;
    setEditableTxs(updated);
  };

  const handleDeleteStatement = async (id) => {
    if (window.confirm('Delete this statement and its transactions?')) {
      try {
        await api.delete(`/statements/${id}?deleteTransactions=true`);
        fetchAccountsAndStatements();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Bank Statement Upload & Processing
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Multi-format statement parsing engine (PDF, Excel, CSV, Scanned OCR) with verification review before MongoDB import
        </p>
      </div>

      {/* Upload Box Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleUploadAndProcess} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Bank Account *
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.bankName} ({a.maskedAccountNumber}) — {a.accountNickname || a.accountType}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-[11px] text-slate-500 pb-2">
                Supported formats: <strong>PDF</strong>, <strong>XLSX</strong>, <strong>XLS</strong>, <strong>CSV</strong>, Scanned Image Statements
              </span>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              file
                ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                : 'border-slate-300 hover:border-brand-400 dark:border-slate-700 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>

            {file ? (
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand-600" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</span>
                <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded p-1 text-slate-400 hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drag and drop your bank statement here, or{' '}
                  <label className="text-brand-600 hover:underline cursor-pointer dark:text-brand-400">
                    browse files
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Statements will be extracted in an isolated preview sandbox before confirmation
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Sample files available in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">sample-data/</code>
            </span>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? progressMsg || 'Processing document...' : 'Extract & Preview Statement'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Extraction Preview Review Modal / Dialog */}
      {previewStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    Extraction Preview
                  </span>
                  <span className="text-xs text-slate-400">• Verification Step</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {previewStatement.originalFileName}
                </h3>
              </div>
              <button
                onClick={() => setPreviewStatement(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Validation & Balance Summary Cards */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400">Detected Bank</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {previewStatement.detectedBank || 'Generic Bank'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400">Opening Balance</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  ₹{(previewStatement.summary?.openingBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400">Total Credits / Debits</span>
                <p className="font-bold text-emerald-600 mt-0.5">
                  +₹{(previewStatement.summary?.totalCredits || 0).toLocaleString()}{' '}
                  <span className="text-rose-600 font-normal">
                    (-₹{(previewStatement.summary?.totalDebits || 0).toLocaleString()})
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-slate-400">Closing Balance Check</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  ₹{(previewStatement.summary?.closingBalance || 0).toLocaleString()}
                  {previewStatement.summary?.isBalanceReconciled ? (
                    <span className="text-emerald-600 text-[10px] flex items-center font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Balanced
                    </span>
                  ) : (
                    <span className="text-amber-600 text-[10px] flex items-center font-semibold">
                      <AlertCircle className="h-3 w-3" /> Discrepancy
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Warnings or Column Mapping required notice */}
            {previewStatement.validation?.warnings?.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Validation Observations ({previewStatement.validation.warnings.length})</span>
                </div>
                <ul className="mt-1 list-disc pl-5 text-[11px] space-y-0.5">
                  {previewStatement.validation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editable Transactions Table */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Extracted Transactions ({editableTxs.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  You can edit values directly before confirming import
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] text-slate-500 dark:bg-slate-800">
                    <tr>
                      <th className="p-2.5 font-semibold">Date</th>
                      <th className="p-2.5 font-semibold">Description</th>
                      <th className="p-2.5 font-semibold">Debit</th>
                      <th className="p-2.5 font-semibold">Credit</th>
                      <th className="p-2.5 font-semibold">Category</th>
                      <th className="p-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {editableTxs.map((tx, idx) => (
                      <tr key={idx} className={tx.isDuplicate ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={tx.transactionDate}
                            onChange={(e) => handleTxChange(idx, 'transactionDate', e.target.value)}
                            className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={tx.description}
                            onChange={(e) => handleTxChange(idx, 'description', e.target.value)}
                            className="w-full min-w-[200px] rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            value={tx.debit || ''}
                            onChange={(e) => handleTxChange(idx, 'debit', e.target.value)}
                            className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-rose-600 dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            value={tx.credit || ''}
                            onChange={(e) => handleTxChange(idx, 'credit', e.target.value)}
                            className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-emerald-600 dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={tx.category || ''}
                            onChange={(e) => handleTxChange(idx, 'category', e.target.value)}
                            className="w-28 rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          {tx.isDuplicate ? (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              Duplicate
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with Duplicate option & Confirm Import button */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDuplicates}
                  onChange={(e) => setIncludeDuplicates(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600"
                />
                <span>Include duplicate rows in final import</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewStatement(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || editableTxs.length === 0}
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  {importing ? 'Importing...' : `Confirm & Import ${editableTxs.length} Transactions`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement History List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Document History & Processing Logs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
              <tr>
                <th className="pb-2.5 font-medium">Document File</th>
                <th className="pb-2.5 font-medium">Bank Account</th>
                <th className="pb-2.5 font-medium">Upload Date</th>
                <th className="pb-2.5 font-medium">Transactions</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {statements.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-600" />
                    {s.originalFileName}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    {s.bankAccountId?.bankName} ({s.bankAccountId?.maskedAccountNumber})
                  </td>
                  <td className="py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {s.importedTransactionCount || s.extractedTransactionCount || 0}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.processingStatus === 'IMPORTED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : s.processingStatus === 'PREVIEW_READY'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {s.processingStatus}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteStatement(s._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

