import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UploadCloud,
  Receipt,
  Tags,
  ArrowRightLeft,
  CheckCheck,
  PiggyBank,
  Scale,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Bank Accounts', path: '/banks', icon: Building2 },
  { name: 'Upload Statements', path: '/upload', icon: UploadCloud, highlight: true },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Categories & Rules', path: '/categories', icon: Tags },
  { name: 'Consolidation', path: '/consolidation', icon: ArrowRightLeft },
  { name: 'Reconciliation', path: '/reconciliation', icon: CheckCheck },
  { name: 'Budgets & Expenses', path: '/budgets', icon: PiggyBank },
  { name: 'Balance Sheet', path: '/balance-sheet', icon: Scale },
  { name: 'Reports & P&L', path: '/reports', icon: BarChart3 },
  { name: 'AI Insights & Chat', path: '/ai', icon: Sparkles, badge: 'AI' },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, currentWorkspace, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 dark:text-white">SmartFinance</span>
              <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">AI</span>
            </div>
          </div>
        </div>

        {/* Current Workspace Pill */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50">
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
            <div className="text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              Active Workspace
            </div>
            <div className="font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {currentWorkspace?.name || 'Default Workspace'}
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  } ${item.highlight && !isActive ? 'border border-dashed border-brand-200 dark:border-brand-800/60 bg-brand-50/30' : ''}`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 transition-colors" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Fenil Patel'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

