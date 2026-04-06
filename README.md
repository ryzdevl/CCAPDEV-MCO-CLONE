# Inkling: A Career Forum for Creatives
A CCAPDEV Machine Project

Inkling is a full-stack, MVC-structured social media web application built with Node.js, Express, and MongoDB.
It implements core concepts of API design, real-time notifications, media management, and session-based authentication. 

---

# Table of Contents

    A. Overview
    B. Requirements
    C. Roles
    D. Communication Model
    E. API Message Types
    F. Session Flow
    G. Post & Media Transmission
    H. Notification & Feedback System
    I. Media Handling
    J. Running the Program
    K. Error Handling & Edge Cases
    L. Files and Dependencies

---

# A. Overview

  I. Description

    Inkling is a REST-based social media platform that simulates real-world social networking behavior using a clean MVC architecture. It supports user authentication, live post feeds,media uploads, threaded replies, reactions, notifications, and content moderation. It is developed as a Forum-type Web Application made to aid creatives in finding and curating their own career opportunities with a community of like-minded individuals. With a forum centered around the creative industry, users are encouraged to strive for better opportunities and work on strengthening their portfolios; fostering camaraderie and healthy competition between one another. 

  II. Features

      a. Session-based user management (register, login, logout)
      b. Real-time post feed with text and media attachments
      c. Threaded replies and comment system
      d. Notification system for social interactions (likes, follows, replies, shares)
      e. Packet-loss-equivalent: timestamp-tracked post delivery and error handling
      f. Multi-threaded server handling via Express middleware
      g. Browser-based interactive UI (dedicated page per feature)

---

# B. Requirements

  - **Runtime**: Node.js v18+
  - **Database**: MongoDB (local or Atlas)
  - **Media Storage**: Cloudinary account
  - **Dependencies** (install via `npm`):

      ```bash
      npm install
      ```

  - **Environment Variables** — create a `.env` file in the root:

    ```env
    MONGO_URI=your_mongodb_connection_string
    PORT=6767
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

---

# C. Roles

  I. Post Author / Action Initiator

    a. Initiates sessions via login or registration
    b. Creates, edits, and deletes posts
    c. Sends follow requests, reactions, and replies
    d. Can cancel or terminate actions (delete post, unfollow, logout)

  II. Viewing User / Recipient

    a. Waits for incoming notifications
    b. Responds to contact messages and follow requests
    c. Receives post feed and thread updates
    d. Sends feedback via reactions, reports, and contact messages

---

# D. Communication Model

  Three logical channels are used:

    a. Auth & Session Routes        (/api/users/login, /register, /logout)
    b. Post & Media Routes           (/api/posts, /api/users/:id/gallery-pic)
    c. Notification & Report Routes  (/api/notifications, /api/reports)

  The system uses MongoDB ObjectIDs and timestamps to ensure proper data handling and synchronization.

---

# E. API Message Types

| Message Type        | Direction          | Description                               |
|---------------------|--------------------|-------------------------------------------|
| POST /register      | Client → Server    | Creates a new user account                |
| POST /login         | Client → Server    | Initiates a user session (sets cookie)    |
| 200 OK              | Server → Client    | Confirms successful request               |
| POST /logout        | Client → Server    | Terminates the session (clears cookie)    |
| POST /posts         | Client → Feed      | Publishes a new post                      |
| DELETE /posts/:id   | Client → Server    | Removes a post                            |
| 401 Unauthorized    | Server → Client    | User is not authenticated                 |
| 403 Forbidden       | Server → Client    | User is not authorized for this action    |
| 404 Not Found       | Server → Client    | Requested resource does not exist         |
| 400 Bad Request     | Server → Client    | Invalid or missing input                  |
| 500 Server Error    | Server → Client    | Unhandled internal failure                |

---

# F. Session Flow

  I. Session Establishment (Login)

    a. Client sends POST /api/users/login with credentials
    b. Server verifies password via bcrypt
    c. Server sets HTTP-only cookie (userId, 7-day expiry)
    d. Client receives user data and navigates to feed
    e. Session Established

  II. Session Termination (Logout)

    a. Client sends POST /api/users/logout
    b. Server clears the userId cookie
    c. Session Ends

  III. Session Handling Cases

    a. Wrong credentials    → 401 Unauthorized
    b. Duplicate user       → 400 Bad Request
    c. Unauthenticated call → 401 (requireAuth middleware blocks the route)
    d. Account deletion     → Password confirmed → posts purged → social links removed → cookie cleared

---

# G. Post & Media Transmission

  Posts are used for real-time content transmission across the feed.

  I. Features

    a. Post construction with text content and media attachments
    b. Sequence-equivalent: posts sorted by createdAt timestamp
    c. Timestamp-based feed synchronization
    d. Ownership tracking: each post is uniquely tied to its author (userId)
    e. Up to 10 media attachments per post

  II. Post Structure

    a. user          → Author reference (ObjectId → User)
    b. content       → Text body of the post
    c. attachments   → Array of { filename, path, size, mimetype }
    d. updoots       → { up, down } reaction counts
    e. commentParent → Parent post reference (for threaded replies)
    f. isShared      → Whether this is a reshared post
    g. highlighted   → Star / highlight flag
    h. edited        → Whether the post was modified after creation

  III. Payload

    Media files (JPG, PNG, GIF, WEBP, MP4, MOV) stored on Cloudinary.
    Organized into folders:

      - inkling/posts     → Post attachments
      - inkling/profiles  → Profile pictures
      - inkling/covers    → Cover photos
      - inkling/gallery   → User gallery images

---

# H. Notification & Feedback System

  Notifications are used for social feedback only.

  I. Features

    a. Automatic notification creation on: like, dislike, share, follow, reply
    b. Unread badge count displayed on the bell icon
    c. Duplicate suppression (same sender + type + post = no duplicate)
    d. Read / unread state tracking per notification

  II. Feedback Includes

    a. Sender and recipient user references
    b. Notification type: like, dislike, share, follow, reply, highlight, mention
    c. Linked post reference (if applicable)
    d. Read status and creation timestamp

---

# I. Media Handling

    a. Uses Cloudinary + Multer for all media uploads and storage

    b. Supports multiple upload contexts:
        - Profile Picture Upload   (inkling/profiles)
        - Cover Photo Upload       (inkling/covers)
        - Post Attachments         (inkling/posts — up to 10 files per post)
        - Gallery Images           (inkling/gallery)

    c. Accepted formats:
        - Images : JPG, JPEG, PNG, GIF, WEBP
        - Video  : MP4, MOV

    d. System feedback events:
        - Incoming notification  → Bell badge increments
        - Post published         → Feed refreshes with new post
        - Upload complete        → UI confirmation rendered
        - Error / failed upload  → JSON error response with message

---

# J. Running the Program

  A. Running the Program Locally  

  1. Start the Server 
```bash
     node Server.js  
