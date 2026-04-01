const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: false,
        default: ''
    },
    attachments: [{
        filename: String,
        path: String,
        size: Number,
        mimetype: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    updoots: {
        up: { type: Number, default: 0 },
        down: { type: Number, default: 0 }
    },
    likedBy: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    }],
    dislikedBy: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
     commentParent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post', // every comment is basically its own post
        default: null
    },
    commentReply: {
        type: Boolean,
        default: false
    },
    commentCount: {
        type: Number,
        default: 0
    },
    shares: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    shareCount: {
        type: Number,
        default: 0
    },
    isShared: {
        type: Boolean,
        default: false
    },
    originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
     highlighted: {
        type: Boolean,
        default: false
    },
    starCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);