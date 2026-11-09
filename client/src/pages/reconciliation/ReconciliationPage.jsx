import React, { useState, useEffect } from 'react';
import {
  CheckCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

export const ReconciliationPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRec, setActiveRec] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, recRes] = await Promise.all([
        api.get('/bank-accounts'),
        api.get('/reconciliation'),
      ]);
      setAccounts(accRes.data.accounts || []);
      if (accRes.data.accounts?.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accRes.data.accounts[0]._id);
      }
      setReconciliations(recRes.data.reconciliations || []);
    } catch (err) {
      console.error('Failed to load reconciliations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunReconciliation = async () => {
    if (!selectedAccountId) return;
    try {
      const res = await api.post('/reconciliation', {
        bankAccountId: selectedAccountId,
      });
      setActiveRec(res.data.reconciliation);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Reconciliation failed');
    }
  };

  const handleCompleteReconciliation = async (recId) => {
    try {
      await api.post(`/reconciliation/${recId}/complete`, {
        notes: 'Verified and signed off by workspace accountant.',
      });
      alert('Reconciliation successfully finalized and marked as Reconciled!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Completion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Bank Statement Reconciliation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify transaction sequences and reconcile statement balances: Closing = Opening + Credits - Debits
          </p>
        </div>
      </div>

      {/* Account Selector & Trigger Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-md w-full">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Bank Account for Reconciliation
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.bankName} ({a.maskedAccountNumber}) — Calculated: ₹{a.currentCalculatedBalance?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunReconciliation}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" /> Run Balance Verification
          </button>
        </div>
      </div>

      {/* Active Reconciliation Card */}
      {activeRec && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/20 p-5 dark:border-brand-900 dark:bg-brand-950/20 shadow-xs">
          <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-900 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">
                Reconciliation Result
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Balance Equation Verification
              </h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                activeRec.status === 'Matched' || activeRec.status === 'Reconciled'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeRec.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-800">
              <span className="text-slate-400">Opening Balance</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                ₹{activeRec.openingBalance?.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-800">
              <span className="text-slate-400">Net Movement (+Cr / -Dr)</span>
              <p className="font-bold text-emerald-600 mt-1">
                +₹{activeRec.totalCredits?.toLocaleString()}{' '}
                <span className="text-rose-600 font-normal">(-₹{activeRec.totalDebits?.toLocaleString()})</span>
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-800">
              <span className="text-slate-400">Expected Closing</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                ₹{activeRec.expectedBalance?.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-800">
              <span className="text-slate-400">Difference</span>
              <p className={`font-bold mt-1 ${activeRec.difference === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                ₹{activeRec.difference?.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleCompleteReconciliation(activeRec._id)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" /> Sign-off & Mark as Reconciled
            </button>
          </div>
        </div>
      )}

      {/* Reconciliation History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Reconciliation Records</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
              <tr>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Bank Account</th>
                <th className="pb-3 font-semibold text-right">Expected Balance</th>
                <th className="pb-3 font-semibold text-right">Statement Balance</th>
                <th className="pb-3 font-semibold text-right">Difference</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reconciliations.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {r.bankAccountId?.bankName} ({r.bankAccountId?.maskedAccountNumber})
                  </td>
                  <td className="py-3 text-right font-mono">₹{r.expectedBalance?.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono">₹{r.statementBalance?.toLocaleString()}</td>
                  <td className={`py-3 text-right font-mono font-bold ${r.difference === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ₹{r.difference?.toLocaleString()}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === 'Reconciled' || r.status === 'Matched'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {r.status !== 'Reconciled' && (
                      <button
                        onClick={() => handleCompleteReconciliation(r._id)}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Sign-off
                      </button>
                    )}
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

