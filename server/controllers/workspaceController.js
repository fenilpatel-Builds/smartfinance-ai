import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../utils/auditLogger.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, currency, timezone } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const workspace = await Workspace.create({
      name,
      slug,
      ownerId: req.user._id,
      currency: currency || 'INR',
      timezone: timezone || 'Asia/Kolkata',
    });

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: req.user._id,
      role: 'Workspace Owner',
      status: 'active',
    });

    await logAudit({
      workspaceId: workspace._id,
      userId: req.user._id,
      action: 'WORKSPACE_CREATED',
      entityType: 'Workspace',
      entityId: workspace._id,
    });

    res.status(201).json({ success: true, workspace });
  } catch (err) {
    next(err);
  }
};

export const getUserWorkspaces = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMember.find({ userId: req.user._id, status: 'active' })
      .populate('workspaceId');

    const workspaces = memberships
      .filter((m) => m.workspaceId)
      .map((m) => ({
        ...m.workspaceId.toObject(),
        role: m.role,
      }));

    res.json({ success: true, workspaces });
  } catch (err) {
    next(err);
  }
};

export const getCurrentWorkspace = async (req, res) => {
  res.json({
    success: true,
    workspace: req.workspace,
    role: req.memberRole,
  });
};

export const updateCurrentWorkspace = async (req, res, next) => {
  try {
    const { name, currency, timezone, settings } = req.body;
    const ws = req.workspace;

    if (name) ws.name = name;
    if (currency) ws.currency = currency;
    if (timezone) ws.timezone = timezone;
    if (settings) ws.settings = { ...ws.settings, ...settings };

    await ws.save();
    res.json({ success: true, workspace: ws });
  } catch (err) {
    next(err);
  }
};

export const getWorkspaceMembers = async (req, res, next) => {
  try {
    const members = await WorkspaceMember.find({ workspaceId: req.workspace._id })
      .populate('userId', 'name email avatar lastLogin');

    res.json({ success: true, members });
  } catch (err) {
    next(err);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Create provisional account
      user = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        passwordHash: 'PROVISIONAL_INVITE',
        isVerified: false,
      });
    }

    const existingMember = await WorkspaceMember.findOne({
      workspaceId: req.workspace._id,
      userId: user._id,
    });

    if (existingMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    const newMember = await WorkspaceMember.create({
      workspaceId: req.workspace._id,
      userId: user._id,
      role: role || 'Accountant',
      status: 'active',
    });

    res.status(201).json({ success: true, member: newMember });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await AuditLog.find({ workspaceId: req.workspace._id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};

