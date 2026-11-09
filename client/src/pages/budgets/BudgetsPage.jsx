import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  X,
  Target,
} from 'lucide-react';
import api from '../../services/api';

export const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    budgetAmount: '',
    period: 'monthly',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, cRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/categories'),
      ]);
      setBudgets(bRes.data.budgets || []);
      const expenseCats = (cRes.data.categories || []).filter((c) => c.type === 'expense');
      setCategories(expenseCats);
      if (expenseCats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: expenseCats[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets', formData);
      setShowModal(false);
      setFormData({ categoryId: categories[0]?._id || '', budgetAmount: '', period: 'monthly' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Delete this budget?')) {
      try {
        await api.delete(`/budgets/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Budgets & Expense Controls
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set category spending thresholds, monitor month-to-date consumption, and prevent budget overruns
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          <Plus className="h-4 w-4" /> Add Category Budget
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b) => {
          const isOver = b.spent > b.budgetAmount;
          return (
            <div
              key={b._id}
              className={`rounded-2xl border bg-white p-5 shadow-xs dark:bg-slate-900 ${
                isOver ? 'border-rose-300 dark:border-rose-900' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: b.categoryId?.color || '#6366f1' }}
                    />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {b.categoryId?.name || 'Category'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                    {b.period} Budget
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteBudget(b._id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Amount stats */}
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Spent</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    ₹{(b.spent || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget Limit</span>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    ₹{(b.budgetAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                  <span className={isOver ? 'text-rose-600' : 'text-slate-500'}>
                    {b.percentage}% utilized
                  </span>
                  <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                    {isOver ? `Over by ₹${Math.abs(b.remaining).toLocaleString()}` : `₹${b.remaining.toLocaleString()} left`}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver
                        ? 'bg-rose-500'
                        : b.percentage > 80
                        ? 'bg-amber-500'
                        : 'bg-brand-600'
                    }`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Add Monthly Budget</h3>
            <form onSubmit={handleCreateBudget} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Budget (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.budgetAmount}
                  onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                  placeholder="e.g. 25000"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-1.5 font-semibold text-white hover:bg-brand-500"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

