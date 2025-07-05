// quickfix-website/server/models/Rating.js
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
        required: [true, 'Please add a rating between 1 and 5']
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

// Static method to get average rating of a guide
RatingSchema.statics.getAverageRating = async function(guideId) {
    const obj = await this.aggregate([
        {
            $match: { guide: guideId }
        },
        {
            $group: {
                _id: '$guide',
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        await this.model('Guide').findByIdAndUpdate(guideId, {
            averageRating: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 0, // Round to 1 decimal place
            numOfReviews: obj[0] ? obj[0].numOfReviews : 0
        });
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
RatingSchema.post('save', function() {
    this.constructor.getAverageRating(this.guide);
});

// Call getAverageRating after remove
RatingSchema.post('deleteOne', { document: true, query: false }, function() {
    this.constructor.getAverageRating(this.guide);
});


// Ensure one user can only rate a guide once
RatingSchema.index({ user: 1, guide: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);