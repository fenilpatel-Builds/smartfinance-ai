import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import api from '../../services/api';

export const HealthScorePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealthScore = async () => {
    try {
      setLoading(true);
      const res = await api.get('/intelligence/health-score');
      setHealthData(res.data.healthScore || null);
    } catch (err) {
      console.error('Failed to load health score:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScore();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 65) return 'text-blue-500 stroke-blue-500';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-red-500 stroke-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Explainable Financial Health Score
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Audit Grade
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Transparent 100-point institutional solvency, cash runway, and fiscal governance assessment.
          </p>
        </div>

        <button
          onClick={fetchHealthScore}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
        >
          <Sparkles className="h-4 w-4 text-brand-600" />
          <span>Recalculate Score</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : !healthData ? (
        <div className="p-12 text-center text-sm text-slate-500">Failed to load health metrics.</div>
      ) : (
        <>
          {/* Main Score Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 items-center">
            {/* Circular Gauge */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative flex items-center justify-center">
                <svg className="h-44 w-44 -rotate-90 transform">
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-slate-100 dark:text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    strokeWidth="12"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (healthData.totalScore || 0)) / 100}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${getScoreColor(healthData.totalScore)}`}
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {healthData.totalScore}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">/ 100 PTS</span>
                </div>
              </div>

              <div className="mt-3">
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  Grade: {healthData.grade}
                </span>
              </div>
            </div>

            {/* Explanation & Summary */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Institutional Posture Analysis
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  This score is computed deterministically across 4 audited pillars without subjective model hallucinations. Every pillar contributes up to 25 points to form your enterprise fiscal stability rating.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
                  <span className="text-slate-400 font-medium">Cash Runway</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {healthData.pillars.cashRunway.runwayMonths} Months
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Liquid cash / Monthly burn</div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
                  <span className="text-slate-400 font-medium">Debt-to-Asset Ratio</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {healthData.pillars.solvencyAndDebt.debtRatio}x
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Total liabilities vs liquid reserves</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Savings & Net Margin
                    </h3>
                    <span className="text-xs text-slate-400">Cash Generation Velocity</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {healthData.pillars.savingsAndCashFlow.score}
                  </span>
                  <span className="text-xs text-slate-400"> / 25</span>
                </div>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(healthData.pillars.savingsAndCashFlow.score / 25) * 100}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Formula: Measures 90-day net operating cash flow relative to gross incoming cash flow. A net margin above 25% awards full 25 points.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      2. Solvency & Debt Ratio
                    </h3>
                    <span className="text-xs text-slate-400">Balance Sheet Leverage</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {healthData.pillars.solvencyAndDebt.score}
                  </span>
                  <span className="text-xs text-slate-400"> / 25</span>
                </div>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(healthData.pillars.solvencyAndDebt.score / 25) * 100}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Formula: Evaluates active loan liabilities (₹{healthData.pillars.solvencyAndDebt.totalDebt.toLocaleString()}) against total liquid and operating cash. A debt ratio below 0.2 awards maximum score.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      3. Liquidity & Cash Runway
                    </h3>
                    <span className="text-xs text-slate-400">Months of Self-Sustenance</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {healthData.pillars.cashRunway.score}
                  </span>
                  <span className="text-xs text-slate-400"> / 25</span>
                </div>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(healthData.pillars.cashRunway.score / 25) * 100}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Formula: Liquid bank account balance divided by average monthly operating burn. 6+ months of runway guarantees full 25 points.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      4. Anomaly & Budget Hygiene
                    </h3>
                    <span className="text-xs text-slate-400">Accounting Governance</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {healthData.pillars.hygieneAndGovernance.score}
                  </span>
                  <span className="text-xs text-slate-400"> / 25</span>
                </div>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(healthData.pillars.hygieneAndGovernance.score / 25) * 100}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Formula: Penalizes unreviewed critical anomalies and over-budget category thresholds. Zero pending anomalies secures full 25 points.
              </p>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              Strategic Financial Recommendations
            </h3>

            <div className="space-y-2.5">
              {healthData.recommendations?.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

