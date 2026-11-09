import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../services/api';

export const ForecastPage = () => {
  const [days, setDays] = useState(60);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Currency Converter State
  const [convertAmount, setConvertAmount] = useState('1000');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('INR');
  const [conversionResult, setConversionResult] = useState(null);
  const [converting, setConverting] = useState(false);

  const fetchForecast = async (forecastDays) => {
    try {
      setLoading(true);
      const res = await api.get(`/intelligence/forecast?days=${forecastDays}`);
      setForecast(res.data.forecast || null);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (e) => {
    if (e) e.preventDefault();
    try {
      setConverting(true);
      const res = await api.post('/intelligence/currency/convert', {
        amount: parseFloat(convertAmount),
        from: fromCurr,
        to: toCurr,
      });
      setConversionResult(res.data);
    } catch (err) {
      console.error('Failed currency conversion:', err);
    } finally {
      setConverting(false);
    }
  };

  useEffect(() => {
    fetchForecast(days);
    handleConvert();
  }, [days]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cash Flow Forecasting & Liquidity Intelligence
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              Predictive Runways
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Simulate 30, 60, and 90-day cash trajectories across Conservative, Expected, and Best-Case operating scenarios.
          </p>
        </div>

        {/* Days selector */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                days === d
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {d} Days Outlook
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Cards */}
      {forecast && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Starting Liquidity</span>
            <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              ₹{(forecast.startingBalance || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-slate-400">Across active bank accounts</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Projected Inflows</span>
            <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" />
              ₹{(forecast.totalProjectedInflow || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-slate-400">{forecast.scheduledInflowsCount || 0} scheduled invoices</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Projected Outflows</span>
            <div className="mt-2 text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              <ArrowDownRight className="h-4 w-4" />
              ₹{(forecast.totalProjectedOutflow || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-slate-400">{forecast.scheduledOutflowsCount || 0} bills & loan EMIs</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Net Delta</span>
            <div
              className={`mt-2 text-xl font-bold ${
                forecast.netProjectedDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {forecast.netProjectedDelta >= 0 ? '+' : ''}₹{(forecast.netProjectedDelta || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-slate-400">Net operating delta</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Projected Day {days} Cash</span>
            <div className="mt-2 text-xl font-bold text-brand-600 dark:text-brand-400">
              ₹{(forecast.endProjectedBalance || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-slate-400">Expected balance closing</div>
          </div>
        </div>
      )}

      {/* Main Multi-Scenario Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {days}-Day Cash Trajectory Scenarios
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic modeling based on confirmed recurring contracts, scheduled EMIs, and invoice due dates.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-brand-600 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Expected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Conservative (70% Inflow / +10% Outflow)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Best-Case (100% Inflow / -5% Outflow)</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : forecast?.timeline?.length > 0 ? (
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.timeline} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bestCaseBalance"
                  name="Best-Case"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expectedBalance"
                  name="Expected"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="conservativeBalance"
                  name="Conservative"
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-slate-500">No trajectory timeline data available.</div>
        )}
      </div>

      {/* Multi-Currency Conversion Utility */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Multi-Currency FX Conversion Engine
            </h2>
            <p className="text-xs text-slate-500">
              Real-time multi-currency valuation for foreign client receivables and vendor disbursements.
            </p>
          </div>
        </div>

        <form onSubmit={handleConvert} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">From Currency</label>
            <select
              value={fromCurr}
              onChange={(e) => setFromCurr(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'INR'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">To Currency</label>
            <select
              value={toCurr}
              onChange={(e) => setToCurr(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={converting}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all"
          >
            {converting ? 'Calculating...' : 'Convert FX'}
          </button>
        </form>

        {conversionResult && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between text-sm">
            <div>
              <span className="text-slate-500 text-xs">Converted Valuation</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {conversionResult.toCurrency} {conversionResult.convertedAmount.toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-2 sm:mt-0">
              1 {conversionResult.fromCurrency} = {conversionResult.rate} {conversionResult.toCurrency}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
