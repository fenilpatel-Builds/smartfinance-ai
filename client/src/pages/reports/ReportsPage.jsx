import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('income_expense'); // 'income_expense' | 'cash_flow'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'income_expense') {
        const res = await api.get('/reports/income-expense');
        setData(res.data);
      } else {
        const res = await api.get('/reports/cash-flow');
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Financial Statements & P&L Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic income, expense, and cash flow performance reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setReportType('income_expense')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            reportType === 'income_expense'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Income & Expense Statement (P&L)
        </button>
        <button
          onClick={() => setReportType('cash_flow')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            reportType === 'cash_flow'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Cash Flow Statement
        </button>
      </div>

      {/* Report 1: Income & Expense (P&L) */}
      {reportType === 'income_expense' && data && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500">Total Operating Revenue</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₹{data.totalIncome?.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500">Total Operating Expenses</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">₹{data.totalExpenses?.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500">Net Profit / (Loss)</span>
              <p className={`text-2xl font-bold mt-1 ${data.netProfitOrLoss >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                {data.netProfitOrLoss >= 0 ? '+' : ''}₹{data.netProfitOrLoss?.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Streams */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-emerald-600 mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                Operating Revenue Sources
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {data.incomeCategories?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.category}</span>
                    <span className="font-mono font-bold text-emerald-600">+₹{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Streams */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-rose-600 mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                Operating Expenses
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {data.expenseCategories?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.category}</span>
                    <span className="font-mono font-bold text-rose-600">-₹{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Cash Flow */}
      {reportType === 'cash_flow' && data && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Monthly Cash Flow Progression
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Period</th>
                  <th className="pb-3 font-semibold text-right">Cash Inflow</th>
                  <th className="pb-3 font-semibold text-right">Cash Outflow</th>
                  <th className="pb-3 font-semibold text-right">Net Period Movement</th>
                  <th className="pb-3 font-semibold text-right">Cumulative Net Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.cashFlow?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{row.period}</td>
                    <td className="py-3 text-right font-mono text-emerald-600">+₹{row.inflow.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-rose-600">-₹{row.outflow.toLocaleString()}</td>
                    <td className={`py-3 text-right font-mono font-bold ${row.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.netCashFlow >= 0 ? '+' : ''}₹{row.netCashFlow.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{row.cumulativeCash.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

