import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import api from '../../services/api';

export const ConsolidationPage = () => {
  const [bankSummary, setBankSummary] = useState(null);
  const [internalTransfers, setInternalTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, txRes] = await Promise.all([
        api.get('/reports/bank-summary'),
        api.get('/transactions?limit=100'),
      ]);
      setBankSummary(sumRes.data);
      const transfers = (txRes.data.transactions || []).filter((t) => t.isInternalTransfer);
      setInternalTransfers(transfers);
    } catch (err) {
      console.error('Failed to load consolidation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { bankAccounts, totals } = bankSummary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Multi-Bank Consolidation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidated multi-account liquidity and intelligent self-transfer matching to eliminate double counting
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-sync
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Total Consolidated Balance</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            ₹{(totals?.totalClosingBalance || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Across {bankAccounts?.length || 0} active accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Consolidated Opening Position</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            ₹{(totals?.totalOpening || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Initial period baseline</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Total Credits (Deposits)</span>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-600 mt-2">
            +₹{(totals?.totalCredits || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">All account inflows</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Total Debits (Withdrawals)</span>
          <h2 className="text-2xl font-bold tracking-tight text-rose-600 mt-2">
            -₹{(totals?.totalDebits || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">All account outflows</p>
        </div>
      </div>

      {/* Account-by-Account Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Bank-wise Position Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
              <tr>
                <th className="pb-3 font-semibold">Bank Name</th>
                <th className="pb-3 font-semibold">Masked A/C</th>
                <th className="pb-3 font-semibold text-right">Opening</th>
                <th className="pb-3 font-semibold text-right">Total Credits</th>
                <th className="pb-3 font-semibold text-right">Total Debits</th>
                <th className="pb-3 font-semibold text-right">Net Movement</th>
                <th className="pb-3 font-semibold text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(bankAccounts || []).map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand-600" />
                    {acc.accountNickname || acc.bankName}
                  </td>
                  <td className="py-3 font-mono text-slate-500">{acc.maskedAccountNumber}</td>
                  <td className="py-3 text-right font-mono">₹{acc.openingBalance.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono text-emerald-600">+₹{acc.totalCredits.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono text-rose-600">-₹{acc.totalDebits.toLocaleString()}</td>
                  <td className={`py-3 text-right font-mono font-bold ${acc.netMovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {acc.netMovement >= 0 ? '+' : ''}₹{acc.netMovement.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{acc.closingBalance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Transfers Matching Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Matched Inter-Account Transfers ({internalTransfers.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Transfers detected between your own bank accounts (excluded from business revenue/expense to prevent inflation)
            </p>
          </div>
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            Double-Counting Protection Active
          </span>
        </div>

        {internalTransfers.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No internal transfers currently detected.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {internalTransfers.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.transactionDate).toLocaleDateString()} • {tx.bankAccountId?.bankName || 'Bank'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">₹{tx.amount.toLocaleString()}</p>
                  <span className="text-[10px] text-sky-600 font-semibold">Matched Internal Transfer</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

