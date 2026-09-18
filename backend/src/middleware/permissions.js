/**
 * Middleware to check if user has a specific permission
 * @param {string} requiredPermission - The permission required to access the route
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      // Get user permissions from the request (set by auth middleware)
      const userPermissions = req.user.permissions || [];

      // Check if user has the required permission
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermission}`
        });
      }

      // User has the required permission, proceed to next middleware
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

module.exports = {
  checkPermission
}; 