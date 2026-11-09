import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  CreditCard,
  X,
  Search,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payBankAccountId, setPayBankAccountId] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    dueDate: '',
    items: [{ description: 'Professional Financial Consulting', quantity: 1, unitPrice: 50000, taxRate: 18 }],
    discountAmount: '0',
    notes: 'Payment due within 30 days of invoice date.',
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (search) params.search = search;
      const res = await api.get('/invoices', { params });
      setInvoices(res.data.invoices || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await api.get('/bank-accounts');
      setBankAccounts(res.data.accounts || []);
      if (res.data.accounts && res.data.accounts.length > 0) {
        setPayBankAccountId(res.data.accounts[0]._id);
      }
    } catch (e) {
      console.error('Failed to fetch bank accounts:', e);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchBankAccounts();
  }, [filterStatus]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 18 }],
    });
  };

  const handleRemoveItem = (idx) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx),
    });
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formData.items];
    updated[idx][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const calculateFormTotal = () => {
    let sub = 0;
    let tax = 0;
    formData.items.forEach((item) => {
      const line = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      sub += line;
      tax += line * ((parseFloat(item.taxRate) || 0) / 100);
    });
    const disc = parseFloat(formData.discountAmount) || 0;
    return {
      subtotal: Math.round(sub * 100) / 100,
      taxAmount: Math.round(tax * 100) / 100,
      total: Math.max(0, Math.round((sub + tax - disc) * 100) / 100),
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', formData);
      setShowAddModal(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        dueDate: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 18 }],
        discountAmount: '0',
        notes: '',
      });
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!showPayModal || !payAmount) return;
    try {
      await api.post(`/invoices/${showPayModal._id}/payment`, {
        amount: parseFloat(payAmount),
        bankAccountId: payBankAccountId || undefined,
      });
      setShowPayModal(null);
      setPayAmount('');
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const formCalculations = calculateFormTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Invoicing & Accounts Receivable
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Revenue Pipeline
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Issue client invoices, track collection schedules, and record automated cash deposits.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Invoiced</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{(metrics.totalInvoiced || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">{metrics.count || 0} total invoices generated</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Collected Revenue</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{(metrics.totalPaid || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Settled and deposited</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Outstanding Receivables</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₹{(metrics.totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Pending client clearance</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Overdue Receivables</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            ₹{(metrics.totalOverdue || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Past payment due date</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {['All', 'Sent', 'Partially Paid', 'Paid', 'Overdue'].map((status) => (
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

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No Invoices Found</h3>
            <p className="mt-1 text-sm text-slate-500">Create client invoices to start tracking cash flow receivables.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Invoice #</th>
                  <th className="px-6 py-3.5 font-semibold">Customer</th>
                  <th className="px-6 py-3.5 font-semibold">Issue Date</th>
                  <th className="px-6 py-3.5 font-semibold">Due Date</th>
                  <th className="px-6 py-3.5 font-semibold">Total Amount</th>
                  <th className="px-6 py-3.5 font-semibold">Balance Due</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const balanceDue = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{inv.customerName}</div>
                        {inv.customerEmail && <div className="text-xs text-slate-400">{inv.customerEmail}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-brand-600 dark:text-brand-400">
                        ₹{balanceDue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : inv.status === 'Partially Paid'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : inv.status === 'Overdue'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                setShowPayModal(inv);
                                setPayAmount(String(balanceDue));
                              }}
                              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(inv._id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Invoice */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Invoice</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Customer Email</label>
                  <input
                    type="email"
                    placeholder="billing@acmecorp.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Description of work"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-16 rounded-xl border border-slate-200 px-2 py-1.5 text-xs text-center text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate ₹"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-28 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <select
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                        className="w-20 rounded-xl border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="0">0% GST</option>
                        <option value="5">5% GST</option>
                        <option value="12">12% GST</option>
                        <option value="18">18% GST</option>
                        <option value="28">28% GST</option>
                      </select>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-1.5 text-xs dark:bg-slate-800/50">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{formCalculations.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST Tax:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{formCalculations.taxAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm text-slate-900 dark:text-white dark:border-slate-700">
                  <span>Total Amount Payable:</span>
                  <span className="text-brand-600 dark:text-brand-400">
                    ₹{formCalculations.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
                >
                  Save & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Record Payment for {showPayModal.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowPayModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deposit to Bank Account
                </label>
                <select
                  value={payBankAccountId}
                  onChange={(e) => setPayBankAccountId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Do not create linked bank deposit</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.bankName} - {acc.accountNickname || acc.maskedAccountNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
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
