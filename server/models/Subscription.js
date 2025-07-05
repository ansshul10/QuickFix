// quickfix-website/server/models/Subscription.js
const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        // The comment below indicates 'unique: true' was removed from here.
        // Ensure you have also dropped any existing unique index on 'user' in your MongoDB database.
        // (e.g., db.subscriptions.dropIndex("user_1"); in mongo shell)
    },
    plan: {
        type: String,
        enum: ['basic', 'advanced', 'pro', 'premium', 'UPI_Premium_Annual', 'admin-granted'],
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        // endDate will be set when status is ACTIVE by admin, it's not required for pending
        // The previous conditional 'required' function is correctly removed from here.
    },
    status: {
        type: String,
        enum: ['initiated', 'pending_manual_verification', 'active', 'cancelled', 'expired', 'failed'],
        // No default here, status is explicitly set.
    },
    paymentMethod: {
        type: String,
        enum: ['STRIPE', 'PAYPAL', 'UPI', 'ADMIN'],
        default: 'UPI'
    },
    referenceCode: {
        type: String,
        trim: true,
        unique: true, // This is okay. It prevents duplicate active/pending reference codes.
        sparse: true  // Allows multiple documents without a referenceCode or if unique values are only applied to documents where the field is present.
    },
    transactionId: {
        type: String,
        trim: true,
        sparse: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    screenshotUrl: String,
    adminNotes: String,
    verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date
}, {
    timestamps: true
});

// Pre-save hook: This hook is still valid and will set endDate ONLY when status becomes active.
// This is fine because endDate is no longer conditionally required when creating (pending)
SubscriptionSchema.pre('save', function(next) {
    // Only set endDate if the status is changing to 'active' AND endDate is not already set
    if (this.isModified('status') && this.status === 'active' && !this.endDate) {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        this.endDate = oneYearFromNow;
    }
    next();
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);