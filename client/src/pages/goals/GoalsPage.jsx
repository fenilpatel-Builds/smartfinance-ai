import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  ArrowUpRight,
  Trash2,
  X,
  Coins,
} from 'lucide-react';
import api from '../../services/api';

export const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    monthlyContributionTarget: '',
    category: 'Capital Expansion',
    notes: '',
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goals');
      setGoals(res.data.goals || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goals', formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        monthlyContributionTarget: '',
        category: 'Capital Expansion',
        notes: '',
      });
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create goal');
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!showContributeModal || !contributeAmount) return;
    try {
      await api.post(`/goals/${showContributeModal._id}/contribute`, {
        amount: parseFloat(contributeAmount),
      });
      setShowContributeModal(null);
      setContributeAmount('');
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record contribution');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this financial goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Goals & Savings Planner
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Wealth Strategy
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set deterministic capital targets, track savings velocity, and project target dates.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Financial Goal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Goal Target</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{(metrics.totalTarget || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">{metrics.totalGoals || 0} active & planned goals</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Saved to Date</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{(metrics.totalSaved || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Funded across operating reserves</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Overall Progress</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {metrics.overallProgress || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-500">Target capital funded</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Goals</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.activeGoals || 0} In Progress
          </div>
          <div className="mt-1 text-xs text-slate-500">{metrics.completedGoals || 0} achieved successfully</div>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Target className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No Financial Goals Yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create your first corporate or personal financial goal to start tracking progress.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            <span>Create Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const isCompleted = goal.status === 'Completed' || goal.progressPercent >= 100;
            return (
              <div
                key={goal._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {goal.category || 'General'}
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                        {goal.name || goal.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleDelete(goal._id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                      title="Delete Goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {goal.notes && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{goal.notes}</p>
                  )}

                  {/* Progress Bar & Amount */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">Funded</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {goal.progressPercent}%
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted ? 'bg-emerald-500' : 'bg-brand-600'
                        }`}
                        style={{ width: `${Math.min(100, goal.progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(goal.currentAmount || goal.currentSavedAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Target: ₹{(goal.targetAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Projections & Schedule */}
                  <div className="mt-5 rounded-xl bg-slate-50 p-3.5 space-y-2 dark:bg-slate-800/50 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Target Date
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Flexible'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-slate-400" />
                        Required Monthly
                      </span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400">
                        ₹{(goal.requiredMonthlySavings || 0).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowContributeModal(goal);
                      setContributeAmount('');
                    }}
                    disabled={isCompleted}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 cursor-default dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Goal Completed!</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>Add Contribution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Goal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Financial Goal</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Tax Reserve, Cloud Infrastructure Fund"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="300000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Saved Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Capital Expansion">Capital Expansion</option>
                    <option value="Tax Planning">Tax Planning</option>
                    <option value="Emergency Reserve">Emergency Reserve</option>
                    <option value="Equipment Purchase">Equipment Purchase</option>
                    <option value="Debt Paydown">Debt Paydown</option>
                    <option value="General Savings">General Savings</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Notes / Strategic Purpose</label>
                <textarea
                  rows="2"
                  placeholder="Optional context about why this fund is being accrued..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Contribution */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Contribute to {showContributeModal.name || showContributeModal.title}
              </h2>
              <button
                onClick={() => setShowContributeModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contribution Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="25000"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/50">
                Current saved: ₹{(showContributeModal.currentAmount || 0).toLocaleString('en-IN')} of ₹{(showContributeModal.targetAmount || 0).toLocaleString('en-IN')}.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  Record Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
