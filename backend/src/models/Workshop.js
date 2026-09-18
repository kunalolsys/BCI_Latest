const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  workshopId: {
    type: String,
    unique: true,
    index: true
  },
  // Reference to the template used to create this workshop
  workshopTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkshopTemplate',
    required: true
  },
  // Override fields for this specific workshop
  processCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    validate: {
      validator: async function(value) {
        const employee = await mongoose.model('Employee').findById(value).populate('role');
        return employee && employee.role && employee.role.name === 'PC';
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
        return employee && employee.role && employee.role.name === 'EA';
      },
      message: 'Selected employee must have EA role'
    }
  },
  // Workshop status
  status: {
    type: String,
    enum: ['Draft', 'Upcoming', 'Ongoing', 'Completed', 'Stopped'],
    default: 'Draft'
  },
  // Workshop dates
  announcementDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Allow past date if the document is not new AND announcementDate is not modified
        if (!this.isNew && !this.isModified('announcementDate')) {
          return true;
        }
        // For new documents or when announcementDate is being modified,
        // it must be today or in the future.
        // To avoid issues with exact timing, compare dates only (YYYY-MM-DD)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
        const valueDate = new Date(value);
        valueDate.setHours(0, 0, 0, 0); // Normalize value to the start of the day
        return valueDate >= today;
      },
      message: 'Announcement date cannot be in the past when creating or modifying it.'
    }
  },
  eventDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Validate that event date is after announcement date
        return value > this.announcementDate;
      },
      message: 'Event date must be after announcement date'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // Only validate if endDate is set
        if (!value) return true;
        // End date should be after announcement date
        return value >= this.announcementDate;
      },
      message: 'End date must be after announcement date'
    }
  },
  // Workshop type and location
  type: {
    type: String,
    required: true,
    enum: ['Online', 'Offline', 'Hybrid']
  },
  location: {
    type: String,
  },
  venue: {
    type: String
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [5, 'Code cannot exceed 5 characters'],
    validate: {
      validator: function(value) {
        if (value === null || value === undefined || value === '') return true;
        return /^[A-Z0-9]+$/.test(value);
      },
      message: 'Code must be alphanumeric'
    }
  }
}, { timestamps: true });

// Method to initialize workshop from template
workshopSchema.methods.initializeFromTemplate = async function() {
  const template = await mongoose.model('WorkshopTemplate').findById(this.workshopTemplate)
    .populate('processCoordinator executiveAssistant');
  
  if (!template) {
    throw new Error('Template not found');
  }

  // Copy template tasks
  const templateTasks = await mongoose.model('Task').find({ workshopTemplate: this.workshopTemplate })
    .populate('department doer');

  this.tasks = templateTasks.map(task => ({
    taskId: task.taskId,
    narration: task.narration,
    isCritical: task.isCritical,
    checklist: [...task.checklist],
    department: task.department,
    doer: task.doer,
    frequency: task.frequency,
    duration: task.duration
  }));

  // Set initial PC and EA from template
  this.processCoordinator = template.processCoordinator;
  this.executiveAssistant = template.executiveAssistant;
};

module.exports = mongoose.model('Workshop', workshopSchema); 