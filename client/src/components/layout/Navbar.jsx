import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  Building2,
  ChevronDown,
  PlusCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { currentWorkspace, workspaces, switchWorkspace } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      {/* Left section: Hamburger & Workspace selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Workspace Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowWsMenu(!showWsMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Building2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span className="font-semibold">{currentWorkspace?.name || 'Workspace'}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showWsMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowWsMenu(false)} />
              <div className="absolute left-0 mt-2 z-30 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase text-slate-400">
                  Switch Workspace
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id || ws._id}
                    onClick={() => {
                      switchWorkspace(ws);
                      setShowWsMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <div className="truncate">
                      <p className="font-semibold truncate">{ws.name}</p>
                      <p className="text-[10px] text-slate-400">{ws.role || 'Member'} • {ws.currency || 'INR'}</p>
                    </div>
                    {(currentWorkspace?.id === ws.id || currentWorkspace?._id === ws._id) && (
                      <Check className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center relative max-w-xs w-full">
        <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search statements, merchants, amounts..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-100"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 z-30 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">System Notifications</h4>
                  <span className="text-[10px] text-brand-600 font-semibold cursor-pointer">Mark read</span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-brand-50/50 dark:bg-slate-800/40 border border-brand-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">HDFC Statement Jan 2026 Processed</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">30 transactions verified with 0 discrepancies.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/20">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Reconciliation Match Complete</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">₹35,000 inter-account transfer matched.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

