import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Scale,
  Calendar,
  AlertCircle,
  TrendingDown,
  Building2,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../../services/api';

export const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScheduleLoan, setSelectedScheduleLoan] = useState(null);

  const [formData, setFormData] = useState({
    loanName: '',
    lenderName: '',
    principalAmount: '',
    annualInterestRate: '10.5',
    tenureMonths: '36',
    startDate: new Date().toISOString().slice(0, 10),
  });

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loans');
      setLoans(res.data.loans || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to load loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans', formData);
      setShowAddModal(false);
      setFormData({
        loanName: '',
        lenderName: '',
        principalAmount: '',
        annualInterestRate: '10.5',
        tenureMonths: '36',
        startDate: new Date().toISOString().slice(0, 10),
      });
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create loan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Loan & Liability Amortization Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track business loans, credit facilities, monthly EMI amortization schedules, and principal reduction
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Loan Facility
        </button>
      </div>

      {/* Distinction Alert */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
        <Scale className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div>
          <span className="font-semibold">Liability Separation:</span> Loan records track legal liability principal schedules and projected EMI commitments for cash flow forecasting. They are distinctly identified from liquid bank deposit accounts.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Borrowed Principal</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            ₹{(metrics.totalPrincipal || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Across {metrics.totalLoans || 0} loans</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Outstanding Debt</span>
          <h2 className="text-2xl font-bold tracking-tight text-rose-600 mt-1">
            ₹{(metrics.totalRemainingDebt || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Current unpaid principal</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly EMI Commitment</span>
          <h2 className="text-2xl font-bold tracking-tight text-amber-600 mt-1">
            ₹{(metrics.totalMonthlyEmi || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Cash outflow obligation</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Principal Paid Off</span>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">
            ₹{(metrics.totalPaidOff || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Amortized equity returned</p>
        </div>
      </div>

      {/* Loans Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loans.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            No active loan liabilities registered. Click "Add Loan Facility" to track a debt schedule.
          </div>
        ) : (
          loans.map((loan) => (
            <div
              key={loan._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    {loan.lenderName || 'Financial Institution'}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                    {loan.loanName}
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {loan.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40">
                  <span className="text-slate-400">Remaining Balance</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{loan.remainingPrincipal?.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40">
                  <span className="text-slate-400">Monthly EMI</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{loan.emiAmount?.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40">
                  <span className="text-slate-400">Annual Interest</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {loan.annualInterestRate}% p.a.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40">
                  <span className="text-slate-400">Tenure</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {loan.tenureMonths} Months
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[11px] text-slate-400">
                  Next Due: {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : '—'}
                </span>
                <button
                  onClick={() => setSelectedScheduleLoan(loan)}
                  className="font-semibold text-brand-600 hover:text-brand-500 cursor-pointer"
                >
                  View Amortization Schedule →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Register Loan Facility</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Loan Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Term Loan 2026"
                  value={formData.loanName}
                  onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lender / Bank *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank Ltd"
                  value={formData.lenderName}
                  onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Principal (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="1000000"
                    value={formData.principalAmount}
                    onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.annualInterestRate}
                    onChange={(e) => setFormData({ ...formData, annualInterestRate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    value={formData.tenureMonths}
                    onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 cursor-pointer"
                >
                  Calculate Schedule & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amortization Schedule Viewer Modal */}
      {selectedScheduleLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Amortization Schedule: {selectedScheduleLoan.loanName}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Principal: ₹{selectedScheduleLoan.principalAmount?.toLocaleString()} | Monthly EMI: ₹{selectedScheduleLoan.emiAmount?.toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedScheduleLoan(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">EMI</th>
                    <th className="py-2.5 px-3 text-right">Principal</th>
                    <th className="py-2.5 px-3 text-right">Interest</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedScheduleLoan.amortizationSchedule || []).map((ins) => (
                    <tr key={ins.installmentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono">{ins.installmentNumber}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{new Date(ins.dueDate).toLocaleDateString()}</td>
                      <td className="py-2 px-3 text-right font-semibold">₹{ins.emi?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-mono">₹{ins.principal?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-rose-500 font-mono">₹{ins.interest?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium">₹{ins.remainingBalance?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
