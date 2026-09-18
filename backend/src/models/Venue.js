const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location is required']
  }
}, {
  timestamps: true
});

// Compound index to ensure unique venue names within a location
venueSchema.index({ name: 1, location: 1 }, { unique: true });

// Pre-save middleware to ensure unique venue names within a location
venueSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isModified('location')) {
    const existingVenue = await this.constructor.findOne({
      name: this.name,
      location: this.location,
      _id: { $ne: this._id }
    });
    
    if (existingVenue) {
      throw new Error('Venue with this name already exists in this location');
    }
  }
  next();
});

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue; 