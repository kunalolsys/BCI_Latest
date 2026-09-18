// controllers/employeeController.js
// Controller for employee management (Setup Panel)
// All functions use projection to fetch only required fields
const bcrypt = require('bcrypt');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Role = require('../models/Role');
const Workshop = require('../models/Workshop');
const WorkshopTask = require('../models/WorkshopTask');
// const sendEmail = require('../services/sendMail');

/**
 * Fetch all employees (paginated, minimal fields)
 * GET /api/setup/employees
 * Access: Setup permission required
 * Query: page, limit, search, department, role, isActive
 * Returns: employees[], page, limit, total, totalPages
 */
exports.getAllEmployees = async (req, res) => {
  try {
    let { page = 1, limit = 10, search, department, role, isActive } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    
    // Find the Admin role (superadmin)
    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@bci.com';
    const filter = {
      email: { $ne: adminEmail },
      isDeleted: { $ne: true },
    };

    // Add search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { masterEmail: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Add department filter
    if (department && department !== 'all') {
      filter.departments = department;
    }

    // Add role filter
    if (role && role !== 'all') {
      filter.role = role;
    }

    // Add active status filter
    if (isActive !== undefined && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    const total = await Employee.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    
    // Fetch employees with populated role and departments, excluding superadmin
    const employees = await Employee.find(filter, {
      _id: 1,
      name: 1,
      email: 1,
      masterEmail: 1,
      phone: 1,
      isActive: 1,
      departments: 1,
      role: 1,
      createdAt: 1,
      updatedAt: 1,
    })
      .populate('departments', 'name _id')
      .populate('role', 'name _id')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return res.status(200).json({ employees, page, limit, total, totalPages });
  } catch (err) {
    console.error('Error fetching employees:', err);
    return res.status(500).json({ message: 'Failed to fetch employees' });
  }
};
exports.getDoerEmployees = async (req, res) => {
  try {
    // 1. Doer, PC, aur EA Roles ki IDs find karein
    const targetRoles = await Role.find({
      name: { $in: [/^doer$/i, /^pc$/i, /^process coordinator$/i, /^ea$/i, /^executive assistant$/i] }
    }).select('_id name').lean();

    if (!targetRoles.length) {
      return res.status(200).json({ doers: [], pcs: [], eas: [] });
    }

    const roleIds = targetRoles.map(r => r._id);
    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@bci.com';

    // 2. Base Filter
    const filter = {
      email: { $ne: adminEmail },
      isDeleted: { $ne: true },
      isActive: true,
      role: { $in: roleIds }
    };

    // 3. Fetch Employees
    const employees = await Employee.find(filter, { _id: 1, name: 1, role: 1 })
      .populate('role', 'name _id')
      .sort({ name: 1 })
      .lean();

    // 4. Categorize by Role
    const doers = [];
    const pcs = [];
    const eas = [];

    employees.forEach(emp => {
      const roleName = emp.role?.name?.toLowerCase() || '';
      const formattedEmp = { _id: emp._id, name: emp.name };

      if (roleName.includes('doer')) {
        doers.push(formattedEmp);
      } else if (roleName.includes('pc') || roleName.includes('process coordinator')) {
        pcs.push(formattedEmp);
      } else if (roleName.includes('ea') || roleName.includes('executive assistant')) {
        eas.push(formattedEmp);
      }
    });

    return res.status(200).json({ doers, pcs, eas });
  } catch (err) {
    console.error('Error fetching dropdown employees:', err);
    return res.status(500).json({ message: 'Failed to fetch dropdown employees' });
  }
};
/**
 * Edit an employee (cannot edit email or password)
 * PUT /api/setup/employees/:id
 * Access: Setup permission required
 * Body: { name?, phone?, isActive?, departments?, role? }
 * Returns: updated employee object
 */
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, isActive, departments, role } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (isActive !== undefined) update.isActive = isActive;
    if (departments !== undefined) {
      if (!Array.isArray(departments) || !departments.length) {
        return res
          .status(400)
          .json({ message: 'Departments must be a non-empty array' });
      }
      update.departments = departments;
    }
    if (role !== undefined) update.role = role;
    // Email and password cannot be edited here
    const employee = await Employee.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      projection: {
        _id: 1,
        name: 1,
        email: 1,
        masterEmail: 1,
        phone: 1,
        isActive: 1,
        departments: 1,
        role: 1,
      },
    })
      .populate('departments', 'name _id')
      .populate('role', 'name _id');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.status(200).json({ employee });
  } catch (err) {
    // Handle duplicate phone error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.phone) {
      return res.status(409).json({ message: 'Phone number already exists' });
    }
    console.error('Error updating employee:', err);
    return res.status(500).json({ message: 'Failed to update employee' });
  }
};

