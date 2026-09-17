/**
 * Admin Role & Granular Permission Middlewares
 * Strict RBAC protecting administrative operations
 */

/**
 * Ensures user is authenticated and holds an ADMIN or SUPER_ADMIN role with ACTIVE status.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No session found.',
      errorCode: 'UNAUTHORIZED',
    });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrative privileges required.',
      errorCode: 'FORBIDDEN',
    });
  }

  if (req.user.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: `Account is ${req.user.status.toLowerCase()}. Access denied.`,
      errorCode: 'ACCOUNT_INACTIVE',
    });
  }

  next();
};

/**
 * Checks for a specific granular administrative permission.
 * SUPER_ADMIN has automatic universal pass-through.
 * ADMIN accounts must hold the permission explicitly in user.permissions.
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    // Super Admin has unrestricted operational access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user.role === 'ADMIN') {
      const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
      if (userPermissions.includes(permissionKey)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: `Permission denied. Required permission: '${permissionKey}'.`,
      errorCode: 'PERMISSION_DENIED',
    });
  };
};

/**
 * Strictly limits route execution to SUPER_ADMIN accounts.
 * Used for admin provisioning, role assignments, and feature flag management.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      errorCode: 'UNAUTHORIZED',
    });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Super Administrators can perform this action.',
      errorCode: 'SUPER_ADMIN_REQUIRED',
    });
  }

  next();
};

module.exports = {
  requireAdmin,
  requirePermission,
  requireSuperAdmin,
};
