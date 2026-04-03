const express = require('express');
const path = require('path'); 
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const Post = require('./Model/Post');
const User = require('./Model/User');
const Report = require('./Model/Report');
const Contact = require('./Model/Contact');
const db = mongoose.connection;
const webapp = express();
const port = 6767;
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:6767'
    : 'https://ccapdev-mco-clone.onrender.com/';

// these two lines will open everything in the View and assets folders
webapp.use(express.static(path.join(__dirname, 'View')));
webapp.use('/assets', express.static(path.join(__dirname, 'assets')));

// serve uploaded files from uploads folder
webapp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB connected");

    app.listen(process.env.PORT || 6767, () => {
        console.log("Server running");
    });

})
.catch(err => {
    console.error("MongoDB connection failed:", err);
});

db.once('open',() => {
    console.log("MongoDB connection successful")
})

webapp.use(express.json());
webapp.use(express.urlencoded({ extended: true}));

// FOR SAVING DATA:
/// File upload setup
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage }); // for file uploads 

// API ROUTING

// GET posts (omg nscom reference)
webapp.get('${API_BASE}/api/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user')
            .populate({
                path: 'originalPost',
                populate: { path: 'user' } 
            })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message});
    }
});

// CREATING posts
/// NOTE: this supports 10 file uploads!
webapp.post('${API_BASE}/api/posts', upload.array('attachments', 10), async (req, res) => {
    try {
        const { content, userId, parentPost } = req.body;
        
        const postData = {
            user: userId,
            content: content
        };

        // If this is a reply to another post
        if (parentPost && parentPost !== 'null' && parentPost !== 'undefined') {
            postData.commentParent = parentPost;
            postData.commentReply = true;
            
            // Increment parent's comment count
            const parent = await Post.findById(parentPost);
            if (parent) {
                parent.commentCount = (parent.commentCount || 0) + 1;
                await parent.save();
            }
        }

        if (req.files && req.files.length > 0) {
            postData.attachments = req.files.map(file => ({
                filename: file.originalname,
                path: `${API_BASE}/uploads/${file.filename}`,
                size: file.size,
                mimetype: file.mimetype
            }));
        }

        const newPost = await Post.create(postData);
        
        // Update user's posts array
        await User.findByIdAndUpdate(userId, {
            $push: { posts: newPost._id }
        });

        // Populate user data before sending response
        const populatedPost = await Post.findById(newPost._id).populate('user');

        res.status(201).json({ success: true, data: populatedPost });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single post
webapp.get('${API_BASE}/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('user');
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// UPDATE (EDIT) a post
webapp.put('${API_BASE}/api/posts/:id', upload.array('attachments', 5), async (req, res) => {
    try {
        const { content, userId, keepAttachments } = req.body;
        const postId = req.params.id;
        
        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Check if user owns the post
        if (post.user.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized to edit this post' });
        }
        
        // Update content
        post.content = content || post.content;
        
        // Handle attachments
        let keptPaths = [];
        if (keepAttachments) {
            keptPaths = JSON.parse(keepAttachments);
        }
        
        // Filter to keep only selected attachments
        if (post.attachments && post.attachments.length > 0) {
            post.attachments = post.attachments.filter(att => 
                keptPaths.includes(att.path)
            );
        }
        
        // Add new files if any
        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => ({
                filename: file.originalname,
                path: `/uploads/${file.filename}`,
                size: file.size,
                mimetype: file.mimetype
            }));
            post.attachments = [...post.attachments, ...newAttachments];
        }
        
        // Mark as edited
        post.edited = true;
        post.editedAt = new Date();
        
        await post.save();
        
        // Return updated post with populated user
        const updatedPost = await Post.findById(postId).populate('user');
        
        res.json({ success: true, data: updatedPost });
        
    } catch (error) {
        console.error('Edit post error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE a post
webapp.delete('${API_BASE}/api/posts/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        const postId = req.params.id;
        
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Only owner can delete
        if (post.user.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
        }
        
        // Delete attached files
        if (post.attachments && post.attachments.length > 0) {
            post.attachments.forEach(att => {
                const fullPath = path.join(__dirname, att.path);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            });
        }
        
        await Post.findByIdAndDelete(postId);
        
        // Remove from user's posts array
        await User.findByIdAndUpdate(userId, {
            $pull: { posts: postId }
        });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// TOGGLE HIGHLIGHT STATUS (for user's own posts only)
webapp.post('${API_BASE}/api/posts/:id/highlight', async (req, res) => {
    try {
        const { userId } = req.body;
        const postId = req.params.id;
                
        // Find the post
        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Check if this user owns the post
        if (post.user.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'You can only highlight your own posts' });
        }
        
        const wasHighlighted = post.highlighted;
    post.highlighted = !wasHighlighted;

    // Update starCount based on the CHANGE, not the new state
    if (wasHighlighted) {
        // WAS highlighted, now unhighlighting - decrement
        post.starCount = Math.max((post.starCount || 0) - 1, 0);
    } else {
        // WAS NOT highlighted, now highlighting - increment
        post.starCount = (post.starCount || 0) + 1;
    }
        
        await post.save();
        
        console.log('✅ After toggle:', { 
            highlighted: post.highlighted, 
            starCount: post.starCount 
        });
        
        res.json({ 
            success: true, 
            data: { 
                highlighted: post.highlighted,
                starCount: post.starCount,
                postId: post._id
            }
        });
        
    } catch (error) {
        console.error('💥 Error toggling highlight:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET HIGHLIGHTED POSTS for a specific user
webapp.get('${API_BASE}/api/users/:userId/highlights', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const highlightedPosts = await Post.find({ 
            user: userId, 
            highlighted: true 
        })
        .populate('user')
        .sort({ createdAt: -1 });
        
        res.json({ success: true, data: highlightedPosts });
        
    } catch (error) {
        console.error('Error fetching highlights:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// SHARE A POST
webapp.post('${API_BASE}/api/posts/:id/share', async (req, res) => {
    try {
        const { userId } = req.body;
        const originalPost = await Post.findById(req.params.id);

        if (!originalPost) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        // Block re-sharing a shared post
        if (originalPost.isShared) {
            return res.status(400).json({ success: false, error: 'Cannot re-share a shared post' });
        }

        // Check if user already shared this post
        if (originalPost.shares.includes(userId)) {
            return res.status(400).json({ success: false, error: 'You already shared this post' });
        }

        // Create the new shared post
        const sharedPost = await Post.create({
            user: userId,
            content: '',
            isShared: true,
            originalPost: originalPost._id
        });

        // Update original post share count
        await Post.findByIdAndUpdate(req.params.id, {
            $push: { shares: userId },
            $inc: { shareCount: 1 }
        });

        // Add to user's posts
        await User.findByIdAndUpdate(userId, {
            $push: { posts: sharedPost._id }
        });

        res.status(201).json({ success: true, data: sharedPost });

    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST a comment to a post (creates a new post but under the thread)
webapp.post('${API_BASE}/api/posts/:postId/reply', upload.array('attachments', 5), async (req, res) => {
    try {
        const { userId, content } = req.body;
        const parentPostId = req.params.postId;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, error: 'Reply cannot be empty' });
        }
        
        const parentPost = await Post.findById(parentPostId);
        if (!parentPost) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        const postData = {
            user: userId,
            content: content.trim(),
            commentParent: parentPostId,
            commentReply: true,
            createdAt: new Date()
        };
        
        // Handle attachments
        if (req.files && req.files.length > 0) {
            postData.attachments = req.files.map(file => ({
                filename: file.originalname,
                path: `/uploads/${file.filename}`,
                size: file.size,
                mimetype: file.mimetype
            }));
        }
        
        const newPost = await Post.create(postData);
        
        // Increment comment count on parent post
        parentPost.commentCount = (parentPost.commentCount || 0) + 1;
        await parentPost.save();
        
        const populatedPost = await Post.findById(newPost._id).populate('user', 'username displayName profilePic');
        
        res.json({ success: true, data: populatedPost });
        
    } catch (error) {
        console.error('Error posting reply:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET all replies for a post (comment thread)
webapp.get('${API_BASE}/api/posts/:postId/thread', async (req, res) => {
    try {
        const replies = await Post.find({ 
            commentParent: req.params.postId,
            commentReply: true
        })
        .populate('user', 'username displayName profilePic')
        .sort({ createdAt: 1 });
        
        res.json({ success: true, data: replies });
        
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== USER API ROUTES ==========

// CREATE new account (sign up)
webapp.post('${API_BASE}/api/users/register', async (req, res) => {
    const { email, password, birthday, username } = req.body;

    try {                
        // check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email: email }, { username: username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'User with this email or username already exists' 
            });
        }
        
        // Create new user // PLEASE ADD PASSWORD HASHING
        const newUser = new User({
            username: username,
            displayName: username, 
            email: email,
            password: password, // PLEASE ADD PASSWORD HASHING
            profilePic: "/assets/defaultuser.png",
            joinDate: new Date(),
            followers: [],
            following: [],
            posts: []
        });

        await newUser.save(); //hashing function
                
        res.status(201).json({ 
            success: true, 
            data: {
                _id: newUser._id,
                username: newUser.username,
                displayName: newUser.displayName,
                email: newUser.email
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// user login
webapp.post('${API_BASE}/api/users/login', async (req, res) => {
    const { username, password } = req.body;

    try {        
        // username
        const user = await User.findOne({ username: username });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }
        
        // Plain text password check (PLEASE MODIFY THIS WITH HASHING)
        // ref: NSSECU1 sql injection lab
        // not yet tested for sql injections *
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }
            
        res.json({ 
            success: true, 
            data: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                profilePic: user.profilePic
            }
        });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET user by ID and their posts (for loading user profile page)
webapp.get('${API_BASE}/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate({
            path: 'posts',
            populate: [
                { path: 'user' },
                {
                    path: 'originalPost',
                    populate: { path: 'user' } 
                }
            ],
            options: { sort: { createdAt: -1 } }
        });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// UPDATE user profile
webapp.put('${API_BASE}/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const updates = req.body;
        
        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.password;
        delete updates.posts;
        delete updates.followers;
        delete updates.following;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        ).select('-password'); // Don't return password
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        res.json({ 
            success: true, 
            data: updatedUser 
        });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// UPLOAD profile picture
const profilePicStorage = multer.diskStorage({
    destination: 'uploads/profiles/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const uploadProfilePic = multer({ 
    storage: profilePicStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

webapp.post('${API_BASE}/api/users/:userId/profile-pic', uploadProfilePic.single('profilePic'), async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        const profilePicPath = `/uploads/profiles/${req.file.filename}`;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: profilePicPath },
            { returnDocument: 'after' }
        ).select('-password');
        
        res.json({ 
            success: true, 
            data: updatedUser,
            profilePic: profilePicPath
        });
        
    } catch (error) {
        console.error('Error uploading profile pic:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// UPLOAD cover photo
const uploadCoverPic = multer({ 
    storage: multer.diskStorage({
        destination: 'uploads/covers/',
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, 'cover-' + uniqueSuffix + ext);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

webapp.post('${API_BASE}/api/users/:userId/cover-pic', uploadCoverPic.single('coverPic'), async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        const coverPicPath = `/uploads/covers/${req.file.filename}`;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { coverPic: coverPicPath },
            { returnDocument: 'after' }
        ).select('-password');
        
        res.json({ 
            success: true, 
            data: updatedUser,
            coverPic: coverPicPath
        });
        
    } catch (error) {
        console.error('Error uploading cover pic:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== Gallery Storage Upload Update =======
const galleryStorage = multer.diskStorage({
    destination: 'uploads/gallery/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploadGallery = multer({ 
    storage: galleryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// UPLOAD a gallery image
webapp.post('${API_BASE}/api/users/:id/gallery-pic', (req, res, next) => {
    uploadGallery.single('galleryPic')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        next();
    });
}, async (req, res) => {
    try {
        const filepath = `/uploads/gallery/${req.file.filename}`;
        const title = req.body.title || 'Untitled';

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $push: { gallery: { path: filepath, title: title } } },
            { returnDocument: 'after' }
        );

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        res.json({ success: true, galleryPic: filepath, title: title });
    } catch (error) {
        console.error('Gallery upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET gallery
webapp.get('${API_BASE}/api/users/:id/gallery', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, gallery: user.gallery });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE gallery image
webapp.delete('${API_BASE}/api/users/:id/gallery-pic', async (req, res) => {
    try {
        const { imgPath } = req.body;

        if (!imgPath.startsWith('/uploads/')) {
            return res.status(400).json({ success: false, error: 'Invalid file path' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $pull: { gallery: { path: imgPath } } },
            { returnDocument: 'after' }
        );

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        const fullPath = path.join(__dirname, imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        
        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// FOR USER CONTACTING (UserPage)
webapp.post('${API_BASE}/api/contact', async(req, res) => {
    try {
        const { userId, recipientId, contactPurpose, description } = req.body;

        const contactData = {
            userId: userId,
            recipientId: recipientId,
            contactPurpose: contactPurpose,
            description: description
        };

        const newContact = await Contact.create(contactData);

        res.status(201).json({
            success: true,
            data: newContact
        });
    } catch (error) {
        console.error('Error submitting contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
});

webapp.get('${API_BASE}/api/contact', async (req, res) => {
    try {
        // Get current user ID from query parameter
        const currentUserId = req.query.userId;
        
        if (!currentUserId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID required' 
            });
        }
        
        // Only get messages where current user is the recipient
        const contacts = await Contact.find({ 
            recipientId: currentUserId 
        })
        .populate('userId', 'username displayName profilePic')
        .sort({ contactDate: -1 });
        
        res.json({
            success: true,
            data: contacts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
});

// FOR SUBMITTING REPORTS (UserPage)
webapp.post('${API_BASE}/api/reports', async(req,res) => {
    try {
        const { reporterId, severity, category, harassmentSub, description } = req.body;
        const reportData = {
            reporter: reporterId,
            severity: severity,
            category: category,
            description: description
        }

        if(category === 'harassment' && harassmentSub) {
            reportData.harassmentSub = harassmentSub;
        }
        
        const newReport = await Report.create(reportData);

        res.status(201).json({
            success: true,
            data: newReport
        });

    } catch (error) {
        console.error('Error creating report: ', error);
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
});

// ========== SEARCH API (Users + Posts) ==========
webapp.get('${API_BASE}/api/search', async (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.json({
                success: true,
                data: {
                    users: [],
                    posts: []
                }
            });
        }

        const regex = new RegExp(query, 'i');

        // SEARCH USERS
        const users = await User.find({
            $or: [
                { username: regex },
                { displayName: regex },
                { bio: regex }
            ]
        }).select('-password').limit(10);

        // SEARCH POSTS
        const posts = await Post.find({
            $or: [
                { content: regex }
            ]
        })
        .populate('user')
        .sort({ createdAt: -1 })
        .limit(10);

        res.json({
            success: true,
            data: {
                users: users,
                posts: posts
            }
        });

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

webapp.post('${API_BASE}/api/users/:id/follow', async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.body.currentUserId;

        if(targetUserId === currentUserId){
            return res.json({success:false, message:"You can't follow yourself"});
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if(!currentUser || !targetUser){
            return res.json({success:false, message:"User not found"});
        }

        const alreadyFollowing = currentUser.following.includes(targetUserId);

        if(alreadyFollowing){
            currentUser.following.pull(targetUserId);
            targetUser.followers.pull(currentUserId);
        } else {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
        }

        await currentUser.save();
        await targetUser.save();

        res.json({
            success: true,
            following: !alreadyFollowing,
            followerCount: targetUser.followers.length,
            followingCount: currentUser.following.length
        });

    } catch(err){
        res.status(500).json({success:false,error:err.message});
    }
});

// GET followers or following of a user (full info)
webapp.get('${API_BASE}/api/users/:id/list/:type', async (req, res) => {
    try {
        const userId = req.params.id;
        const listType = req.params.type;

        if (!['followers', 'following'].includes(listType)) {
            return res.status(400).json({ success: false, error: 'Invalid list type' });
        }

        const user = await User.findById(userId)
            .populate({
                path: listType,
                select: 'username displayName profilePic'
            });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ 
            success: true, 
            users: user[listType] 
        });

    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST interaction (updoot, downdoot, star, etc.)
webapp.post('${API_BASE}/api/posts/:postId/interact', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { type, userId, active } = req.body;

        if (!type || !userId) {
            return res.status(400).json({ success: false, error: 'Missing type or userId' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

        if (!post.updoots) post.updoots = { up: 0, down: 0 };
        if (!post.likedBy) post.likedBy = [];
        if (!post.dislikedBy) post.dislikedBy = [];

        let newCount;

        switch(type) {
            case 'updoot':
                if (active) {
                    post.likedBy.push(userId);
                    post.updoots.up = (post.updoots.up || 0) + 1;
                    if (post.dislikedBy.includes(userId)) {
                        post.dislikedBy.pull(userId);
                        post.updoots.down = Math.max((post.updoots.down || 0) - 1, 0);
                    }
                } else {
                    post.likedBy.pull(userId);
                    post.updoots.up = Math.max((post.updoots.up || 0) - 1, 0);
                }
                newCount = post.updoots.up;
                break;

            case 'downdoot':
                if (active) {
                    post.dislikedBy.push(userId);
                    post.updoots.down = (post.updoots.down || 0) + 1;
                    if (post.likedBy.includes(userId)) {
                        post.likedBy.pull(userId);
                        post.updoots.up = Math.max((post.updoots.up || 0) - 1, 0);
                    }
                } else {
                    post.dislikedBy.pull(userId);
                    post.updoots.down = Math.max((post.updoots.down || 0) - 1, 0);
                }
                newCount = post.updoots.down;
                break;

            default:
                return res.status(400).json({ success: false, error: 'Invalid interaction type' });
        }

        await post.save();
        res.json({ success: true, data: { newCount } });

    } catch (error) {
        console.error('Interaction error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// FOR GENERAL PAGE HANDLING 
webapp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'View', 'Home-Page.html'));
});

// 404 handler
webapp.use((req, res) => {
    res.status(404);
    res.send('<h1>Error 404: Resource not found.</h1>');
});

webapp.listen(port, () => {
    console.log("App listening on port " + port);
});

// https://www.w3schools.com/nodejs/nodejs_filesystem.asp
// MAIN REFERENCE: https://www.youtube.com/watch?v=fyc-4YmgLu0 bless this man heart fr 
// INDIAN GUY TEACHING MONGODB: https://www.youtube.com/watch?v=JAzavlFwUdE
// FILE UPLOADS WITH MULTER (for post + user pfp n banner etc): https://www.youtube.com/watch?v=i8yxx6V9UdM
