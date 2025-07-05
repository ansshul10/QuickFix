// quickfix-website/server/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { // If null, it's a global announcement for all users
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null // Can be null for global notifications
    },
    title: {
        type: String,
        required: [true, 'Notification must have a title']
    },
    message: {
        type: String,
        required: [true, 'Notification must have a message']
    },
    type: { // e.g., 'info', 'warning', 'success', 'error', 'system', 'guide_update', 'announcement'
        type: String,
        default: 'info'
    },
    read: {
        type: Boolean,
        default: false
    },
    link: String, // Optional link to related content (e.g., /guides/slug-name)
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);