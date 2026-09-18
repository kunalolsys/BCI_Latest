const mongoose = require('mongoose');

const departmentalTemplateTaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    unique: true,
    index: true
  },
  workshopTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkshopTemplate',
    required: true
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
    type: String,
    trim: true
  }],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
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
  }
}, { timestamps: true });

// Auto-generate task ID in format WS-01-0001-D, WS-01-0002-D, etc.
departmentalTemplateTaskSchema.pre('save', async function(next) {
  if (this.isNew) {
    const workshopTemplate = await mongoose.model('WorkshopTemplate').findById(this.workshopTemplate);
    const templateNumber = workshopTemplate.templateId.split('-')[1];

    const lastTask = await this.constructor.findOne(
      { workshopTemplate: this.workshopTemplate },
      {},
      { sort: { taskId: -1 } }
    );

    // parseInt safely ignores the trailing 'D'
    const lastNumber = lastTask ? parseInt(lastTask.taskId.split('-')[2]) : 0;
    this.taskId = `WS-${templateNumber}-${String(lastNumber + 1).padStart(4, '0')}-D`;
  }
  next();
});

module.exports = mongoose.model('DepartmentalTemplateTask', departmentalTemplateTaskSchema);
