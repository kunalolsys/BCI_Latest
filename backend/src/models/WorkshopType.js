const mongoose = require('mongoose');

/**
 * WorkshopType Schema
 * Stores predefined types of workshops and their abbreviations.
 * These are used to categorize WorkshopTemplates.
 */
const workshopTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workshop type name is required.'],
    unique: true,
    trim: true,
    index: true,
    description: 'The full name of the workshop type (e.g., "Goal Setting Workshop").'
  },
  abbreviation: {
    type: String,
    required: [true, 'Workshop type abbreviation is required.'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
    description: 'A short abbreviation for the workshop type (e.g., "GSW").'
  },
  // Optional: Add a description field if needed in the future
  // description: {
  //   type: String,
  //   trim: true
  // },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Example of a pre-save hook if needed for validation or modification
// workshopTypeSchema.pre('save', function(next) {
//   // Your logic here
//   next();
// });

const WorkshopType = mongoose.model('WorkshopType', workshopTypeSchema);

module.exports = WorkshopType; 