/**
 * Create a new employee
 * POST /api/setup/employees
 * Access: Setup permission required
 * Body: { name, email, phone, departments, role, isActive? }
 * Returns: created employee object
 */
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, masterEmail, phone, departments, role, isActive } =
      req.body;
    if (
      !name ||
      !email ||
      !masterEmail ||
      !phone ||
      !Array.isArray(departments) ||
      !departments.length ||
      !role
    ) {
      return res.status(400).json({
        message:
          'Name, User ID, Master Email, phone, departments (array), and role are required',
      });
    }
    // Email and phone must be unique, handled by schema
    const employee = await Employee.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      masterEmail: masterEmail.trim().toLowerCase(),
      phone: phone.trim(),
      departments,
      role,
      isActive: isActive === true ? true : false, // Default false unless explicitly set true
      isFirstLogin: true, // default
    });
    // Return with projection and populated fields
    const populated = await Employee.findById(employee._id, {
      _id: 1,
      name: 1,
      email: 1,
      masterEmail: 1,
      phone: 1,
      isActive: 1,
      departments: 1,
      role: 1,
    })
      .populate('departments', 'name _id')
      .populate('role', 'name _id');

    // Send email to master email with a link to set the password
    // sendEmail(masterEmail, 'Welcome to BCI - Please set your password', 'welcome', {
    //   name: name,
    //   role: populated.role.name,
    //   loginUrl: `${process.env.FRONTEND_URL}/login`,
    //   email: email,
    //   password: phone
    // });

    return res.status(201).json({ employee: populated });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(409).json({ message: 'User ID already exists' });
    }
    if (err.code === 11000 && err.keyPattern && err.keyPattern.phone) {
      return res.status(409).json({ message: 'Phone number already exists' });
    }
    console.error('Error creating employee:', err);
    return res.status(500).json({ message: 'Failed to create employee' });
  }
};

/**
 * Bulk toggle isActive for multiple employees
 * PUT /api/setup/employees/bulk-active
 * Access: Setup permission required
 * Body: [ { id, isActive } ]
 * Returns: results[] (success/error for each employee)
 */
exports.bulkToggleActive = async (req, res) => {
  try {
    const updates = Array.isArray(req.body) ? req.body : [];
    if (!updates.length) {
      return res
        .status(400)
        .json({ message: 'No employees provided for update' });
    }
    const results = await Promise.all(
      updates.map(async ({ id, isActive }) => {
        if (!id || typeof isActive !== 'boolean') {
          return { id, success: false, error: 'Invalid id or isActive' };
        }
        try {
          const employee = await Employee.findByIdAndUpdate(
            id,
            { isActive },
            {
              new: true,
              projection: {
                _id: 1,
                name: 1,
                email: 1,
                masterEmail: 1,
                phone: 1,
                isActive: 1,
              },
            }
          );
          if (!employee)
            return { id, success: false, error: 'Employee not found' };
          return { id, success: true, employee };
        } catch (err) {
          return { id, success: false, error: err.message };
        }
      })
    );
    return res.status(200).json({ results });
  } catch (err) {
    console.error('Error bulk toggling employees:', err);
    return res.status(500).json({ message: 'Failed to bulk toggle employees' });
  }
};

/**
 * Reset an employee's password
 * PUT /api/setup/employees/:id/reset-password
 * Access: Setup permission required
 * Body: { password }
 * Returns: success message
 */
