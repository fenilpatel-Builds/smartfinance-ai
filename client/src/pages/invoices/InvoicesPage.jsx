import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  Download,
  X,
  CreditCard,
  Building2,
  User,
} from 'lucide-react';
import api from '../../services/api';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [items, setItems] = useState([
    { description: 'Consulting & Financial Advisory Services', quantity: 1, unitPrice: 50000, taxRate: 18 },
  ]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payBankAccountId, setPayBankAccountId] = useState('');

  const fetchInvoicesAndBanks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;

      const [invRes, bankRes] = await Promise.all([
        api.get('/invoices', { params }),
        api.get('/bank-accounts'),
      ]);

      setInvoices(invRes.data.invoices || []);
      setMetrics(invRes.data.metrics || {});
      setBankAccounts(bankRes.data.accounts || []);
      if (bankRes.data.accounts?.length > 0 && !payBankAccountId) {
        setPayBankAccountId(bankRes.data.accounts[0]._id);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesAndBanks();
  }, [statusFilter, search]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 18 }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const calculateSubtotal = () =>
    items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

  const calculateTax = () =>
    items.reduce((acc, it) => {
      const line = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      return acc + line * ((Number(it.taxRate) || 0) / 100);
    }, 0);

  const calculateTotal = () =>
    Math.max(0, calculateSubtotal() + calculateTax() - (Number(discountAmount) || 0));

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        customerName,
        customerEmail,
        dueDate,
        items,
        discountAmount: Number(discountAmount) || 0,
        notes: invoiceNotes,
      });
      setShowCreateModal(false);
      setCustomerName('');
      setCustomerEmail('');
      setDueDate('');
      setItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 18 }]);
      fetchInvoicesAndBanks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentInvoice || !payAmount) return;
    try {
      await api.post(`/invoices/${paymentInvoice._id}/payment`, {
        amount: parseFloat(payAmount),
        bankAccountId: payBankAccountId || undefined,
      });
      setPaymentInvoice(null);
      setPayAmount('');
      fetchInvoicesAndBanks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchInvoicesAndBanks();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Customer Invoicing & Receivables
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Issue verified tax invoices, manage client receivables, and link payments to bank accounts
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Invoiced</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            ₹{(metrics.totalInvoiced || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Across {metrics.count || 0} issued invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Collected Revenue</span>
          <h2 className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">
            ₹{(metrics.totalPaid || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Deposited into bank accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Receivables</span>
          <h2 className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{(metrics.totalOutstanding || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting client settlement</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue Invoices</span>
          <h2 className="text-2xl font-bold tracking-tight text-rose-600 mt-1">
            ₹{(metrics.totalOverdue || 0).toLocaleString()}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">Past due date</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', 'Sent', 'Partially Paid', 'Paid', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or client..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Paid Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No invoices found. Click "Create Invoice" to issue client billings.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {inv.customerName}
                    </span>
                    <span className="text-[10px] text-slate-400">{inv.customerEmail || '—'}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                    ₹{inv.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                    ₹{(inv.paidAmount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => {
                            setPaymentInvoice(inv);
                            setPayAmount(String(Math.max(0, inv.totalAmount - (inv.paidAmount || 0))));
                          }}
                          className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer"
                        >
                          Record Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">New Customer Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Apex Global Ventures"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="billing@apex.com"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full sm:w-48 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Invoice Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-brand-600 font-semibold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={it.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Tax %"
                        value={it.taxRate}
                        onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 text-right space-y-1">
                <div>Subtotal: ₹{calculateSubtotal().toLocaleString()}</div>
                <div>GST / Tax: ₹{calculateTax().toLocaleString()}</div>
                <div className="text-base font-bold text-slate-900 dark:text-white pt-1">
                  Total Payable: ₹{calculateTotal().toLocaleString()}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-500 cursor-pointer"
                >
                  Create & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Record Invoice Payment</h3>
              <button onClick={() => setPaymentInvoice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 mt-4 text-xs">
              <div>
                <span className="text-slate-500">Invoice:</span>
                <p className="font-bold text-slate-900 dark:text-white">{paymentInvoice.invoiceNumber} — {paymentInvoice.customerName}</p>
                <p className="text-slate-400 text-[11px]">Outstanding balance: ₹{(paymentInvoice.totalAmount - (paymentInvoice.paidAmount || 0)).toLocaleString()}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount Received (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deposit to Bank Account (Optional)
                </label>
                <select
                  value={payBankAccountId}
                  onChange={(e) => setPayBankAccountId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Do not create bank ledger transaction</option>
                  {bankAccounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.bankName} ({a.maskedAccountNumber})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  If selected, an audited credit transaction will be created in this bank account.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
