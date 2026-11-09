import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import api from '../../services/api';

export const CategoriesPage = () => {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'rules'
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', color: '#6366f1' });

  // Add Rule Modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    ruleName: '',
    field: 'description',
    operator: 'contains',
    value: '',
    targetCategoryId: '',
    priority: 10,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, ruleRes] = await Promise.all([
        api.get('/categories'),
        api.get('/categorization-rules'),
      ]);
      setCategories(catRes.data.categories || []);
      setRules(ruleRes.data.rules || []);
      if (catRes.data.categories?.length > 0 && !ruleForm.targetCategoryId) {
        setRuleForm((prev) => ({ ...prev, targetCategoryId: catRes.data.categories[0]._id }));
      }
    } catch (err) {
      console.error('Failed loading rules/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', catForm);
      setShowCategoryModal(false);
      setCatForm({ name: '', type: 'expense', color: '#6366f1' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Create category failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete category failed');
      }
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categorization-rules', {
        ruleName: ruleForm.ruleName,
        targetCategoryId: ruleForm.targetCategoryId,
        priority: ruleForm.priority,
        matchingConditions: [
          {
            field: ruleForm.field,
            operator: ruleForm.operator,
            value: ruleForm.value,
          },
        ],
      });
      setShowRuleModal(false);
      setRuleForm({
        ruleName: '',
        field: 'description',
        operator: 'contains',
        value: '',
        targetCategoryId: categories[0]?._id || '',
        priority: 10,
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Create rule failed');
    }
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm('Delete this categorization rule?')) {
      try {
        await api.delete(`/categorization-rules/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete rule failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Categories & Automation Rules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure transaction classification rules, merchant detection patterns, and accounting taxonomy
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'categories' ? (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
            >
              <Plus className="h-4 w-4" /> New Category
            </button>
          ) : (
            <button
              onClick={() => setShowRuleModal(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
            >
              <Plus className="h-4 w-4" /> New Automation Rule
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'categories'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Tags className="h-4 w-4" />
          <span>Accounting Categories ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'rules'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Automation Rules ({rules.length})</span>
        </button>
      </div>

      {/* Tab 1: Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c.color }} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h4>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    {c.type}
                  </span>
                </div>
              </div>
              {!c.isDefault && (
                <button
                  onClick={() => handleDeleteCategory(c._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Categorization Rules */}
      {activeTab === 'rules' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Rule Name</th>
                  <th className="pb-3 font-semibold">Conditions</th>
                  <th className="pb-3 font-semibold">Target Category</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rules.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{r.ruleName}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {r.matchingConditions?.map((c, i) => (
                        <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono dark:bg-slate-800">
                          {c.field} {c.operator} "{c.value}"
                        </span>
                      ))}
                    </td>
                    <td className="py-3 font-semibold text-brand-600 dark:text-brand-400">
                      {r.targetCategoryName || r.targetCategoryId?.name}
                    </td>
                    <td className="py-3 font-mono text-slate-500">{r.priority}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteRule(r._id)}
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
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Add Custom Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Software Subscriptions"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Type *</label>
                <select
                  value={catForm.type}
                  onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Color</label>
                <input
                  type="color"
                  value={catForm.color}
                  onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                  className="h-8 w-16 rounded border border-slate-200 p-0.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-1.5 font-semibold text-white hover:bg-brand-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Create Automation Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.ruleName}
                  onChange={(e) => setRuleForm({ ...ruleForm, ruleName: e.target.value })}
                  placeholder="e.g. Swiggy Orders to Food & Dining"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Field</label>
                  <select
                    value={ruleForm.field}
                    onChange={(e) => setRuleForm({ ...ruleForm, field: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="description">Description</option>
                    <option value="merchant">Merchant</option>
                    <option value="referenceNumber">Reference Number</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Operator</label>
                  <select
                    value={ruleForm.operator}
                    onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="startsWith">Starts With</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Match Keyword / Text *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.value}
                  onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })}
                  placeholder="e.g. swiggy, zomato, aws"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign to Category *</label>
                <select
                  required
                  value={ruleForm.targetCategoryId}
                  onChange={(e) => setRuleForm({ ...ruleForm, targetCategoryId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-1.5 font-semibold text-white hover:bg-brand-500"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

