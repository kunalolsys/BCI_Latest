const mongoose = require('mongoose');

const workshopTemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  workshopName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkshopType',
    required: [true, 'Workshop type is required.']
  },
  processCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    validate: {
      validator: async function(value) {
        const employee = await mongoose.model('Employee').findById(value).populate('role');
        return employee && employee.role.name === 'PC';
      },
      message: 'Selected employee must have PC role'
    }
  },
  executiveAssistant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    validate: {
      validator: async function(value) {
        const employee = await mongoose.model('Employee').findById(value).populate('role');
        return employee && employee.role.name === 'EA';
      },
      message: 'Selected employee must have EA role'
    }
  }
}, { timestamps: true });

// Auto-generate template ID in format TEMP-01, TEMP-02, etc.
workshopTemplateSchema.pre('save', async function(next) {
  if (this.isNew) {
    const last = await this.constructor.findOne({}, {}, { sort: { templateId: -1 } });
    const lastNumber = last ? parseInt(last.templateId.split('-')[1]) : 0;
    this.templateId = `TEMP-${String(lastNumber + 1).padStart(2, '0')}`;
  }
  next();
});

module.exports = mongoose.model('WorkshopTemplate', workshopTemplateSchema); 