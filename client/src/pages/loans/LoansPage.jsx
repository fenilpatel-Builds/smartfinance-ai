import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Landmark,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import api from '../../services/api';

export const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [payBankAccountId, setPayBankAccountId] = useState('');

  const [formData, setFormData] = useState({
    loanName: '',
    lenderName: '',
    loanType: 'Business Loan',
    principalAmount: '',
    annualInterestRate: '',
    tenureMonths: '36',
    startDate: '',
    accountNumber: '',
    notes: '',
  });

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/loans');
      const list = res.data.loans || [];
      setLoans(list);
      setMetrics(res.data.metrics || {});
      if (list.length > 0 && !selectedLoan) {
        setSelectedLoan(list[0]);
      } else if (selectedLoan) {
        const updated = list.find((l) => l._id === selectedLoan._id);
        setSelectedLoan(updated || list[0] || null);
      }
    } catch (err) {
      console.error('Failed to load loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await api.get('/bank-accounts');
      setBankAccounts(res.data.accounts || []);
      if (res.data.accounts && res.data.accounts.length > 0) {
        setPayBankAccountId(res.data.accounts[0]._id);
      }
    } catch (e) {
      console.error('Failed to fetch bank accounts:', e);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchBankAccounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans', formData);
      setShowAddModal(false);
      setFormData({
        loanName: '',
        lenderName: '',
        loanType: 'Business Loan',
        principalAmount: '',
        annualInterestRate: '',
        tenureMonths: '36',
        startDate: '',
        accountNumber: '',
        notes: '',
      });
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create loan');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      await api.post(`/loans/${selectedLoan._id}/payment`, {
        paymentAmount: parseFloat(payAmount) || selectedLoan.emiAmount,
        bankAccountId: payBankAccountId || undefined,
      });
      setShowPayModal(false);
      setPayAmount('');
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record loan payment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this loan liability record and schedule?')) return;
    try {
      await api.delete(`/loans/${id}`);
      setSelectedLoan(null);
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete loan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Loans & Amortization Management
            </h1>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              Liabilities & Debt
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track business loans, calculate monthly EMIs, and inspect complete amortization payment schedules.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Loan Facility</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Borrowed</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{(metrics.totalPrincipal || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">{metrics.totalLoans || 0} loan contracts</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Remaining Debt</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            ₹{(metrics.totalRemainingDebt || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Outstanding principal liability</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Monthly Debt Service</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{(metrics.totalMonthlyEmi || 0).toLocaleString('en-IN')}/mo
          </div>
          <div className="mt-1 text-xs text-slate-500">Total active monthly EMI burden</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Debt Paid Off</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{(metrics.totalPaidOff || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Principal successfully amortized</div>
        </div>
      </div>

      {/* Main Loan Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Landmark className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No Loans Registered</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add business loans or lines of credit to generate automatic amortization schedules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loans Selector List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Loan Facilities</h2>
            {loans.map((loan) => {
              const isSelected = selectedLoan?._id === loan._id;
              const progressPct = loan.principalAmount > 0
                ? Math.min(100, Math.round(((loan.principalAmount - loan.remainingPrincipal) / loan.principalAmount) * 100))
                : 0;

              return (
                <div
                  key={loan._id}
                  onClick={() => setSelectedLoan(loan)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/20 shadow-sm dark:bg-brand-950/20 dark:border-brand-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {loan.loanType}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {loan.loanName || loan.lenderName}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">{loan.lenderName}</div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        loan.status === 'Paid Off'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Monthly EMI</span>
                      <div className="font-bold text-slate-900 dark:text-white">
                        ₹{(loan.emiAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Interest Rate</span>
                      <div className="font-bold text-slate-900 dark:text-white">{loan.annualInterestRate}% p.a.</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Principal Repaid</span>
                      <span className="font-semibold">{progressPct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-brand-600 rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Loan Amortization Schedule */}
          {selectedLoan && (
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedLoan.loanName || selectedLoan.lenderName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedLoan.tenureMonths} Months tenure • Started {new Date(selectedLoan.startDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedLoan.status === 'Active' && (
                      <button
                        onClick={() => {
                          setPayAmount(String(selectedLoan.emiAmount));
                          setShowPayModal(true);
                        }}
                        className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                      >
                        Record EMI Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedLoan._id)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                      title="Delete Loan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <span className="text-slate-400">Total Borrowed</span>
                    <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      ₹{(selectedLoan.principalAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <span className="text-slate-400">Remaining Balance</span>
                    <div className="font-bold text-sm text-red-600 dark:text-red-400 mt-0.5">
                      ₹{(selectedLoan.remainingPrincipal || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <span className="text-slate-400">Monthly EMI</span>
                    <div className="font-bold text-sm text-brand-600 dark:text-brand-400 mt-0.5">
                      ₹{(selectedLoan.emiAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <span className="text-slate-400">Total Interest</span>
                    <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      ₹{(selectedLoan.totalInterestPayable || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amortization Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Monthly Amortization Schedule
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedLoan.amortizationSchedule?.length || 0} installments
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                    <thead className="sticky top-0 bg-slate-50 uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">Due Date</th>
                        <th className="px-4 py-3 font-semibold">Installment EMI</th>
                        <th className="px-4 py-3 font-semibold">Principal</th>
                        <th className="px-4 py-3 font-semibold">Interest</th>
                        <th className="px-4 py-3 font-semibold">Balance</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedLoan.amortizationSchedule?.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                            row.isPaid ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          <td className="px-4 py-2.5 font-bold">{row.installmentNumber || row.monthNumber}</td>
                          <td className="px-4 py-2.5">
                            {row.dueDate || row.paymentDate ? new Date(row.dueDate || row.paymentDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                            ₹{(row.emi || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">
                            ₹{(row.principal || row.principalPaid || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400">
                            ₹{(row.interest || row.interestPaid || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            ₹{(row.remainingBalance || row.remainingPrincipal || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                row.isPaid
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {row.isPaid ? 'Paid' : 'Due'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Loan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Loan / Financing Facility</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Loan Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Capital Term Loan, Office Fitout Financing"
                  value={formData.loanName}
                  onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Lender / Institution</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    value={formData.lenderName}
                    onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Loan Type</label>
                  <select
                    value={formData.loanType}
                    onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Business Loan">Business Loan</option>
                    <option value="Term Loan">Term Loan</option>
                    <option value="Working Capital Loan">Working Capital Loan</option>
                    <option value="Vehicle Loan">Vehicle Loan</option>
                    <option value="Credit Line">Credit Line</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Principal (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="500000"
                    value={formData.principalAmount}
                    onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Interest % p.a.</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="10.5"
                    value={formData.annualInterestRate}
                    onChange={(e) => setFormData({ ...formData, annualInterestRate: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Tenure (Mos)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="36"
                    value={formData.tenureMonths}
                    onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                  Compute & Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Installment */}
      {showPayModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Record EMI for {selectedLoan.loanName || selectedLoan.lenderName}
              </h2>
              <button
                onClick={() => setShowPayModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pay From Bank Account
                </label>
                <select
                  value={payBankAccountId}
                  onChange={(e) => setPayBankAccountId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Do not record debit transaction</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.bankName} - {acc.accountNickname || acc.maskedAccountNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
