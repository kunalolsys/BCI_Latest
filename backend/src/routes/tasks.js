const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizePermissions } = require('../middleware/auth');
const tasksController = require('../controllers/tasksController');

// Get all tasks assigned to logged-in doer (with filters and pagination)
router.get('/my-tasks',
  authenticateJWT,
  authorizePermissions(['Doer']),
  tasksController.getMyTasks
);

// Get current (active/overdue) tasks
router.get('/current',
  authenticateJWT,
  authorizePermissions(['Doer']),
  tasksController.getCurrentTasks
);

// Get completed tasks
router.get('/completed',
  authenticateJWT,
  authorizePermissions(['Doer']),
  tasksController.getCompletedTasks
);

// Fetch unread notifications (for all authenticated users)
router.get('/unread-notifications', authenticateJWT, tasksController.fetchUnreadNotification);

// Mark a notification as read (for all authenticated users)
router.patch('/notification/:notificationId/read', authenticateJWT, tasksController.markNotificationRead);

// Get specific task details
router.get('/:taskId',
  authenticateJWT,
  authorizePermissions(['Doer']),
  tasksController.getTaskById
);

// Update task status and checklist
router.put('/:taskId',
  authenticateJWT,
  authorizePermissions(['Doer']),
  tasksController.updateTask
);

// Comment routes
router.post('/:taskId/comments', authenticateJWT, authorizePermissions(['Doer']), tasksController.addComment);
router.get('/:taskId/comments', authenticateJWT, authorizePermissions(['Doer']), tasksController.getTaskComments);



module.exports = router; 