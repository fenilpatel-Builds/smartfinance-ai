import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import api from '../../services/api';

export const AnomaliesPage = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingStatus, setResolvingStatus] = useState('Resolved');

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (severityFilter !== 'All') params.severity = severityFilter;

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
  }, [statusFilter, severityFilter]);

  const handleTriggerScan = async () => {
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

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedAnomaly) return;
    try {
      await api.patch(`/anomalies/${selectedAnomaly._id}`, {
        status: resolvingStatus,
        resolutionNotes,
      });
      setSelectedAnomaly(null);
      setResolutionNotes('');
      fetchAnomalies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update anomaly');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Financial Anomaly & Risk Detection
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated transaction spike detection, duplicate charges, and irregular velocity monitoring
          </p>
        </div>

        <button
          onClick={handleTriggerScan}
          disabled={scanning}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning Transactions...' : 'Run Anomaly Scan'}
        </button>
      </div>

      {/* Fraud Disclaimer Alert */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <span className="font-semibold">Compliance Note:</span> Anomaly alerts represent statistical deviations (e.g. 3x category average, duplicate within 48h, high velocity). They are prioritized for internal audit review and do not constitute legal proof of fraud.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Flagged Anomalies</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {metrics.totalDetected || 0}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Identified across all statements</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Critical Priority</span>
          <h2 className="text-2xl font-bold tracking-tight text-rose-600 mt-1">
            {metrics.criticalCount || 0}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Requires immediate sign-off</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">High Risk Items</span>
          <h2 className="text-2xl font-bold tracking-tight text-amber-600 mt-1">
            {metrics.highCount || 0}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Significant cost deviation</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Investigation</span>
          <h2 className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.pendingReview || 0}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting review action</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Status:</span>
          {['All', 'Detected', 'Investigating', 'Resolved', 'Dismissed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-xs font-medium text-slate-500">Severity:</span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {anomalies.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            No anomalies detected matching current criteria. All accounts operating within standard historical parameters.
          </div>
        ) : (
          anomalies.map((a) => (
            <div
              key={a._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${
                    a.severity === 'Critical'
                      ? 'bg-rose-600'
                      : a.severity === 'High'
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{a.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        a.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : a.severity === 'High'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        a.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : a.status === 'Dismissed'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                    {a.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-2 font-mono">
                    <span>Amount: ₹{Number(a.affectedAmount || 0).toLocaleString()}</span>
                    <span>Account: {a.bankAccountId?.bankName || 'General'}</span>
                    <span>Confidence: {Math.round((a.confidenceScore || 0) * 100)}%</span>
                    <span>Date: {new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-0 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedAnomaly(a);
                    setResolvingStatus(a.status === 'Detected' ? 'Resolved' : a.status);
                    setResolutionNotes(a.resolutionNotes || '');
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Review / Resolve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Review & Resolve Anomaly</h3>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 mt-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Issue Title:</span>
                <p className="text-slate-900 dark:text-white font-medium mt-0.5">{selectedAnomaly.title}</p>
                <p className="text-[11px] text-slate-500 mt-1">{selectedAnomaly.description}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Investigation Status
                </label>
                <select
                  value={resolvingStatus}
                  onChange={(e) => setResolvingStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Detected">Detected (Open)</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved (Audited & Approved)</option>
                  <option value="Dismissed">Dismissed (False Positive)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes / Audit Sign-off
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Verified with engineering lead; annual subscription renewal invoice matched."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 cursor-pointer"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
