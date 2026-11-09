import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  DollarSign,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

export const AnomaliesPage = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterSeverity !== 'All') params.severity = filterSeverity;
      const res = await api.get('/anomalies', { params });
      setAnomalies(res.data.anomalies || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [filterStatus, filterSeverity]);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const res = await api.post('/anomalies/scan');
      alert(res.data.message || 'Anomaly scan completed!');
      fetchAnomalies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to scan anomalies');
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/anomalies/${id}`, { status });
      fetchAnomalies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update anomaly status');
    }
  };

  const getSeverityBadge = (sev) => {
    const s = sev?.toLowerCase();
    if (s === 'critical') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300';
    if (s === 'high') return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300';
    if (s === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300';
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Anomaly Detection Center
            </h1>
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-400">
              Risk Guard
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time heuristic & statistical audit of unusual spending surges, duplicate charges, and irregular frequencies.
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Auditing Ledgers...' : 'Run Anomaly Scan'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Flagged</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalDetected || 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">Total detected pattern anomalies</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Critical Risks</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {metrics.criticalCount || 0} Critical
          </div>
          <div className="mt-1 text-xs text-slate-500">Immediate auditor review required</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">High Severity</span>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
            {metrics.highCount || 0} High
          </div>
          <div className="mt-1 text-xs text-slate-500">Disproportionate balance impact</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Review</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics.pendingReview || 0} Pending
          </div>
          <div className="mt-1 text-xs text-slate-500">Unresolved discrepancies</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {['All', 'Detected', 'Reviewed', 'Resolved', 'Dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Anomalies List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : anomalies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">Ledgers Clean & Reconciled</h3>
          <p className="mt-1 text-sm text-slate-500">
            No unreviewed anomalies match your current filters. Click "Run Anomaly Scan" to audit new statement entries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anom) => (
            <div
              key={anom._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-red-50 p-3 text-red-600 dark:bg-red-950/50 dark:text-red-400 shrink-0">
                    <AlertTriangle className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${getSeverityBadge(anom.severity)}`}>
                        {anom.severity}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {anom.anomalyType}
                      </span>
                      <span className="text-xs text-slate-400">
                        Flagged {new Date(anom.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                      {anom.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                      {anom.description}
                    </p>

                    {anom.affectedAmount > 0 && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-800/60">
                        <span className="text-slate-400 font-medium">Impacted Ledger Amount:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{anom.affectedAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col sm:items-end gap-3 shrink-0">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold text-center ${
                      anom.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : anom.status === 'Dismissed'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {anom.status}
                  </span>

                  <div className="flex items-center gap-2">
                    {anom.status !== 'Resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(anom._id, 'Resolved')}
                        className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
                      >
                        Resolve
                      </button>
                    )}
                    {anom.status !== 'Dismissed' && (
                      <button
                        onClick={() => handleUpdateStatus(anom._id, 'Dismissed')}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
