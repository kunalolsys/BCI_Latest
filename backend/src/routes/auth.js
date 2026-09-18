const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route
router.post('/login', authController.login);

// Password reset route (for first login)
router.post('/reset-password', authController.resetPassword);

// Logout route
router.post('/logout', authController.logout);

// Switch user route
router.post('/switch-user', authController.switchUser);

module.exports = router;
