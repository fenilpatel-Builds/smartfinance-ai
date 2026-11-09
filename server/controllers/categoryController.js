import Category from '../models/Category.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ workspaceId: req.workspace._id }).sort({ type: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, type, color, icon, parentCategoryId } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Category name and type are required' });
    }

    const category = await Category.create({
      workspaceId: req.workspace._id,
      name,
      type,
      color: color || '#6366f1',
      icon: icon || 'Tag',
      parentCategoryId: parentCategoryId || undefined,
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;
    const category = await Category.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name;
    if (type) category.type = type;
    if (color) category.color = color;
    if (icon) category.icon = icon;

    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      workspaceId: req.workspace._id,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category removed' });
  } catch (err) {
    next(err);
  }
};

