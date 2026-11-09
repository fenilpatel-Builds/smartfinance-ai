import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoOwner = () => {
    setEmail('owner@smartfinance.ai');
    setPassword('password123');
  };

  const fillDemoAccountant = () => {
    setEmail('accountant@smartfinance.ai');
    setPassword('password123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            SmartFinance AI
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Intelligent Multi-Bank Statement Analysis & Financial Management
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Sign in to your account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter your credentials to access your financial workspace</p>

          {error && (
            <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Buttons */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Instant Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoOwner}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left text-xs hover:border-brand-500 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-brand-500 transition-all cursor-pointer"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">Workspace Owner</p>
                <p className="text-[10px] text-slate-500 truncate">owner@smartfinance.ai</p>
              </button>
              <button
                type="button"
                onClick={fillDemoAccountant}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left text-xs hover:border-brand-500 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-brand-500 transition-all cursor-pointer"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">Accountant</p>
                <p className="text-[10px] text-slate-500 truncate">accountant@smartfinance.ai</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Register your company
          </Link>
        </p>
      </div>
    </div>
  );
};

