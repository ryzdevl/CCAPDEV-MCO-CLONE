const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, 
    reportDate: {
        type: Date,
        default: Date.now
    },
    severity: {
        type: String,
        enum: ['mild','moderate','severe'],
        required: true
    },
    category: {
        type: String,
        enum: ['profile-issue', 'bugs-and-glitches', 'issue-with-user', 'harassment'],
        required: true
    },
    harassmentSub:{
        type: String,
        enum: ['abuse','child-safety', 'privacy', 'illegal', 'sensitive', 'impersonation']
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Report', ReportSchema);