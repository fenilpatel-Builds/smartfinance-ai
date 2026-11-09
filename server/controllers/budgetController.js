import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';

export const getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ workspaceId: req.workspace._id })
      .populate('categoryId', 'name color icon type')
      .sort({ createdAt: -1 });

    // Calculate actual spending for each budget within current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

    const budgetsWithSpend = await Promise.all(
      budgets.map(async (b) => {
        const cat = b.categoryId;
        if (!cat) return { ...b.toObject(), spent: 0, percentage: 0 };

        const spendResult = await Transaction.aggregate([
          {
            $match: {
              workspaceId: req.workspace._id,
              categoryId: cat._id,
              transactionType: 'debit',
              isInternalTransfer: false,
              transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, totalSpent: { $sum: '$debit' } } },
        ]);

        const spent = spendResult.length > 0 ? Math.round(spendResult[0].totalSpent * 100) / 100 : 0;
        const percentage = b.budgetAmount > 0 ? Math.round((spent / b.budgetAmount) * 100) : 0;

        return {
          ...b.toObject(),
          spent,
          remaining: Math.round((b.budgetAmount - spent) * 100) / 100,
          percentage,
          isExceeded: spent > b.budgetAmount,
        };
      })
    );

    res.json({ success: true, budgets: budgetsWithSpend });
  } catch (err) {
    next(err);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const { categoryId, budgetAmount, period, startDate, endDate } = req.body;

    if (!categoryId || !budgetAmount) {
      return res.status(400).json({ success: false, message: 'Category and budget amount are required' });
    }

    const budget = await Budget.create({
      workspaceId: req.workspace._id,
      categoryId,
      budgetAmount: parseFloat(budgetAmount),
      period: period || 'monthly',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.status(201).json({ success: true, budget });
  } catch (err) {
    next(err);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { budgetAmount, period, startDate, endDate } = req.body;
    const budget = await Budget.findOne({ _id: req.params.id, workspaceId: req.workspace._id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (budgetAmount !== undefined) budget.budgetAmount = parseFloat(budgetAmount);
    if (period) budget.period = period;
    if (startDate) budget.startDate = new Date(startDate);
    if (endDate) budget.endDate = new Date(endDate);

    await budget.save();
    res.json({ success: true, budget });
  } catch (err) {
    next(err);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    await budget.deleteOne();
    res.json({ success: true, message: 'Budget removed' });
  } catch (err) {
    next(err);
  }
};

