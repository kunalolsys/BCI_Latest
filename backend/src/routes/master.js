const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizePermissions, authorizeRoles } = require('../middleware/auth');
const {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenuesByLocation
} = require('../controllers/locationController');
const holidayController = require("../controllers/holidayController");
const {
  getAllWorkshopTypes,
  createWorkshopType,
  updateWorkshopType,
  deleteWorkshopType
} = require('../controllers/workshopTypeController');

// Location routes
router.post('/location',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  createLocation
);

router.get('/locations', 
  authenticateJWT, 
  getAllLocations
);

router.put('/location/:name', 
  authenticateJWT, 
  authorizePermissions(['Admin','Setup']), 
  updateLocation
);

router.delete('/location/:name', 
  authenticateJWT, 
  authorizePermissions(['Admin','Setup']), 
  deleteLocation
);

// Venue routes
router.post('/venue',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  createVenue
);

router.put('/venue/:id', 
  authenticateJWT, 
  authorizePermissions(['Admin','Setup']), 
  updateVenue
);

router.delete('/venue/:id', 
  authenticateJWT, 
  authorizePermissions(['Admin','Setup']), 
  deleteVenue
);

router.get('/locations/:location/venues',
  authenticateJWT,
  authorizePermissions(['Plan & Launch']),
  getVenuesByLocation
);

// Holiday routes
router.get('/holidays',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  holidayController.getAllHolidays
);

router.post('/holiday',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  holidayController.createHoliday
);

router.put('/holiday/:id',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  holidayController.updateHoliday
);

router.delete('/holiday/:id',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  holidayController.deleteHoliday
);

// Workshop type routes
router.get('/workshop-types',
  authenticateJWT,
  getAllWorkshopTypes
);

router.post('/workshop-type',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  createWorkshopType
);

router.put('/workshop-type/:id',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  updateWorkshopType
);

router.delete('/workshop-type/:id',
  authenticateJWT,
  authorizePermissions(['Admin','Setup']),
  deleteWorkshopType
);

module.exports = router; 