// routes/setup.js
// Setup panel routes (departments, roles, permissions, employees)
// Only accessible by users with 'Setup' permission

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizePermissions } = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');
const roleController = require('../controllers/roleController');
const employeeController = require('../controllers/employeeController');
const workshopTypeController = require('../controllers/workshopTypeController');


// Department routes (Setup Panel)
router.get('/departments',
  authenticateJWT,
  authorizePermissions(['Setup']),
  departmentController.getAllDepartments
);
router.get('/departments/all',authenticateJWT, departmentController.getDropdownDepartments);
router.post('/departments',
  authenticateJWT,
  authorizePermissions(['Setup']),
  departmentController.createDepartment
);

router.put('/departments/:id',
  authenticateJWT,
  authorizePermissions(['Setup']),
  departmentController.updateDepartment
);

router.delete('/departments/:id',
  authenticateJWT,
  authorizePermissions(['Setup']),
  departmentController.deleteDepartment
);

// Add this route for fetching all departments (no pagination)
router.get('/departments/all', departmentController.getAllDepartmentsSimple);

// Role routes (Setup Panel)
router.get('/roles',
  authenticateJWT,
  authorizePermissions(['Setup']),
  roleController.getAllRoles
);

router.post('/roles',
  authenticateJWT,
  authorizePermissions(['Setup']),
  roleController.createRole
);

router.put('/roles/:id',
  authenticateJWT,
  authorizePermissions(['Setup']),
  roleController.updateRole
);

// Bulk update permissions for multiple roles
router.put('/roles/bulk-permissions',
  authenticateJWT,
  authorizePermissions(['Setup']),
  roleController.bulkUpdateRolePermissions
);

router.delete('/roles/:id',
  authenticateJWT,
  authorizePermissions(['Setup']),
  roleController.deleteRole
);

// Employee routes (Setup Panel)
router.get('/employees',
  authenticateJWT,
  authorizePermissions(['Setup']),
  employeeController.getAllEmployees
);
router.get('/employees/doers',
  authenticateJWT,
  employeeController.getDoerEmployees
);

router.get('/employees/currentDetails',
  authenticateJWT,
  employeeController.getCurrentUserDetails
);

router.post('/employees',
  authenticateJWT,
  authorizePermissions(['Setup']),
  employeeController.createEmployee
);

router.put('/employees/:id',
  authenticateJWT,
  authorizePermissions(['Setup']),
  employeeController.updateEmployee
);

// Bulk toggle isActive for employees
router.put('/employees/bulk-active',
  authenticateJWT,
  authorizePermissions(['Setup']),
  employeeController.bulkToggleActive
);

// Reset employee password
router.put('/employees/:id/reset-password',
  authenticateJWT,
  authorizePermissions(['Setup']),
  employeeController.resetEmployeePassword
);

router.delete('/employees/:id',
  authenticateJWT,
  authorizePermissions(['Setup']),
  employeeController.deleteEmployee
);

// Add this route for fetching employees by role
router.get('/employees/by-role/:roleName',authenticateJWT, employeeController.getEmployeesByRole);

// Fetch all workshop types for templates
router.get('/templates/types',authenticateJWT, workshopTypeController.getAllWorkshopTypes);

// Add route to get current user's details
router.get('/employees/me', authenticateJWT, employeeController.getCurrentUserDetails);

module.exports = router;
