const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    message: {
        type: String,
        required: [true, 'Please add a message'],
        maxlength: [1000, 'Message cannot be more than 1000 characters']
    },
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    // --- MODIFIED: Using the statuses you requested ---
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Completed'], // Updated statuses
        default: 'Pending',
    },
    adminResponse: {
        type: String,
        default: ''
    },
    isRead: {
        type: Boolean,
        default: false
    },
    repliedAt: Date,
    repliedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);