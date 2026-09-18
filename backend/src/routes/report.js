const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizePermissions } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Generate FMS Performance Report
router.post('/fms-performance',
  authenticateJWT,
  authorizePermissions(['EA', 'PC', 'MD', 'Doer']),
  reportController.generateFMSPerformanceReport
);

module.exports = router;