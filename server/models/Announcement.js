// quickfix-website/server/models/Announcement.js
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Announcement must have a title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Announcement must have content'],
        maxlength: [1000, 'Content cannot exceed 1000 characters']
    },
    type: { // e.g., 'info', 'warning', 'urgent', 'new_feature', 'maintenance'
        type: String,
        enum: ['info', 'warning', 'urgent', 'new_feature', 'maintenance'],
        default: 'info'
    },
    startDate: { // When the announcement becomes active
        type: Date,
        default: Date.now
    },
    endDate: Date, // When the announcement stops being active (optional)
    isActive: { // Manually toggle visibility
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);