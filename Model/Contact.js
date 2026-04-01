const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, 
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contactDate: {
        type: Date,
        default: Date.now
    },
    contactPurpose: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Contact', ContactSchema);