import React, { useState, useEffect } from 'react';
import {
  Scale,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import api from '../../services/api';

export const BalanceSheetPage = () => {
  const [activeTab, setActiveTab] = useState('complete'); // 'complete' | 'bank_position'
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [bankSummary, setBankSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Item Modal
  const [showModal, setShowModal] = useState(false);
  const [itemType, setItemType] = useState('asset'); // 'asset' | 'liability' | 'equity'
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemSubtype, setItemSubtype] = useState('Fixed Assets');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [bsRes, bankRes] = await Promise.all([
        api.get('/reports/balance-sheet'),
        api.get('/reports/bank-summary'),
      ]);
      setBalanceSheet(bsRes.data.balanceSheet);
      setBankSummary(bankRes.data);
    } catch (err) {
      console.error('Failed loading balance sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      if (itemType === 'asset') {
        await api.post('/financial-records/assets', {
          name: itemName,
          assetType: itemSubtype,
          amount: parseFloat(itemAmount),
        });
      } else if (itemType === 'liability') {
        await api.post('/financial-records/liabilities', {
          name: itemName,
          liabilityType: itemSubtype,
          amount: parseFloat(itemAmount),
        });
      } else {
        await api.post('/financial-records/equity', {
          name: itemName,
          equityType: itemSubtype,
          amount: parseFloat(itemAmount),
        });
      }

      setShowModal(false);
      setItemName('');
      setItemAmount('');
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Balance Sheet & Bank Position
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic accounting equation verification: Assets = Liabilities + Equity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Export PDF
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" /> Add Balance Sheet Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('complete')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'complete'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Scale className="h-4 w-4" /> Complete Balance Sheet (Accounting Equation)
        </button>
        <button
          onClick={() => setActiveTab('bank_position')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'bank_position'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Building2 className="h-4 w-4" /> Bank Position & Cash Summary
        </button>
      </div>

      {/* Tab 1: Complete Accounting Balance Sheet */}
      {activeTab === 'complete' && balanceSheet && (
        <div className="space-y-6">
          {/* Equation Verification Banner */}
          <div
            className={`rounded-2xl border p-4 shadow-xs ${
              balanceSheet.isEquationBalanced
                ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30'
                : 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
                    balanceSheet.isEquationBalanced ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {balanceSheet.isEquationBalanced ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {balanceSheet.isEquationBalanced
                      ? 'Accounting Equation Balanced: Assets = Liabilities + Equity'
                      : 'Accounting Equation Difference Detected'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Total Assets: ₹{balanceSheet.assets.total.toLocaleString()} | Liabilities + Equity: ₹
                    {balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}
                  </p>
                </div>
              </div>

              {!balanceSheet.isEquationBalanced && (
                <div className="rounded-lg bg-white/80 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-xs dark:bg-slate-800 dark:text-amber-300">
                  Difference: ₹{balanceSheet.balanceDifference.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Assets vs Liabilities & Equity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: ASSETS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">ASSETS</h3>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                  ₹{balanceSheet.assets.total.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {Object.entries(balanceSheet.assets.items).map(([category, amt]) => (
                  <div key={category} className="flex items-center justify-between pt-2.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{category}</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      ₹{Number(amt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dynamic Bank Accounts breakdown under Assets */}
              <div className="mt-5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40 text-[11px]">
                <p className="font-semibold text-slate-500 mb-1.5 uppercase tracking-wider text-[10px]">
                  Included Bank Balances (Verified Ledger)
                </p>
                {balanceSheet.assets.bankAccountBreakdown.map((b) => (
                  <div key={b.id} className="flex justify-between py-0.5">
                    <span className="text-slate-600 dark:text-slate-400">
                      {b.accountNickname} ({b.maskedNumber})
                    </span>
                    <span className="font-mono font-semibold">₹{b.balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: LIABILITIES & EQUITY */}
            <div className="space-y-6">
              {/* LIABILITIES */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">LIABILITIES</h3>
                  <span className="text-sm font-bold text-rose-600">
                    ₹{balanceSheet.liabilities.total.toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {Object.entries(balanceSheet.liabilities.items).map(([category, amt]) => (
                    <div key={category} className="flex items-center justify-between pt-2.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{category}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        ₹{Number(amt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EQUITY */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">EQUITY</h3>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{balanceSheet.equity.total.toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {Object.entries(balanceSheet.equity.items).map(([category, amt]) => (
                    <div key={category} className="flex items-center justify-between pt-2.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{category}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        ₹{Number(amt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bank Position & Cash Summary */}
      {activeTab === 'bank_position' && bankSummary && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Bank Position & Statement Reconciliation Summary
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Bank Name</th>
                  <th className="pb-3 font-semibold">Account Number</th>
                  <th className="pb-3 font-semibold text-right">Opening Balance</th>
                  <th className="pb-3 font-semibold text-right">Total Credits</th>
                  <th className="pb-3 font-semibold text-right">Total Debits</th>
                  <th className="pb-3 font-semibold text-right">Net Movement</th>
                  <th className="pb-3 font-semibold text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bankSummary.bankAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {acc.accountNickname || acc.bankName}
                    </td>
                    <td className="py-3 font-mono text-slate-500">{acc.maskedAccountNumber}</td>
                    <td className="py-3 text-right font-mono">₹{acc.openingBalance.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-emerald-600">+₹{acc.totalCredits.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-rose-600">-₹{acc.totalDebits.toLocaleString()}</td>
                    <td className={`py-3 text-right font-mono font-bold ${acc.netMovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {acc.netMovement >= 0 ? '+' : ''}₹{acc.netMovement.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{acc.closingBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal to Add Asset/Liability/Equity Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Add Balance Sheet Entry</h3>
            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Section *</label>
                <select
                  value={itemType}
                  onChange={(e) => {
                    setItemType(e.target.value);
                    if (e.target.value === 'asset') setItemSubtype('Fixed Assets');
                    else if (e.target.value === 'liability') setItemSubtype('Accounts Payable');
                    else setItemSubtype("Owner's Capital");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Type *</label>
                <select
                  value={itemSubtype}
                  onChange={(e) => setItemSubtype(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {itemType === 'asset' && (
                    <>
                      <option value="Cash">Cash</option>
                      <option value="Accounts Receivable">Accounts Receivable</option>
                      <option value="Inventory">Inventory</option>
                      <option value="Fixed Assets">Fixed Assets</option>
                      <option value="Investments">Investments</option>
                      <option value="Other Assets">Other Assets</option>
                    </>
                  )}
                  {itemType === 'liability' && (
                    <>
                      <option value="Accounts Payable">Accounts Payable</option>
                      <option value="Loans">Loans</option>
                      <option value="Credit Card Outstanding">Credit Card Outstanding</option>
                      <option value="Taxes Payable">Taxes Payable</option>
                      <option value="Other Liabilities">Other Liabilities</option>
                    </>
                  )}
                  {itemType === 'equity' && (
                    <>
                      <option value="Owner's Capital">Owner's Capital</option>
                      <option value="Retained Earnings">Retained Earnings</option>
                      <option value="Other Equity">Other Equity</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Office Hardware, GST Payable"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-1.5 font-semibold text-white hover:bg-brand-500"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

