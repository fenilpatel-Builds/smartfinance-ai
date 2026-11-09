import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Zap,
  Calendar,
  AlertCircle,
  TrendingDown,
  Trash2,
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

export const SubscriptionsPage = () => {
  const [recurring, setRecurring] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    merchant: '',
    description: '',
    expectedAmount: '',
    frequency: 'Monthly',
    categoryName: 'Office Supplies & Software',
    nextExpectedDate: '',
  });

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recurring');
      setRecurring(res.data.recurring || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to load recurring items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleRunDetection = async () => {
    try {
      setDetecting(true);
      const res = await api.post('/recurring/detect');
      alert(res.data.message || 'Detection finished!');
      fetchRecurring();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run detection');
    } finally {
      setDetecting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recurring', formData);
      setShowAddModal(false);
      setFormData({
        merchant: '',
        description: '',
        expectedAmount: '',
        frequency: 'Monthly',
        categoryName: 'Office Supplies & Software',
        nextExpectedDate: '',
      });
      fetchRecurring();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save recurring item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring subscription rule?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      fetchRecurring();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'Active' ? 'Paused' : 'Active';
    try {
      await api.put(`/recurring/${item._id}`, { status: newStatus });
      fetchRecurring();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Subscription & Recurring Intelligence
            </h1>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              Auto-Audited
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Automatically detect SaaS subscriptions, vendor contracts, and recurring utility outflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunDetection}
            disabled={detecting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <Sparkles className={`h-4 w-4 text-brand-600 ${detecting ? 'animate-spin' : ''}`} />
            <span>{detecting ? 'Analyzing Statements...' : 'Scan Transactions'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Monthly Burn Rate</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{(metrics.projectedMonthlyCommitment || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Scheduled monthly recurring outflow</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Annual Run-Rate</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{(metrics.projectedAnnualCommitment || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">12-month projected liability</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Services</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.activeItems || 0} Subscriptions
          </div>
          <div className="mt-1 text-xs text-slate-500">Currently active and uncancelled</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Paused Subscriptions</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.pausedItems || 0} Paused
          </div>
          <div className="mt-1 text-xs text-slate-500">Excluded from active forecast</div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Monitored Recurring Outflows</h2>
          <span className="text-xs text-slate-500">{recurring.length} items logged</span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : recurring.length === 0 ? (
          <div className="p-12 text-center">
            <Repeat className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No Recurring Items Detected</h3>
            <p className="mt-1 text-sm text-slate-500">
              Click "Scan Transactions" above to automatically discover repeating bills from your statements.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Service / Merchant</th>
                  <th className="px-6 py-3.5 font-semibold">Category</th>
                  <th className="px-6 py-3.5 font-semibold">Frequency</th>
                  <th className="px-6 py-3.5 font-semibold">Expected Amount</th>
                  <th className="px-6 py-3.5 font-semibold">Next Charge Date</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recurring.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                          {item.merchant.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{item.merchant}</div>
                          {item.description && (
                            <div className="text-xs text-slate-400">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.categoryName || 'Subscription'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        {item.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      ₹{(item.expectedAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {item.nextExpectedDate ? new Date(item.nextExpectedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-colors ${
                          item.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Recurring Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Subscription / Recurring Outflow</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Merchant / Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud, Figma Organization, Google Workspace"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description / Plan</label>
                <input
                  type="text"
                  placeholder="e.g. 5 Team Licenses, Production Database Server"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Expected Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="12500"
                    value={formData.expectedAmount}
                    onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Billing Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Next Due Date</label>
                  <input
                    type="date"
                    value={formData.nextExpectedDate}
                    onChange={(e) => setFormData({ ...formData, nextExpectedDate: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <input
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
