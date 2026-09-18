// routes/workshop.js
// Workshop management routes
// Protected by authentication and permission-based access control

const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizePermissions } = require('../middleware/auth');
const workshopTemplateController = require('../controllers/workshopTemplateController');
const workshopController = require('../controllers/workshopController');
const doerController = require('../controllers/doerController');

// Workshop Template routes
router.get('/templates',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.getAllTemplates
);

// for plan page
router.get('/plan/templates',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopTemplateController.getAllTemplates
);



router.get('/templates/:id',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.getTemplateById
);



// for create workshop page
router.get('/plan/templates/:id',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopTemplateController.getTemplateById
);

router.post('/templates',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.createTemplate
);

router.put('/templates/:id',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.updateTemplate
);

router.delete('/templates/:id',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.deleteTemplate
);

// Task management routes
router.post('/templates/:id/tasks',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.addTask
);

router.put('/templates/:id/tasks/:taskId',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.updateTask
);

router.delete('/templates/:id/tasks/:taskId',
  authenticateJWT,
  authorizePermissions(['Workshop Template']),
  workshopTemplateController.deleteTask
);


router.put('/:id/tasks/:taskId/doer',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.updateTaskDoer
);

// Doer routes
router.get('/doers/:doerId/task-count',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  doerController.getDoerTaskCount
);

// Workshop Planning routes
router.post('/plan',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.initializeWorkshop
);

router.get('/',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.getWorkshops
);

//for workshop history page
router.get('/workshop-history',
  authenticateJWT,
  authorizePermissions(['Workshop History']),
  workshopController.getWorkshops
);

router.get('/:id',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.getWorkshop
);

// for viewing workshop history page
router.get('/workshop-history/:id',
  authenticateJWT,
  authorizePermissions(['Workshop History']),
  workshopController.getWorkshop
);

router.put('/:id',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.updateWorkshop
);

router.delete('/:id',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.deleteWorkshop
);

router.put('/:id/stop',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.stopWorkshop
);

router.put('/:id/complete',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  workshopController.completeWorkshop
);

// for getting doer task counts
router.get('/tasks/count/:doerId', 
  authenticateJWT,
  authorizePermissions(['Plan & Launch']), 
  workshopController.getDoerTaskCount
);

router.put('/:taskId/status',
  authenticateJWT,
  authorizePermissions(['Doer']),
  workshopController.markTaskCompleted
);

module.exports = router; 