import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Info,
  DollarSign,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';

export const ForecastPage = () => {
  const [days, setDays] = useState(90);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/intelligence/forecast?days=${days}`);
      setData(res.data.forecast);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [days]);

  const {
    startingBalance = 0,
    totalProjectedInflow = 0,
    totalProjectedOutflow = 0,
    netProjectedDelta = 0,
    endProjectedBalance = 0,
    timeline = [],
    scheduledInflowsCount = 0,
    scheduledOutflowsCount = 0,
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Cash Flow Forecasting & Liquidity Projection
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic liquidity forecasts based on confirmed recurring commitments, invoice receivables, and historical baseline
          </p>
        </div>

        {/* Forecast Horizon Tabs */}
        <div className="flex items-center gap-2">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                days === d
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {d} Days
            </button>
          ))}
          <button
            onClick={fetchForecast}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Distinction Alert Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
        <Info className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
        <div>
          <span className="font-semibold">Deterministic Forecast Principle:</span> Forecast values model expected cash trajectories using confirmed recurring payments and pending receivables. They are clearly distinguished from audited real-time bank ledger balances.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Liquid Cash</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            ₹{startingBalance.toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Starting baseline across accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled Inflows ({days}d)</span>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">
            +₹{totalProjectedInflow.toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">From {scheduledInflowsCount} receivable invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled Outflows ({days}d)</span>
          <h2 className="text-2xl font-bold tracking-tight text-rose-600 mt-1">
            -₹{totalProjectedOutflow.toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">From {scheduledOutflowsCount} commitments & EMIs</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Projected Ending Balance</span>
          <h2 className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{endProjectedBalance.toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Net delta: {netProjectedDelta >= 0 ? '+' : ''}₹{netProjectedDelta.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Forecast Trajectory Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Projected Liquidity Trajectory ({days} Days)
            </h3>
            <p className="text-[11px] text-slate-400">
              Comparing Expected Baseline against Conservative (70% collection, +10% expenses) and Best-Case scenarios
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-brand-600">
              <span className="h-2 w-2 rounded-full bg-brand-600" /> Expected
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Conservative
            </span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Best-Case
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="bestCaseBalance"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                name="Best-Case"
              />
              <Area
                type="monotone"
                dataKey="expectedBalance"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpected)"
                name="Expected"
              />
              <Area
                type="monotone"
                dataKey="conservativeBalance"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorConservative)"
                name="Conservative"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assumptions & Methodology Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-600" />
          Model Assumptions & Scenario Parameters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Expected Baseline</span>
            <p className="text-slate-500 mt-1">
              Assumes 100% timely receipt of due customer invoices and exact fulfillment of active recurring contracts and scheduled loan EMIs.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Conservative Stress Test</span>
            <p className="text-slate-500 mt-1">
              Applies a 30% haircut on invoice collections (assuming deferred client payments) and adds a 10% inflation buffer to all overhead and operational outflows.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Best-Case Trajectory</span>
            <p className="text-slate-500 mt-1">
              Assumes accelerated invoice settlements (+5% bonus collections) combined with active 5% cost trimming across non-essential recurring vendor licenses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
