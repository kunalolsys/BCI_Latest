// controllers/departmentController.js
// Controller for department management (Setup Panel)
// Uses projection to fetch only required fields

const Department = require("../models/Department");
const Employee = require("../models/Employee");

/**
 * @desc    Fetch all departments (paginated, minimal fields)
 * @route   GET /api/setup/departments
 * @access  Setup permission required
 */
exports.getAllDepartments = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    // Filter for non-deleted departments
    const query = { isDeleted: { $ne: true } };

    const total = await Department.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const departments = await Department.find(query, { _id: 1, name: 1 })
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return res
      .status(200)
      .json({ departments, page, limit, total, totalPages });
  } catch (err) {
    console.error("Error fetching departments:", err);
    return res.status(500).json({ message: "Failed to fetch departments" });
  }
};
exports.getDropdownDepartments = async (req, res) => {
  try {
    const departments = await Department.find(
      { isDeleted: { $ne: true } },
      { _id: 1, name: 1 },
    )
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ departments });
  } catch (err) {
    console.error("Error fetching dropdown departments:", err);
    return res.status(500).json({ message: "Failed to fetch departments" });
  }
};
/**
 * @desc    Create a new department
 * @route   POST /api/setup/departments
 * @access  Setup permission required
 */
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Department name is required" });
    }
    const department = await Department.create({ name: name.trim() });
    return res
      .status(201)
      .json({ department: { _id: department._id, name: department.name } });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Department name already exists" });
    }
    console.error("Error creating department:", err);
    return res.status(500).json({ message: "No special characters allowed." });
  }
};

/**
 * @desc    Update an existing department
 * @route   PUT /api/setup/departments/:id
 * @access  Setup permission required
 */
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Department name is required" });
    }
    const department = await Department.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true, projection: { _id: 1, name: 1 } },
    );
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    return res
      .status(200)
      .json({ department: { _id: department._id, name: department.name } });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Department name already exists" });
    }
    console.error("Error updating department:", err);
    return res.status(500).json({ message: "No special characters allowed." });
  }
};

/**
 * @desc    Delete a department (only if no employees are registered)
 * @route   DELETE /api/setup/departments/:id
 * @access  Setup permission required
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Check if department is already marked as deleted
    if (department.isDeleted) {
      return res.status(400).json({ message: "Department already deleted" });
    }

    // Check if any ACTIVE employees are registered with this department
    // We might allow "deletion" if employees associated are also "deleted" or inactive,
    // but for now, let's stick to the original logic: prevent delete if any employee (active or not) is linked.
    // Or, more aligned with soft delete: prevent if any non-soft-deleted employee is linked.
    const employeeCount = await Employee.countDocuments({
      departments: id,
      isDeleted: { $ne: true },
    });
    if (employeeCount > 0) {
      return res
        .status(400)
        .json({
          message: `${employeeCount} active employee(s) are registered with this department. Cannot be deleted.`,
        });
    }

    // Perform soft delete
    department.isDeleted = true;
    await department.save();

    return res
      .status(200)
      .json({ message: "Department marked as deleted successfully" });
  } catch (err) {
    console.error("Error soft deleting department:", err);
    return res
      .status(500)
      .json({ message: "Failed to soft delete department" });
  }
};

/**
 * Fetch all departments (no pagination, minimal fields)
 * GET /api/setup/departments/all
 * Returns: departments[]
 */
exports.getAllDepartmentsSimple = async (req, res) => {
  try {
    // Filter for non-deleted departments
    const departments = await Department.find(
      { isDeleted: { $ne: true } },
      { _id: 1, name: 1 },
    )
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ departments });
  } catch (err) {
    console.error("Error fetching all departments:", err);
    return res.status(500).json({ message: "Failed to fetch departments" });
  }
};
