const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateJWT } = require('../middleware/auth');

// All authenticated users can access dashboard
router.get('/', authenticateJWT, dashboardController.getDashboardData);

module.exports = router; 