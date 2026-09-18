const mongoose = require('mongoose');

const workshopTaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    unique: true,
    index: true
  },
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  workshopTemplateTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkshopTemplateTask',
    default: null
  },
  departmentalTemplateTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DepartmentalTemplateTask',
    default: null
  },
  escalationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escalation',
    default: null
  },
  narration: {
    type: String,
    required: true,
    trim: true
  },
  isCritical: {
    type: Boolean,
    default: false
  },
  checklist: [{
    item: {
      type: String,
      trim: true
    },
    checked: {
      type: Boolean,
      default: false
    }
  }],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  doer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['Daily', 'From Announcement Date', 'T+X', 'T-X', 'Event Date']
  },
  duration: {
    type: Number,
    required: function() {
      return ['From Announcement Date', 'T+X', 'T-X'].includes(this.frequency);
    },
    validate: {
      validator: function(value) {
        if (['Daily', 'Event Date'].includes(this.frequency)) {
          return value === null || value === undefined;
        }
        return value > 0;
      },
      message: 'Duration is not applicable for Daily and Event Date frequencies'
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Delayed', 'Cancelled'],
    default: 'Pending'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  actualEndDate: {
    type: Date
  },
  completedOn: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  documents: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  NARemark: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Auto-generate task ID in format workshopID-T-01, workshopID-T-02, etc.
// workshopTaskSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     const workshop = await mongoose.model('Workshop').findById(this.workshop);
    
//     const lastTask = await this.constructor.findOne(
//       { workshop: this.workshop },
//       {},
//       { sort: { taskId: -1 } }
//     );
    
//     const lastNumber = lastTask ? parseInt(lastTask.taskId.split('-').pop()) : 0;
//     this.taskId = `${workshop.workshopId}-T-${String(lastNumber + 1).padStart(2, '0')}`;
//   }
//   next();
// });

module.exports = mongoose.model('WorkshopTask', workshopTaskSchema); 