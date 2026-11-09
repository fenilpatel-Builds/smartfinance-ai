import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  Receipt,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  Sparkles,
  UploadCloud,
  ChevronRight,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const { summary, bankBreakdown, categoryExpenses, monthlyTrends, recentTransactions, recentStatements, latestInsight } = data || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Financial Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time multi-bank statement consolidation and deterministic cash analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/upload"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Statement
          </Link>
        </div>
      </div>

      {/* AI Financial Insights Banner */}
      {latestInsight && (
        <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50/80 via-indigo-50/50 to-white p-5 shadow-sm dark:border-brand-900/50 dark:from-brand-950/40 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  AI Financial Analysis
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Deterministic + Pattern Assisted</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{latestInsight.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                {latestInsight.description}
              </p>
            </div>
            <Link
              to="/ai"
              className="shrink-0 flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-xs border border-brand-200 hover:bg-brand-50 dark:bg-slate-800 dark:border-slate-700 dark:text-brand-300"
            >
              Ask Assistant
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Combined Bank Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Combined Bank Balance</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ₹{(summary?.combinedBankBalance || 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Across {summary?.totalBankAccounts || 0} active bank accounts</p>
          </div>
        </div>

        {/* Total Income */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Income (Inflow)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{(summary?.totalIncome || 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Net of inter-account transfers</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Expenses (Outflow)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              ₹{(summary?.totalExpenses || 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Direct categorized expenditures</p>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Cash Flow</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              (summary?.netCashFlow || 0) >= 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60' : 'bg-amber-50 text-amber-600'
            }`}>
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className={`text-2xl font-bold tracking-tight ${
              (summary?.netCashFlow || 0) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600'
            }`}>
              {(summary?.netCashFlow || 0) >= 0 ? '+' : ''}₹{(summary?.netCashFlow || 0).toLocaleString()}
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
              <span>{summary?.totalTransactions || 0} Transactions</span>
              {summary?.uncategorizedCount > 0 && (
                <span className="text-amber-600 font-semibold">{summary.uncategorizedCount} Uncategorized</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Monthly Income vs Expenses (4 cols) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Cash Flow</h3>
              <p className="text-[11px] text-slate-500">Income vs Expenses performance</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Income</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Expense</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Expenses Donut (3 cols) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Spending Categories</h3>
              <p className="text-[11px] text-slate-500">Expense distribution</p>
            </div>
            <Link to="/categories" className="text-xs font-semibold text-brand-600 hover:underline">
              Manage Rules
            </Link>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenses || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {(categoryExpenses || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {(categoryExpenses || []).slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">₹{c.amount.toLocaleString()}</span>
                  <span className="text-[11px] text-slate-400">({c.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Bank Breakdown Row */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bank Accounts Overview</h3>
            <p className="text-[11px] text-slate-500">Live consolidated calculated balances</p>
          </div>
          <Link to="/banks" className="text-xs font-semibold text-brand-600 hover:underline">
            View All Accounts →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(bankBreakdown || []).map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-slate-700">
                  <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</h4>
                  <p className="text-[11px] text-slate-500">{acc.maskedAccountNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  ₹{acc.balance.toLocaleString()}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column: Recent Transactions & Recent Uploaded Statements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Recent Transactions (4 cols) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-[11px] text-slate-500">Latest imported statement records</p>
            </div>
            <Link to="/transactions" className="text-xs font-semibold text-brand-600 hover:underline">
              View All ({summary?.totalTransactions || 0})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(recentTransactions || []).map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-500">
                      {new Date(t.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {t.merchant || t.description}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{t.description}</p>
                    </td>
                    <td className="py-2.5">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {t.categoryName || 'Uncategorized'}
                      </span>
                    </td>
                    <td className={`py-2.5 text-right font-bold ${t.transactionType === 'credit' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                      {t.transactionType === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Uploaded Statements (3 cols) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Uploaded Statements</h3>
              <p className="text-[11px] text-slate-500">Document extraction history</p>
            </div>
            <Link to="/upload" className="text-xs font-semibold text-brand-600 hover:underline">
              Upload New
            </Link>
          </div>

          <div className="space-y-3">
            {(recentStatements || []).map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{s.originalFileName}</p>
                    <p className="text-[10px] text-slate-400">
                      {s.bankAccountId?.bankName || 'Bank'} • {s.importedTransactionCount || 0} txs imported
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  {s.processingStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