```

  2. Access the Application  
     Open your browser and go to:
```bash
     http://localhost:6767
```

  3. First-Time Setup

     a. Navigate to the Create Account page  
     b. Register with a unique username and email  
     c. Log in and begin using the feed  

  B. Using the Program on Web 
```bash
  https://ccapdev-mco-clone.onrender.com/LandingPage.html
```
---

# K. Error Handling & Edge Cases

    1.  Invalid credentials        → 401 Unauthorized, login rejected
    2.  Duplicate email/username   → 400 Bad Request on registration
    3.  Unauthenticated request    → 401 via requireAuth middleware
    4.  Post not found             → 404 Not Found
    5.  Unauthorized edit/delete   → 403 Forbidden (user ≠ post owner)
    6.  Re-sharing a shared post   → 400 Bad Request (blocked by design)
    7.  Self-follow attempt        → Rejected with descriptive error message
    8.  Gallery path validation    → Must start with /uploads/ or Cloudinary URL
    9.  Missing file on upload     → 400 Bad Request with error description
    10. MongoDB connection failure → Server logs error and halts startup

---

# L. Files and Dependencies

  I. Source Files

    1. Server.js              → Main Express app and all API route definitions
    2. Model/User.js          → User schema (auth, profile, gallery, social graph)
    3. Model/Post.js          → Post schema (content, attachments, reactions, threads)
    4. Model/Notification.js  → Notification schema (type, read status, references)
    5. Model/Report.js        → Report schema (severity, category, moderation status)
    6. Model/Contact.js       → Contact schema (user-to-user messaging)
    7. Controller/*.js        → Client-side page logic (one file per view)
    8. View/*.html / *.css    → Frontend pages and stylesheets
    9. assets/                → Static assets (default profile pic, icons, etc.)

  II. Dependencies

    ```json
    {
      "dependencies": {
        "bcrypt": "^6.0.0",
        "express": "^5.2.1",
        "mongoose": "^9.2.4",
        "multer": "^2.1.1",
        "nodemon": "^3.1.14",
        "path": "^0.12.7",
        "cookie-parser": "^1.4.7",
        "cloudinary": "^2.0.0",
        "multer-storage-cloudinary": "^4.0.0",
        "dotenv": "^16.0.0"
      },
      "scripts": {
        "start": "node Server.js"
      }
    }
    ```
