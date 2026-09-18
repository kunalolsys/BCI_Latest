const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    workshopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workshop',
        required: true
    },
    escalationChain: [{
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        raisedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        comment: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Index for faster queries
escalationSchema.index({ taskId: 1, workshopId: 1 });

const Escalation = mongoose.model('Escalation', escalationSchema);

module.exports = Escalation; 