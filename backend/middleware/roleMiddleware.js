/**
 * Admin role authorization middleware.
 * Verifies that the authenticated user possesses the 'admin' role.
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin authorization required.',
    });
  }

  next();
};

/**
 * Role-based authorization middleware factory for flexible access control.
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.',
      });
    }

    next();
  };
};

module.exports = isAdmin;
module.exports.isAdmin = isAdmin;
module.exports.authorize = authorize;
module.exports.adminOnly = isAdmin;
