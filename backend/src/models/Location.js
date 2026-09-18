const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    unique: true,
    trim: true,
    uppercase: true
  }
}, {
  timestamps: true
});

// Index for faster queries
locationSchema.index({ name: 1 });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location; 