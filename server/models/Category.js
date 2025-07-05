// quickfix-website/server/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name can not be more than 50 characters']
    },
    slug: String,
    description: {
        type: String,
        maxlength: [200, 'Description can not be more than 200 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create category slug from the name
CategorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = require('slugify')(this.name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    }
    next();
});

module.exports = mongoose.model('Category', CategorySchema);