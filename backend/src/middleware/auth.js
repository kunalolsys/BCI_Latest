// middleware/auth.js
// Middleware for JWT authentication and role-based access control
// Uses httpOnly cookie (bciLoginToken) set by login controller
// Applies projection to fetch only required fields

const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Role = require('../models/Role');

/**
 * Middleware to authenticate user by JWT from httpOnly cookie
 * Adds req.user = { _id, name, email, role: { name, permissions } }
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies?.bciLoginToken;
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user with role (projection: only required fields)
    const employee = await Employee.findById(decoded.id)
      .select('_id name email role isActive')
      .populate({
        path: 'role',
        select: 'name permissions',
        model: Role
      });
    if (!employee || !employee.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    req.user = {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: {
        name: employee.role?.name,
        permissions: employee.role?.permissions || []
      }
    };
    next();
  } catch (err) {
    console.error('JWT Auth error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware factory for role/permission-based access
 * Usage: authorizeRoles(['Admin', 'MD']) or authorizePermissions(['Setup', 'Doer'])
 */
const authorizeRoles = (roles = []) => (req, res, next) => {
  if (!req.user || !req.user.role?.name || !roles.includes(req.user.role.name)) {
    return res.status(403).json({ message: 'Access denied: insufficient role' });
  }
  next();
};

const authorizePermissions = (permissions = []) => (req, res, next) => {
  if (!req.user || !req.user.role?.permissions) {
    return res.status(403).json({ message: 'Access denied: no permissions' });
  }
  const hasPermission = req.user.role.permissions.some(p => permissions.includes(p));
  if (!hasPermission) {
    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  }
  next();
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
  authorizePermissions
};
