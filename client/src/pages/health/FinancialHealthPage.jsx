import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Info,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';

export const FinancialHealthPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealthScore = async () => {
    try {
      setLoading(true);
      const res = await api.get('/intelligence/health-score');
      setData(res.data.healthScore);
    } catch (err) {
      console.error('Failed to load financial health score:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScore();
  }, []);

  const {
    totalScore = 0,
    grade = 'Calculating...',
    pillars = {},
    recommendations = [],
  } = data || {};

  const {
    savingsAndCashFlow = {},
    solvencyAndDebt = {},
    cashRunway = {},
    hygieneAndGovernance = {},
  } = pillars;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Financial Health & Solvency Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent deterministic financial health scoring across 4 institutional solvency and liquidity pillars
          </p>
        </div>

        <button
          onClick={fetchHealthScore}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-calculate
        </button>
      </div>

      {/* Main Score Hero Card */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950/80 dark:text-brand-300">
              Institutional Health Grade
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl mt-1">
              {grade}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              Score derived from 90-day cash flow retention, debt coverage, liquid cash runway, and transaction audit hygiene.
            </p>
          </div>

          {/* Circular Score Badge */}
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/20">
            <div className="text-center">
              <span className="text-4xl font-extrabold">{totalScore}</span>
              <span className="block text-[11px] font-medium opacity-80 uppercase tracking-widest">/ 100 PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Health Pillars Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pillar 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              {savingsAndCashFlow.label || 'Savings & Net Flow'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {savingsAndCashFlow.score || 0} / 25
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${((savingsAndCashFlow.score || 0) / 25) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Net flow rate: <strong>{savingsAndCashFlow.netFlowRate || 0}%</strong> of incoming revenues retained.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-indigo-500" />
              {solvencyAndDebt.label || 'Solvency & Debt'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {solvencyAndDebt.score || 0} / 25
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${((solvencyAndDebt.score || 0) / 25) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Debt ratio: <strong>{solvencyAndDebt.debtRatio || 0}%</strong> of liquid balance & quarterly income.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand-500" />
              {cashRunway.label || 'Cash Runway'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {cashRunway.score || 0} / 25
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${((cashRunway.score || 0) / 25) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Operating runway: <strong>{cashRunway.runwayMonths || 0} months</strong> at current burn rate.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              {hygieneAndGovernance.label || 'Governance Hygiene'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {hygieneAndGovernance.score || 0} / 25
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${((hygieneAndGovernance.score || 0) / 25) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Anomalies flagged: <strong>{hygieneAndGovernance.pendingAnomalies || 0} critical</strong> pending review.
          </p>
        </div>
      </div>

      {/* Actionable Recommendations Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Prioritized Solvency Recommendations
        </h3>
        <div className="space-y-2.5">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
