import Invoice from '../models/Invoice.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Loan from '../models/Loan.js';

export const getFinancialCalendarEvents = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const { month, year } = req.query;

    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const targetMonth = parseInt(month, 10) !== undefined ? parseInt(month, 10) : new Date().getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const events = [];

    // 1. Invoices Due (Inflows)
    const invoices = await Invoice.find({
      workspaceId,
      dueDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['Sent', 'Partially Paid', 'Draft', 'Overdue'] },
    });

    invoices.forEach((inv) => {
      const balance = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
      events.push({
        id: `inv-${inv._id}`,
        title: `Receive: ${inv.customerName} (${inv.invoiceNumber})`,
        type: 'INVOICE_DUE',
        category: 'Inflow',
        date: inv.dueDate,
        amount: balance,
        status: inv.status,
        details: { invoiceId: inv._id, customerEmail: inv.customerEmail },
      });
    });

    // 2. Loan EMIs Due (Outflows)
    const loans = await Loan.find({ workspaceId, status: 'Active' });
    loans.forEach((loan) => {
      loan.amortizationSchedule.forEach((installment) => {
        const d = new Date(installment.dueDate);
        if (d >= startDate && d <= endDate) {
          events.push({
            id: `loan-${loan._id}-${installment.installmentNumber}`,
            title: `EMI: ${loan.loanName} (#${installment.installmentNumber})`,
            type: 'LOAN_EMI',
            category: 'Outflow',
            date: installment.dueDate,
            amount: installment.emi,
            status: installment.isPaid ? 'Paid' : 'Due',
            details: { loanId: loan._id, principal: installment.principal, interest: installment.interest },
          });
        }
      });
    });

    // 3. Recurring Payments & Subscriptions
    const recurring = await RecurringTransaction.find({ workspaceId, status: 'Active' });
    recurring.forEach((item) => {
      // Check if nextExpectedDate falls in window, or project based on monthly frequency
      const d = new Date(item.nextExpectedDate || startDate);
      if (d >= startDate && d <= endDate) {
        events.push({
          id: `rec-${item._id}`,
          title: `Bill: ${item.merchant} (${item.categoryName})`,
          type: 'RECURRING_BILL',
          category: 'Outflow',
          date: d,
          amount: item.expectedAmount,
          status: 'Scheduled',
          details: { recurringId: item._id, frequency: item.frequency },
        });
      }
    });

    // Sort by date ascending
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalInflow = events.filter((e) => e.category === 'Inflow').reduce((acc, e) => acc + e.amount, 0);
    const totalOutflow = events.filter((e) => e.category === 'Outflow').reduce((acc, e) => acc + e.amount, 0);

    res.json({
      success: true,
      events,
      metrics: {
        totalEvents: events.length,
        projectedInflows: Math.round(totalInflow * 100) / 100,
        projectedOutflows: Math.round(totalOutflow * 100) / 100,
        netCashDelta: Math.round((totalInflow - totalOutflow) * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
};