exports.resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res
        .status(400)
        .json({ message: 'A valid new password is required (min 4 chars)' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const updated = await Employee.findByIdAndUpdate(
      id,
      { password: hashed, isFirstLogin: true },
      { new: true, projection: { _id: 1, name: 1, email: 1, masterEmail: 1 } }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Send email to master email with the new credentials
    // sendEmail(updated.masterEmail, 'Password Reset - BCI', 'password-reset', {
    //   name: updated.name,
    //   loginUrl: `${process.env.FRONTEND_URL}/login`,
    //   email: updated.email,
    //   password: password
    // });

    return res.status(200).json({
      message:
        'Password reset successfully. Employee will need to set new password on next login.',
    });
  } catch (err) {
    console.error('Error resetting employee password:', err);
    return res
      .status(500)
      .json({ message: 'Failed to reset employee password' });
  }
};

/**
 * Delete an employee
 * DELETE /api/setup/employees/:id
 * Access: Setup permission required
 * Returns: success message or error
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.isDeleted) {
      return res.status(400).json({ message: 'Employee already deleted' });
    }

    // Prevent deletion of superadmin - this should be based on email or a specific role flag if possible
    // For now, assuming superadmin is identified by a specific email in .env
    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@bci.com';
    if (employee.email === adminEmail) {
      return res
        .status(403)
        .json({ message: 'Cannot delete the primary admin account.' });
    }

    // --- Prevent deletion if employee is linked to an "Upcoming" or "Ongoing" workshop ---
    // 1. As Process Coordinator (PC) or Executive Assistant (EA)
    const linkedWorkshop = await Workshop.findOne({
      $or: [{ processCoordinator: id }, { executiveAssistant: id }],
      status: { $in: ['Upcoming', 'Ongoing'] },
    });
    if (linkedWorkshop) {
      return res.status(400).json({
        message:
          'Employee cannot be deleted: linked as PC or EA to a workshop with Upcoming or Ongoing status.',
      });
    }

    // 2. As Doer in any WorkshopTask with status 'Pending' (workshop status does not matter)
    const pendingDoerTask = await WorkshopTask.findOne({
      doer: id,
      status: 'Pending',
    });
    if (pendingDoerTask) {
      return res.status(400).json({
        message:
          'Employee cannot be deleted: assigned as Doer to a task with Pending status.',
      });
    }
    // --- End check ---

    // Perform soft delete
    employee.isDeleted = true;
    // Optionally, you might want to deactivate the employee as well if isDeleted is true
    employee.isActive = false;
    await employee.save();

    return res
      .status(200)
      .json({ message: 'Employee marked as deleted successfully' });
  } catch (err) {
    console.error('Error soft deleting employee:', err);
    return res.status(500).json({ message: 'Failed to soft delete employee' });
  }
};

/**
 * Fetch employees by role name (EA, PC, Doer)
 * GET /api/setup/employees/by-role/:roleName
 * Returns: employees[]
 */
exports.getEmployeesByRole = async (req, res) => {
  try {
    const { roleName } = req.params;
    if (!roleName) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Filter for non-deleted employees with this role
    const employees = await Employee.find(
      { role: role._id, isDeleted: { $ne: true } },
      {
        _id: 1,
        name: 1,
        email: 1,
        masterEmail: 1,
        phone: 1,
        isActive: 1,
        departments: 1,
        role: 1,
      }
    )
      .populate('departments', 'name _id')
      .populate('role', 'name _id')
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ employees });
  } catch (err) {
    console.error('Error fetching employees by role:', err);
    return res
      .status(500)
      .json({ message: 'Failed to fetch employees by role' });
  }
};

/**
 * Get current logged-in user's details
 * GET /api/setup/employees/me
 * Access: Authenticated user
 * Returns: employee object
 */
exports.getCurrentUserDetails = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const employee = await Employee.findById(userId, {
      _id: 1,
      name: 1,
      email: 1,
      masterEmail: 1,
      phone: 1,
      isActive: 1,
      departments: 1,
      role: 1,
    })
      .populate('departments', 'name _id')
      .populate('role', 'name _id')
      .lean();
    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ employee });
  } catch (err) {
    console.error('Error fetching current user details:', err);
    return res.status(500).json({ message: 'Failed to fetch user details' });
  }
};
