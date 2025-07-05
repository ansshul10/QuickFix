// quickfix-website/server/models/NewsletterSubscriber.js
const mongoose = require('mongoose');

const NewsletterSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    active: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals are included when converting to JSON
    toObject: { virtuals: true } // Ensure virtuals are included when converting to object
});

// Define a virtual to link to the User model based on email
// This will allow us to 'populate' user data when fetching newsletter subscribers
NewsletterSubscriberSchema.virtual('userAccount', {
    ref: 'User',
    localField: 'email',
    foreignField: 'email',
    justOne: true // A newsletter subscriber email should map to at most one user account
});

module.exports = mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema);