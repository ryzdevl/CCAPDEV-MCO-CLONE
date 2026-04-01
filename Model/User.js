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
    // i have no idea how to hash this yet need help w password hashing here pls ty
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: '/assets/defaultuser.png' // to be changed    
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
        path: { type: String },   // image file path
        title: { type: String, default: 'Untitled' }  //  image title
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
    // references to Post.js, needed for user posts n highlights
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }]
}, { timestamps: true }); // ✅ timestamps fixed here

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return; // skip if password unchanged
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (plainText) {
    return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model('User', UserSchema);
