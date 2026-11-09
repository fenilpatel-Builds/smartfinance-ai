import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Users,
  ShieldCheck,
  Plus,
  Save,
  Check,
  History,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const SettingsPage = () => {
  const { currentWorkspace, user } = useAuth();
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
  const [currency, setCurrency] = useState(currentWorkspace?.currency || 'INR');
  const [members, setMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [saved, setSaved] = useState(false);

  // Invite modal
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Accountant');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name);
      setCurrency(currentWorkspace.currency || 'INR');
      fetchMembersAndAudit();
    }
  }, [currentWorkspace]);

  const fetchMembersAndAudit = async () => {
    try {
      const [memRes, logRes] = await Promise.all([
        api.get('/workspaces/members'),
        api.get('/workspaces/audit-logs'),
      ]);
      setMembers(memRes.data.members || []);
      setAuditLogs(logRes.data.logs || []);
    } catch (err) {
      console.error('Failed fetching settings data:', err);
    }
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/workspaces/current', {
        name: workspaceName,
        currency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post('/workspaces/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
      alert(`Invitation sent to ${inviteEmail}`);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Workspace Settings & Access Control
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage entity profile, base currency, team roles, and strict audit settings
        </p>
      </div>

      {/* General Settings Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Financial Workspace Profile
        </h3>

        <form onSubmit={handleSaveWorkspace} className="space-y-4 max-w-lg text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Workspace / Business Entity Name
            </label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Base Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
            >
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="AED">AED (د.إ - UAE Dirham)</option>
              <option value="SGD">SGD (S$ - Singapore Dollar)</option>
            </select>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved Successfully' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Team Members & Role Permissions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Members & Roles</h3>
            <p className="text-[11px] text-slate-500">
              Workspace Owner, Accountant, Finance Manager, Viewer
            </p>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="mb-4 flex flex-col sm:flex-row items-center gap-2 text-xs">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full sm:w-64 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="w-full sm:w-40 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
          >
            <option value="Accountant">Accountant</option>
            <option value="Finance Manager">Finance Manager</option>
            <option value="Viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="w-full sm:w-auto rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {inviting ? 'Inviting...' : 'Invite Member'}
          </button>
        </form>

        {/* Members List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => (
            <div key={m._id} className="flex items-center justify-between py-3 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={m.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.userId?.name || 'User')}&background=6366f1&color=fff`}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{m.userId?.name || 'Member'}</p>
                  <p className="text-[10px] text-slate-400">{m.userId?.email}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail & Compliance Log Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="h-4 w-4 text-brand-600" />
              Compliance Audit Trail & Activity Logs
            </h3>
            <p className="text-[11px] text-slate-500">
              Immutable record of statement uploads, reconciliation runs, imports, and ledger modifications
            </p>
          </div>
          <span className="text-[10px] text-slate-400">
            {auditLogs.length} events logged
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No audit activities recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 pr-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Metadata</th>
                  <th className="py-2.5 pl-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                      {log.entityType}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {log.userId?.name || 'System User'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.userId?.email}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px] max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td className="py-2.5 pl-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

