// quickfix-website/server/models/Guide.js
const mongoose = require('mongoose');
const slugify = require('slugify'); // Assuming slugify is used for pre-save hook

const GuideSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        unique: true,
        trim: true,
        maxlength: [100, 'Title can not be more than 100 characters']
    },
    slug: String,
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    content: {
        type: String, // This will store the HTML generated from Markdown
        required: [true, 'Please add guide content']
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    user: { // Creator of the guide
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    averageRating: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    imageUrl: {
        type: String,
        default: '/images/default-guide.png'
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create guide slug from the title
GuideSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = slugify(this.title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    }
    next();
});

// Reverse populate with virtuals
GuideSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'guide',
    justOne: false
});

GuideSchema.virtual('ratings', {
    ref: 'Rating',
    localField: '_id',
    foreignField: 'guide',
    justOne: false
});


module.exports = mongoose.model('Guide', GuideSchema);
