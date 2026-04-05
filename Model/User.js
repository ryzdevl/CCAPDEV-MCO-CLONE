const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }, 
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: '/assets/defaultuser.png' 
    },
    coverPic: {
        type: String,
        default: '/assets/defaultcover.jpg'
    },
    bio: {
        type: String,
        maxlength: 160
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    gallery: [{
        path: { type: String },   
        title: { type: String, default: 'Untitled' }  
    }],
    tags: [{
        type: String,
        trim: true
    }],
    location: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    contactLinks: [{
        platform: { type: String },
        url: { type: String }
    }],
    // stats!!!
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'          
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }]
}, { timestamps: true }); 

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return; // skip if password unchanged
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (plainText) {
    return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model('User', UserSchema);
