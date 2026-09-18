// controllers/roleController.js
// Controller for role management (Setup Panel)
// All functions use projection to fetch only required fields

const Role = require('../models/Role');
const Employee = require('../models/Employee');

/**
 * Fetch all roles (paginated, minimal fields)
 * GET /api/setup/roles
 * Access: Setup permission required
 * Query: page, limit
 * Returns: roles[], page, limit, total, totalPages
 */
exports.getAllRoles = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    const total = await Role.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const roles = await Role.find({}, { _id: 1, name: 1, permissions: 1, canDelete: 1 })
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return res.status(200).json({ roles, page, limit, total, totalPages });
  } catch (err) {
    console.error('Error fetching roles:', err);
    return res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

/**
 * Create a new role
 * POST /api/setup/roles
 * Access: Setup permission required
 * Body: { name, permissions[] }
 * Returns: created role object
 */
exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ message: 'At least one permission is required' });
    }
    // Only allow valid permissions
    const validPermissions = Role.schema.path('permissions').caster.enumValues;
    const filteredPermissions = permissions.filter(p => validPermissions.includes(p));
    if (filteredPermissions.length === 0) {
      return res.status(400).json({ message: 'Invalid permissions specified' });
    }
    // Create role (name must be unique)
    const role = await Role.create({ name: name.trim(), permissions: filteredPermissions });
    return res.status(201).json({ role: { _id: role._id, name: role.name, permissions: role.permissions } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Role name already exists' });
    }
    console.error('Error creating role:', err);
    return res.status(500).json({ message: 'Failed to create role' });
  }
};


/**
 * Update a single role's name and/or permissions
 * PUT /api/setup/roles/:id
 * Access: Setup permission required
 * Body: { name?, permissions?[] }
 * Returns: updated role object
 */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;
    const update = {};
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Role name is required' });
      }
      update.name = name.trim();
    }
    if (permissions !== undefined) {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({ message: 'At least one permission is required' });
      }
      const validPermissions = Role.schema.path('permissions').caster.enumValues;
      const filteredPermissions = permissions.filter(p => validPermissions.includes(p));
      if (filteredPermissions.length === 0) {
        return res.status(400).json({ message: 'Invalid permissions specified' });
      }
      update.permissions = filteredPermissions;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    const role = await Role.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true, projection: { _id: 1, name: 1, permissions: 1, canDelete: 1 } }
    );
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    return res.status(200).json({ role });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Role name already exists' });
    }
    console.error('Error updating role:', err);
    return res.status(500).json({ message: 'Failed to update role' });
  }
};

/**
 * Bulk update permissions for multiple roles
 * PUT /api/setup/roles/bulk-permissions
 * Access: Setup permission required
 * Body: [ { id, permissions[] } ]
 * Returns: results[] (success/error for each role)
 */
exports.bulkUpdateRolePermissions = async (req, res) => {
  try {
    const updates = Array.isArray(req.body) ? req.body : [];
    if (!updates.length) {
      return res.status(400).json({ message: 'No roles provided for update' });
    }
    const validPermissions = Role.schema.path('permissions').caster.enumValues;
    const results = await Promise.all(updates.map(async ({ id, permissions }) => {
      if (!id || !Array.isArray(permissions) || !permissions.length) {
        return { id, success: false, error: 'Invalid id or permissions' };
      }
      const filteredPermissions = permissions.filter(p => validPermissions.includes(p));
      if (!filteredPermissions.length) {
        return { id, success: false, error: 'Invalid permissions specified' };
      }
      try {
        const role = await Role.findByIdAndUpdate(
          id,
          { permissions: filteredPermissions },
          { new: true, runValidators: true, projection: { _id: 1, name: 1, permissions: 1, canDelete: 1 } }
        );
        if (!role) return { id, success: false, error: 'Role not found' };
        return { id, success: true, role };
      } catch (err) {
        return { id, success: false, error: err.message };
      }
    }));
    return res.status(200).json({ results });
  } catch (err) {
    console.error('Error bulk updating roles:', err);
    return res.status(500).json({ message: 'Failed to bulk update roles' });
  }
};

/**
 * Delete a role (only if not associated with any employee)
 * DELETE /api/setup/roles/:id
 * Access: Setup permission required
 * Returns: success message or error
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeCount = await Employee.countDocuments({ role: id });
    if (employeeCount > 0) {
      return res.status(400).json({ message: `${employeeCount} employee(s) are registered with this role. Can't be deleted.` });
    }
    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    return res.status(500).json({ message: 'Failed to delete role' });
  }
};
