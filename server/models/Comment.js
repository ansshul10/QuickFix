// quickfix-website/server/models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment cannot be empty'],
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    guide: {
        type: mongoose.Schema.ObjectId,
        ref: 'Guide',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent user from submitting multiple comments on the same guide (optional)
// CommentSchema.index({ user: 1, guide: 1 }, { unique: true });

module.exports = mongoose.model('Comment', CommentSchema);