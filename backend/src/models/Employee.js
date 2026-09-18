const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  srNo: {
    type: Number,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // refrenced as userID in the frontend
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true 
  },
  masterEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits.'
    }
  },
  password: {
    type: String,
    default: null,
    select: false // Do not return by default in queries
  },
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add partial unique index for 'email' where isDeleted is false
employeeSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Add partial unique index for 'phone' where isDeleted is false
// This assumes phone numbers should be unique among active employees.
// If phone numbers can be duplicated, this index should be removed or modified.
// employeeSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Auto-increment Sr. No (sequential)
employeeSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await this.constructor.findOne({}, {}, { sort: { srNo: -1 } });
    this.srNo = last && last.srNo ? last.srNo + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
