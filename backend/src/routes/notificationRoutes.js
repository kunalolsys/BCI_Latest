const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const { authorizePermissions, authenticateJWT } = require('../middleware/auth');
const { io, connectedUsers } = require('../server');

// Get all notifications for the logged-in user (with pagination, type, and read/unread filtering)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { type, read, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (type && type !== 'daily') filter.type = type;
    if (type === 'daily') filter.type = { $nin: ['comment', 'document', 'escalation'] };
    if (read === 'true') filter.read = true;
    if (read === 'false') filter.read = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      notifications,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
router.patch('/:id/read',authenticateJWT, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});


module.exports = router; 