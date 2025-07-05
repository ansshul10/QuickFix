// quickfix-website/server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profilePicture: {
        type: String,
        default: '/images/default-avatar.png'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isPremium: {
        type: Boolean,
        default: false,
        select: true
    },
    subscription: {
        type: mongoose.Schema.ObjectId,
        ref: 'Subscription',
        default: null
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    lastVerificationEmailSent: Date, // NEW FIELD: To track when the last verification email was sent <--- ADDED
    newsletterSubscriber: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true, // This automatically manages createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + parseInt(process.env.RESET_PASSWORD_EXPIRE, 10);
    return resetToken;
};

// Generate and hash email verification token
UserSchema.methods.getEmailVerificationToken = function () {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    // Set expiry using environment variable, default to 24 hours
    this.emailVerificationExpires = Date.now() + (parseInt(process.env.EMAIL_VERIFICATION_EXPIRE_HOURS || 24) * 60 * 60 * 1000);

    logger.debug(`[DEBUG] getEmailVerificationToken: Unhashed Token (for URL): ${verificationToken}`);
    logger.debug(`[DEBUG] getEmailVerificationToken: Hashed Token (stored in DB): ${this.emailVerificationToken}`);
    logger.debug(`[DEBUG] getEmailVerificationToken: Expires At: ${new Date(this.emailVerificationExpires).toISOString()}`);
    logger.debug(`[DEBUG] getEmailVerificationToken: Current Time (when generated): ${new Date(Date.now()).toISOString()}`);

    return verificationToken; // Return the unhashed token for the email link
};

// Virtuals for relationships
UserSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'user',
    justOne: false
});

UserSchema.virtual('ratings', {
    ref: 'Rating',
    localField: '_id',
    foreignField: 'user',
    justOne: false
});

UserSchema.virtual('guidesCreated', {
    ref: 'Guide',
    localField: '_id',
    foreignField: 'user',
    justOne: false
});

module.exports = mongoose.model('User', UserSchema);