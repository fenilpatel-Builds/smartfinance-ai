import Asset from '../models/Asset.js';
import Liability from '../models/Liability.js';
import EquityRecord from '../models/EquityRecord.js';

// Assets
export const getAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find({ workspaceId: req.workspace._id }).sort({ valuationDate: -1 });
    res.json({ success: true, assets });
  } catch (err) {
    next(err);
  }
};

export const createAsset = async (req, res, next) => {
  try {
    const { name, assetType, amount, valuationDate, notes } = req.body;
    if (!name || !assetType || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Name, asset type and amount are required' });
    }

    const asset = await Asset.create({
      workspaceId: req.workspace._id,
      name,
      assetType,
      amount: parseFloat(amount),
      valuationDate: valuationDate ? new Date(valuationDate) : new Date(),
      notes: notes || '',
    });

    res.status(201).json({ success: true, asset });
  } catch (err) {
    next(err);
  }
};

export const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    await asset.deleteOne();
    res.json({ success: true, message: 'Asset removed' });
  } catch (err) {
    next(err);
  }
};

// Liabilities
export const getLiabilities = async (req, res, next) => {
  try {
    const liabilities = await Liability.find({ workspaceId: req.workspace._id }).sort({ dueDate: 1 });
    res.json({ success: true, liabilities });
  } catch (err) {
    next(err);
  }
};

export const createLiability = async (req, res, next) => {
  try {
    const { name, liabilityType, amount, dueDate, notes } = req.body;
    if (!name || !liabilityType || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Name, liability type and amount are required' });
    }

    const liability = await Liability.create({
      workspaceId: req.workspace._id,
      name,
      liabilityType,
      amount: parseFloat(amount),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes || '',
    });

    res.status(201).json({ success: true, liability });
  } catch (err) {
    next(err);
  }
};

export const deleteLiability = async (req, res, next) => {
  try {
    const liability = await Liability.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!liability) return res.status(404).json({ success: false, message: 'Liability not found' });
    await liability.deleteOne();
    res.json({ success: true, message: 'Liability removed' });
  } catch (err) {
    next(err);
  }
};

// Equity
export const getEquityRecords = async (req, res, next) => {
  try {
    const equity = await EquityRecord.find({ workspaceId: req.workspace._id }).sort({ effectiveDate: -1 });
    res.json({ success: true, equity });
  } catch (err) {
    next(err);
  }
};

export const createEquityRecord = async (req, res, next) => {
  try {
    const { name, equityType, amount, effectiveDate, notes } = req.body;
    if (!name || !equityType || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Name, equity type and amount are required' });
    }

    const record = await EquityRecord.create({
      workspaceId: req.workspace._id,
      name,
      equityType,
      amount: parseFloat(amount),
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      notes: notes || '',
    });

    res.status(201).json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

export const deleteEquityRecord = async (req, res, next) => {
  try {
    const record = await EquityRecord.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    await record.deleteOne();
    res.json({ success: true, message: 'Equity record removed' });
  } catch (err) {
    next(err);
  }
};

