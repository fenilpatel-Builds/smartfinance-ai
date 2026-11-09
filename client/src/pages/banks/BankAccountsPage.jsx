import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Wallet,
  ArrowRight,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const BankAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    accountNickname: '',
    accountType: 'Savings',
    ifscCode: '',
    openingBalance: '0',
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bank-accounts');
      setAccounts(res.data.accounts || []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      accountNickname: '',
      accountType: 'Savings',
      ifscCode: '',
      openingBalance: '0',
    });
    setShowModal(true);
  };

  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setFormData({
      bankName: acc.bankName,
      accountHolderName: acc.accountHolderName,
      accountNumber: acc.maskedAccountNumber,
      accountNickname: acc.accountNickname || '',
      accountType: acc.accountType || 'Savings',
      ifscCode: acc.ifscCode || '',
      openingBalance: String(acc.openingBalance || '0'),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.patch(`/bank-accounts/${editingAccount._id}`, formData);
      } else {
        await api.post('/bank-accounts', formData);
      }
      setShowModal(false);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to archive this bank account?')) {
      try {
        await api.delete(`/bank-accounts/${id}`);
        fetchAccounts();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentCalculatedBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Bank Account Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure multi-bank entities, track isolated ledgers and calculated running balances
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Bank Account
        </button>
      </div>

      {/* Summary Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Consolidated Liquidity</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              ₹{totalBalance.toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Sum of all active bank account calculated balances</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/consolidation"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Consolidation View
            </Link>
            <Link
              to="/upload"
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Statement
            </Link>
          </div>
        </div>
      </div>

      {/* Bank Account Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <div
            key={acc._id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{acc.bankName}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {acc.accountNickname || acc.accountType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(acc)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-800/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{acc.maskedAccountNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Holder:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{acc.accountHolderName}</span>
                </div>
                {acc.ifscCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{acc.ifscCode}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Transactions:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{acc.transactionCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Balance</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    ₹{(acc.currentCalculatedBalance || 0).toLocaleString()}
                  </p>
                </div>
                <Link
                  to={`/transactions?bankAccountId=${acc._id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Ledger <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="e.g. Fenil Patel"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Full or last 4 digits (e.g. 50100234921)"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Overdraft">Overdraft</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.accountNickname}
                    onChange={(e) => setFormData({ ...formData, accountNickname: e.target.value })}
                    placeholder="e.g. Corporate Prime"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    placeholder="HDFC0001234"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

