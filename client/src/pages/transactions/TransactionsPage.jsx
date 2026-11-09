import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Plus,
  ArrowUpDown,
  Building2,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  FileSpreadsheet,
  X,
  Check,
} from 'lucide-react';
import api from '../../services/api';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [sortBy, setSortBy] = useState('transactionDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Multi-select & Bulk action
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState('');

  // Add Manual Tx Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState({
    bankAccountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    transactionType: 'debit',
    categoryId: '',
    merchant: '',
    referenceNumber: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, catRes] = await Promise.all([
        api.get('/bank-accounts'),
        api.get('/categories'),
      ]);
      setAccounts(accRes.data.accounts || []);
      setCategories(catRes.data.categories || []);
      if (accRes.data.accounts?.length > 0 && !newTx.bankAccountId) {
        setNewTx((prev) => ({ ...prev, bankAccountId: accRes.data.accounts[0]._id }));
      }
    } catch (err) {
      console.error('Failed loading metadata:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 25,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (bankAccountId) params.bankAccountId = bankAccountId;
      if (categoryId) params.categoryId = categoryId;
      if (transactionType) params.transactionType = transactionType;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, search, bankAccountId, categoryId, transactionType, sortBy, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedTxIds.length === transactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(transactions.map((t) => t._id));
    }
  };

  const toggleSelectTx = (id) => {
    if (selectedTxIds.includes(id)) {
      setSelectedTxIds(selectedTxIds.filter((item) => item !== id));
    } else {
      setSelectedTxIds([...selectedTxIds, id]);
    }
  };

  const handleBulkCategorize = async () => {
    if (!bulkCategory || selectedTxIds.length === 0) return;
    try {
      await api.post('/transactions/bulk-categorize', {
        transactionIds: selectedTxIds,
        categoryName: bulkCategory,
      });
      setSelectedTxIds([]);
      setBulkCategory('');
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk categorize failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleExport = (format) => {
    const token = localStorage.getItem('token');
    const wsId = localStorage.getItem('currentWorkspaceId');
    const url = `/api/v1/transactions/export?format=${format}&workspaceId=${wsId}&token=${token}`;
    window.open(url, '_blank');
  };

  const handleAddTx = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', newTx);
      setShowAddModal(false);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, bulk categorize, and export normalized multi-bank transaction records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 md:grid-cols-5 text-xs">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search description, merchant, ref..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
          />
        </div>

        {/* Bank Account Filter */}
        <div>
          <select
            value={bankAccountId}
            onChange={(e) => {
              setBankAccountId(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
          >
            <option value="">All Bank Accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.bankName} ({a.maskedAccountNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="debit">Debits (Expenses)</option>
            <option value="credit">Credits (Income)</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedTxIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-xs">
          <span className="font-semibold text-brand-900 dark:text-brand-300">
            {selectedTxIds.length} transactions selected
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              placeholder="Assign Category name..."
              className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              onClick={handleBulkCategorize}
              className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white hover:bg-brand-500"
            >
              Apply to Selected
            </button>
            <button
              onClick={() => setSelectedTxIds([])}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10">
                  <button onClick={toggleSelectAll} className="cursor-pointer">
                    {selectedTxIds.length === transactions.length && transactions.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-brand-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3">Date</th>
                <th className="p-3">Bank Account</th>
                <th className="p-3">Description & Counterparty</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Credit</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => (
                <tr
                  key={t._id}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${
                    selectedTxIds.includes(t._id) ? 'bg-brand-50/20 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <td className="p-3">
                    <button onClick={() => toggleSelectTx(t._id)} className="cursor-pointer">
                      {selectedTxIds.includes(t._id) ? (
                        <CheckSquare className="h-4 w-4 text-brand-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-500">
                    {new Date(t.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {t.bankAccountId?.bankName || 'Bank'}
                    </span>
                    <p className="text-[10px] text-slate-400">{t.bankAccountId?.maskedAccountNumber}</p>
                  </td>
                  <td className="p-3 pr-4 max-w-xs">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {t.merchant || t.description}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{t.description}</p>
                    {t.referenceNumber && (
                      <span className="text-[10px] text-slate-400 font-mono">Ref: {t.referenceNumber}</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: (t.categoryId?.color || '#6366f1') + '15',
                        color: t.categoryId?.color || '#6366f1',
                      }}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {t.categoryName || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-rose-600 whitespace-nowrap">
                    {t.debit > 0 ? `₹${t.debit.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3 text-right font-medium text-emerald-600 whitespace-nowrap">
                    {t.credit > 0 ? `₹${t.credit.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {t.runningBalance !== undefined ? `₹${t.runningBalance.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {t.isInternalTransfer ? (
                      <span className="rounded bg-sky-100 dark:bg-sky-950 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                        Transfer
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {t.reconciliationStatus || 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900 text-xs">
          <span className="text-slate-500">
            Showing {(page - 1) * 25 + 1} - {Math.min(page * 25, totalCount)} of {totalCount} records
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Previous
            </button>
            <span className="text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Manual Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTx} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Account *</label>
                <select
                  required
                  value={newTx.bankAccountId}
                  onChange={(e) => setNewTx({ ...newTx, bankAccountId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.bankName} ({a.maskedAccountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newTx.transactionDate}
                    onChange={(e) => setNewTx({ ...newTx, transactionDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Type *</label>
                  <select
                    value={newTx.transactionType}
                    onChange={(e) => setNewTx({ ...newTx, transactionType: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="debit">Debit (Expense)</option>
                    <option value="credit">Credit (Income)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={newTx.description}
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                  placeholder="e.g. Swiggy Food Order, Client Payment"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newTx.categoryId}
                    onChange={(e) => setNewTx({ ...newTx, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

