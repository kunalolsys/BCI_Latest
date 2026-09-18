const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const {
    getEscalationByTaskId,
    getTaskContacts,
    createEscalation,
    updateEscalation
} = require('../controllers/escalationController');

// Apply JWT authentication to all routes
router.use(authenticateJWT);

// Get escalation by task ID
router.get('/task/:taskId', authorizeRoles(['PC', 'MD', 'EA', 'Doer']), getEscalationByTaskId);

// Get MDs and EA for a task
router.get('/task/:taskId/contacts', authorizeRoles(['MD', 'EA','PC']), getTaskContacts);

// Create new escalation
router.post('/', authorizeRoles(['MD', 'EA','PC']), createEscalation);

// Update escalation
router.put('/:id', authorizeRoles(['MD', 'EA','PC']), updateEscalation);

module.exports = router; 