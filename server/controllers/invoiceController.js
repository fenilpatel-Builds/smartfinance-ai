import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import { recalculateBankAccountBalance } from '../services/financialEngine.js';
import { logAudit } from '../utils/auditLogger.js';

export const getInvoices = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = { workspaceId: req.workspace._id };

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      const reg = new RegExp(search, 'i');
      filter.$or = [{ invoiceNumber: reg }, { customerName: reg }, { customerEmail: reg }];
    }

    const invoices = await Invoice.find(filter)
      .sort({ issueDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalCount = await Invoice.countDocuments(filter);

    // Compute metrics across all workspace invoices
    const allInvoices = await Invoice.find({ workspaceId: req.workspace._id });
    const now = new Date();

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    allInvoices.forEach((inv) => {
      totalInvoiced += inv.totalAmount || 0;
      totalPaid += inv.paidAmount || 0;
      const balance = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
      
      if (inv.status !== 'Paid' && inv.status !== 'Cancelled') {
        totalOutstanding += balance;
        if (new Date(inv.dueDate) < now) {
          totalOverdue += balance;
        }
      }
    });

    res.json({
      success: true,
      invoices,
      totalCount,
      metrics: {
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalOverdue: Math.round(totalOverdue * 100) / 100,
        count: allInvoices.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const {
      invoiceNumber,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      issueDate = new Date(),
      dueDate,
      items = [],
      discountAmount = 0,
      notes,
      terms,
      currency = 'INR',
    } = req.body;

    if (!customerName || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer name and at least one item are required' });
    }

    // Auto-generate invoice number if missing
    let finalInvoiceNumber = invoiceNumber;
    if (!finalInvoiceNumber) {
      const count = await Invoice.countDocuments({ workspaceId: req.workspace._id });
      const year = new Date().getFullYear();
      finalInvoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Deterministic item calculations
    let calculatedSubtotal = 0;
    let calculatedTaxTotal = 0;

    const normalizedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.unitPrice) || 0;
      const lineAmt = Math.round(qty * rate * 100) / 100;
      const taxRate = Number(item.taxRate) || 0;
      const taxAmt = Math.round(lineAmt * (taxRate / 100) * 100) / 100;

      calculatedSubtotal += lineAmt;
      calculatedTaxTotal += taxAmt;

      return {
        description: item.description || 'Service/Product',
        quantity: qty,
        unitPrice: rate,
        taxRate: taxRate,
        amount: lineAmt,
      };
    });

    const disc = Number(discountAmount) || 0;
    const finalTotal = Math.max(0, Math.round((calculatedSubtotal + calculatedTaxTotal - disc) * 100) / 100);

    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      workspaceId: req.workspace._id,
      invoiceNumber: finalInvoiceNumber,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      issueDate: new Date(issueDate),
      dueDate: calculatedDueDate,
      items: normalizedItems,
      subtotal: Math.round(calculatedSubtotal * 100) / 100,
      taxAmount: Math.round(calculatedTaxTotal * 100) / 100,
      discountAmount: disc,
      totalAmount: finalTotal,
      paidAmount: 0,
      currency,
      status: 'Sent',
      notes,
      terms,
    });

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'CREATE_INVOICE',
      resourceType: 'Invoice',
      resourceId: invoice._id,
      details: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount },
    });

    res.status(201).json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      dueDate,
      items,
      discountAmount,
      status,
      notes,
      terms,
    } = req.body;

    if (customerName) invoice.customerName = customerName;
    if (customerEmail !== undefined) invoice.customerEmail = customerEmail;
    if (customerPhone !== undefined) invoice.customerPhone = customerPhone;
    if (customerAddress !== undefined) invoice.customerAddress = customerAddress;
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;
    if (status) invoice.status = status;

    if (items && Array.isArray(items)) {
      let calculatedSubtotal = 0;
      let calculatedTaxTotal = 0;

      invoice.items = items.map((item) => {
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.unitPrice) || 0;
        const lineAmt = Math.round(qty * rate * 100) / 100;
        const taxRate = Number(item.taxRate) || 0;
        const taxAmt = Math.round(lineAmt * (taxRate / 100) * 100) / 100;

        calculatedSubtotal += lineAmt;
        calculatedTaxTotal += taxAmt;

        return {
          description: item.description || 'Service/Product',
          quantity: qty,
          unitPrice: rate,
          taxRate: taxRate,
          amount: lineAmt,
        };
      });

      const disc = discountAmount !== undefined ? Number(discountAmount) : invoice.discountAmount;
      invoice.discountAmount = disc;
      invoice.subtotal = Math.round(calculatedSubtotal * 100) / 100;
      invoice.taxAmount = Math.round(calculatedTaxTotal * 100) / 100;
      invoice.totalAmount = Math.max(0, Math.round((calculatedSubtotal + calculatedTaxTotal - disc) * 100) / 100);
    }

    await invoice.save();
    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentDate = new Date(), paymentMethod = 'Bank Transfer', bankAccountId, notes } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const newPaidAmount = Math.round((invoice.paidAmount + payAmt) * 100) / 100;
    invoice.paidAmount = newPaidAmount;

    if (newPaidAmount >= invoice.totalAmount) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }

    // Optional: create a linked deposit transaction in selected bank account
    if (bankAccountId) {
      const tx = await Transaction.create({
        workspaceId: req.workspace._id,
        bankAccountId,
        transactionDate: new Date(paymentDate),
        description: `Payment for Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
        normalizedDescription: `Invoice Payment ${invoice.invoiceNumber}`,
        credit: payAmt,
        debit: 0,
        amount: payAmt,
        transactionType: 'credit',
        categoryName: 'Revenue',
        merchant: invoice.customerName,
        referenceNumber: invoice.invoiceNumber,
        notes: notes || `Payment recorded against ${invoice.invoiceNumber}`,
        categorizationSource: 'auto_rule',
      });

      await recalculateBankAccountBalance(bankAccountId, req.workspace._id);
      invoice.linkedTransactionId = tx._id;
    }

    await invoice.save();

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'RECORD_INVOICE_PAYMENT',
      resourceType: 'Invoice',
      resourceId: invoice._id,
      details: { paymentAmount: payAmt, totalPaid: invoice.paidAmount, status: invoice.status },
    });

    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    next(err);
  }
};

