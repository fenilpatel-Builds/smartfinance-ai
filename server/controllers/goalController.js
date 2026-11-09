import Goal from '../models/Goal.js';
import { logAudit } from '../utils/auditLogger.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ workspaceId: req.workspace._id }).sort({ targetDate: 1 });

    const enrichedGoals = goals.map((goal) => {
      const g = goal.toObject();
      const progressPercent = g.targetAmount > 0 
        ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 1000) / 10) 
        : 0;
      
      const remainingAmount = Math.max(0, Math.round((g.targetAmount - g.currentAmount) * 100) / 100);
      
      let monthsRemaining = 0;
      if (g.targetDate) {
        const now = new Date();
        const target = new Date(g.targetDate);
        monthsRemaining = Math.max(1, Math.round((target - now) / (1000 * 60 * 60 * 24 * 30.4)));
      }
      
      const requiredMonthlySavings = monthsRemaining > 0 
        ? Math.round((remainingAmount / monthsRemaining) * 100) / 100 
        : remainingAmount;

      return {
        ...g,
        progressPercent,
        remainingAmount,
        monthsRemaining,
        requiredMonthlySavings,
      };
    });

    const totalTarget = Math.round(goals.reduce((acc, g) => acc + g.targetAmount, 0) * 100) / 100;
    const totalSaved = Math.round(goals.reduce((acc, g) => acc + g.currentAmount, 0) * 100) / 100;
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 1000) / 10 : 0;

    res.json({
      success: true,
      goals: enrichedGoals,
      metrics: {
        totalGoals: goals.length,
        activeGoals: goals.filter((g) => g.status === 'In Progress').length,
        completedGoals: goals.filter((g) => g.status === 'Completed').length,
        totalTarget,
        totalSaved,
        overallProgress,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount = 0, targetDate, monthlyContributionTarget, category, color, notes } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ success: false, message: 'Goal name and target amount are required' });
    }

    const goal = await Goal.create({
      workspaceId: req.workspace._id,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      monthlyContributionTarget: Number(monthlyContributionTarget) || 0,
      category: category || 'General',
      color: color || '#3b82f6',
      notes: notes || '',
    });

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'CREATE_GOAL',
      resourceType: 'Goal',
      resourceId: goal._id,
      details: { name: goal.name, targetAmount: goal.targetAmount },
    });

    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const { name, targetAmount, currentAmount, targetDate, monthlyContributionTarget, category, color, status, notes } = req.body;

    if (name) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined) goal.currentAmount = Number(currentAmount);
    if (targetDate) goal.targetDate = new Date(targetDate);
    if (monthlyContributionTarget !== undefined) goal.monthlyContributionTarget = Number(monthlyContributionTarget);
    if (category) goal.category = category;
    if (color) goal.color = color;
    if (notes !== undefined) goal.notes = notes;

    if (status) {
      goal.status = status;
    } else if (goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0) {
      goal.status = 'Completed';
    }

    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const contributeToGoal = async (req, res, next) => {
  try {
    const { amount, notes } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid contribution amount is required' });
    }

    const goal = await Goal.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.currentAmount = Math.round((goal.currentAmount + Number(amount)) * 100) / 100;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'Completed';
    }

    await goal.save();

    await logAudit({
      workspaceId: req.workspace._id,
      userId: req.user._id,
      action: 'CONTRIBUTE_GOAL',
      resourceType: 'Goal',
      resourceId: goal._id,
      details: { contribution: amount, newTotal: goal.currentAmount, notes },
    });

    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.json({ success: true, message: 'Goal removed successfully' });
  } catch (err) {
    next(err);
  }
};
