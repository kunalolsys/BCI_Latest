const Location = require('../models/Location');
const Venue = require('../models/Venue');

/**
 * @desc    Get all locations with their venues
 * @route   GET /api/master-data/locations
 * @access  Private (Setup permission required)
 */
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find()
      .select('name')
      .sort({ name: 1 });

    // Get venues for each location
    const locationsWithVenues = await Promise.all(
      locations.map(async (location) => {
        const venues = await Venue.find({ location: location._id })
          .select('name')
          .sort({ name: 1 });
        
        return {
          _id: location._id,
          name: location.name,
          venues: venues
        };
      })
    );

    res.json({ locations: locationsWithVenues });
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
};

/**
 * @desc    Update location name
 * @route   PUT /api/master-data/location/:name
 * @access  Private (Setup permission required)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { name } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ message: 'New name is required' });
    }

    const location = await Location.findOne({ name: name.toUpperCase() });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Check if new name already exists
    const existingLocation = await Location.findOne({ 
      name: newName.toUpperCase(),
      _id: { $ne: location._id }
    });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location with this name already exists' });
    }

    location.name = newName.toUpperCase();
    await location.save();

    res.json({ location });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

/**
 * @desc    Delete location and all its associated venues
 * @route   DELETE /api/master/location/:name
 * @access  Private (Setup permission required)
 */
exports.deleteLocation = async (req, res) => {
  try {
    const { name } = req.params;

    const location = await Location.findOne({ name: name.toUpperCase() });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Delete all venues associated with this location
    await Venue.deleteMany({ location: location._id });

    // Delete the location
    await location.deleteOne();

    res.json({ message: 'Location and all its venues deleted successfully' });
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ message: 'Failed to delete location' });
  }
};

/**
 * @desc    Update venue name
 * @route   PUT /api/master-data/venue/:id
 * @access  Private (Setup permission required)
 */
exports.updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ message: 'New name is required' });
    }

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    // Check if new name already exists in the same location
    const existingVenue = await Venue.findOne({
      name: newName,
      location: venue.location,
      _id: { $ne: venue._id }
    });
    if (existingVenue) {
      return res.status(400).json({ 
        message: 'Venue with this name already exists in this location' 
      });
    }

    venue.name = newName;
    await venue.save();

    res.json({ venue });
  } catch (err) {
    console.error('Error updating venue:', err);
    res.status(500).json({ message: 'Failed to update venue' });
  }
};

/**
 * @desc    Delete venue
 * @route   DELETE /api/master-data/venue/:id
 * @access  Private (Setup permission required)
 */
exports.deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    await venue.deleteOne();
    res.json({ message: 'Venue deleted successfully' });
  } catch (err) {
    console.error('Error deleting venue:', err);
    res.status(500).json({ message: 'Failed to delete venue' });
  }
};

/**
 * @desc    Create new location
 * @route   POST /api/master-data/location
 * @access  Private (Setup permission required)
 */
exports.createLocation = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Location name is required' });
    }

    // Check if location already exists
    const existingLocation = await Location.findOne({ name: name.toUpperCase() });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location with this name already exists' });
    }

    const location = new Location({
      name: name.toUpperCase()
    });

    await location.save();
    res.status(201).json({ location });
  } catch (err) {
    console.error('Error creating location:', err);
    res.status(500).json({ message: 'Failed to create location' });
  }
};

/**
 * @desc    Create new venue
 * @route   POST /api/master-data/venue
 * @access  Private (Setup permission required)
 */
exports.createVenue = async (req, res) => {
  try {
    const { name, locationName } = req.body;

    if (!name || !locationName) {
      return res.status(400).json({ message: 'Venue name and location name are required' });
    }

    // Find location
    const location = await Location.findOne({ name: locationName.toUpperCase() });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Check if venue already exists in this location
    const existingVenue = await Venue.findOne({
      name,
      location: location._id
    });
    if (existingVenue) {
      return res.status(400).json({ message: 'Venue with this name already exists in this location' });
    }

    const venue = new Venue({
      name,
      location: location._id
    });

    await venue.save();
    res.status(201).json({ venue });
  } catch (err) {
    console.error('Error creating venue:', err);
    res.status(500).json({ message: 'Failed to create venue' });
  }
};

/**
 * @desc    Get venues by location
 * @route   GET /api/master/locations/:location/venues
 * @access  Plan & Launch permission required
 */
exports.getVenuesByLocation = async (req, res) => {
  try {
    const { location } = req.params;

    // Find the location first
    const locationData = await Location.findOne({ name: location });
    if (!locationData) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Then find all venues for this location
    const venues = await Venue.find({ location: locationData._id })
      .select('name')
      .sort({ name: 1 });

    return res.status(200).json({
      venues: venues
    });
  } catch (err) {
    console.error('Error fetching venues:', err);
    return res.status(500).json({ message: 'Failed to fetch venues' });
  }
}; 