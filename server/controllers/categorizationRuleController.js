import CategorizationRule from '../models/CategorizationRule.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';

export const getCategorizationRules = async (req, res, next) => {
  try {
    const rules = await CategorizationRule.find({ workspaceId: req.workspace._id })
      .populate('targetCategoryId', 'name color icon')
      .sort({ priority: -1 });

    res.json({ success: true, rules });
  } catch (err) {
    next(err);
  }
};

export const createCategorizationRule = async (req, res, next) => {
  try {
    const { ruleName, matchingConditions, targetCategoryId, priority } = req.body;

    if (!ruleName || !matchingConditions || !targetCategoryId) {
      return res.status(400).json({ success: false, message: 'Missing rule definition fields' });
    }

    const category = await Category.findOne({ _id: targetCategoryId, workspaceId: req.workspace._id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Target category not found' });
    }

    const rule = await CategorizationRule.create({
      workspaceId: req.workspace._id,
      ruleName,
      matchingConditions,
      targetCategoryId,
      targetCategoryName: category.name,
      priority: priority || 10,
      isActive: true,
    });

    res.status(201).json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

export const updateCategorizationRule = async (req, res, next) => {
  try {
    const { ruleName, matchingConditions, targetCategoryId, priority, isActive } = req.body;
    const rule = await CategorizationRule.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    if (ruleName) rule.ruleName = ruleName;
    if (matchingConditions) rule.matchingConditions = matchingConditions;
    if (priority !== undefined) rule.priority = priority;
    if (isActive !== undefined) rule.isActive = isActive;

    if (targetCategoryId) {
      const category = await Category.findOne({ _id: targetCategoryId, workspaceId: req.workspace._id });
      if (category) {
        rule.targetCategoryId = category._id;
        rule.targetCategoryName = category.name;
      }
    }

    await rule.save();
    res.json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

export const deleteCategorizationRule = async (req, res, next) => {
  try {
    const rule = await CategorizationRule.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    await rule.deleteOne();
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    next(err);
  }
};

