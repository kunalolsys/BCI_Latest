const mongoose = require('mongoose');

// Added 'Workshop History' for view-only access to completed workshops
const PERMISSIONS = ['Admin', 'Setup', 'Workshop Template', 'Plan & Launch', 'Doer', 'Workshop History'];
const FIXED_ROLES = [
  { name: 'Admin', canDelete: false },
  { name: 'MD', canDelete: false },
  { name: 'EA', canDelete: false },
  { name: 'PC', canDelete: false },
  { name: 'Doer', canDelete: false }
];

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  permissions: [{
    type: String,
    enum: PERMISSIONS
  }],
  canDelete: {
    type: Boolean,
    default: true // Custom roles can be deleted
  }
}, { timestamps: true });

// Middleware to ensure fixed roles can't be deleted
roleSchema.pre('save', function (next) {
  const fixed = FIXED_ROLES.find(r => r.name === this.name);
  if (fixed) this.canDelete = false;
  next();
});

module.exports = mongoose.model('Role', roleSchema);
