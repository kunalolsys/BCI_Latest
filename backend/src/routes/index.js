// routes/index.js
// Central router for all API routes

const express = require('express');
const router = express.Router();

// Setup panel routes (protected)
const setupRoutes = require('./setup');
router.use('/setup', setupRoutes);

// Auth routes
const authRoutes = require('./auth');
router.use('/auth', authRoutes);

// Workshop routes
const workshopRoutes = require('./workshop');
router.use('/workshop', workshopRoutes);

// Tasks routes
const tasksRoutes = require('./tasks');
router.use('/tasks', tasksRoutes);

// Master Data routes
const masterRoutes = require('./master');
router.use('/master', masterRoutes);

// Document routes
const documentRoutes = require('./document');
router.use('/documents', documentRoutes);

// Escalation routes
const escalationRoutes = require('./escalation');
router.use('/escalations', escalationRoutes);

// Dashboard route
const dashboardRoutes = require('./dashboard');
router.use('/dashboard', dashboardRoutes);

// Notification routes
const notificationRoutes = require('./notificationRoutes');
router.use('/notifications', notificationRoutes);

// Report routes
const reportRoutes = require('./report');
router.use('/reports', reportRoutes);

module.exports = router;
