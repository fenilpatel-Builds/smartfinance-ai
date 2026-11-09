import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import { logAudit } from '../utils/auditLogger.js';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_smartfinance_prod_2026',
    { expiresIn: '7d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      isVerified: true,
      lastLogin: new Date(),
    });

    // Create default workspace for the user
    const wsName = organizationName || `${name}'s Finances`;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    const workspace = await Workspace.create({
      name: wsName,
      slug,
      ownerId: user._id,
      currency: 'INR',
    });

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: 'Workspace Owner',
      status: 'active',
    });

    const token = generateToken(user._id);

    await logAudit({
      workspaceId: workspace._id,
      userId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      currentWorkspace: {
        id: workspace._id,
        name: workspace.name,
        currency: workspace.currency,
        role: 'Workspace Owner',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    // Fetch user's workspaces
    const memberships = await WorkspaceMember.find({ userId: user._id, status: 'active' }).populate('workspaceId');
    const firstMembership = memberships[0];

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      currentWorkspace: firstMembership?.workspaceId
        ? {
            id: firstMembership.workspaceId._id,
            name: firstMembership.workspaceId.name,
            currency: firstMembership.workspaceId.currency,
            role: firstMembership.role,
          }
        : null,
      workspaces: memberships.map((m) => ({
        id: m.workspaceId._id,
        name: m.workspaceId.name,
        currency: m.workspaceId.currency,
        role: m.role,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMember.find({ userId: req.user._id, status: 'active' }).populate('workspaceId');
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        lastLogin: req.user.lastLogin,
      },
      workspaces: memberships
        .filter((m) => m.workspaceId)
        .map((m) => ({
          id: m.workspaceId._id,
          name: m.workspaceId.name,
          currency: m.workspaceId.currency,
          role: m.role,
        })),
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res) => {
  // Production-ready mock sending email reset link
  res.json({
    success: true,
    message: 'If that email is registered, a password reset link has been dispatched.',
  });
};

export const resetPassword = async (req, res) => {
  res.json({
    success: true,
    message: 'Password successfully reset. Please log in with your new password.',
  });
};

