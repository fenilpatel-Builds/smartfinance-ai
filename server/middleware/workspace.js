import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

export const requireWorkspace = async (req, res, next) => {
  const workspaceId =
    req.headers['x-workspace-id'] ||
    req.query.workspaceId ||
    req.body.workspaceId;

  if (!workspaceId) {
    // If not provided, fetch the user's primary/first active workspace
    const firstMembership = await WorkspaceMember.findOne({
      userId: req.user._id,
      status: 'active',
    }).populate('workspaceId');

    if (!firstMembership || !firstMembership.workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'No active workspace found for this user. Please create or select a workspace.',
      });
    }

    req.workspace = firstMembership.workspaceId;
    req.workspaceMember = firstMembership;
    req.memberRole = firstMembership.role;
    return next();
  }

  // Validate that the user belongs to the requested workspace
  const membership = await WorkspaceMember.findOne({
    workspaceId,
    userId: req.user._id,
    status: 'active',
  }).populate('workspaceId');

  if (!membership || !membership.workspaceId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You are not an active member of this financial workspace.',
    });
  }

  req.workspace = membership.workspaceId;
  req.workspaceMember = membership;
  req.memberRole = membership.role;
  next();
};

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.memberRole) {
      return res.status(403).json({
        success: false,
        message: 'Role permissions not established for this workspace.',
      });
    }

    if (
      req.memberRole === 'Super Admin' ||
      req.memberRole === 'Workspace Owner' ||
      allowedRoles.includes(req.memberRole)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: Action requires one of the following roles: ${allowedRoles.join(', ')}`,
    });
  };
};

export const attachWorkspace = requireWorkspace;

export const requireWorkspacePermission = (roleLevel = 'viewer') => {
  if (roleLevel === 'admin') {
    return requireRoles('Super Admin', 'Workspace Owner');
  }
  if (roleLevel === 'editor') {
    return requireRoles('Super Admin', 'Workspace Owner', 'Finance Manager', 'Accountant');
  }
  return (req, res, next) => next();
};


