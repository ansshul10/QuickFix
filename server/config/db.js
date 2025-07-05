// quickfix-website/server/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Import our logger

const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB using the URI from environment variables
        const conn = await mongoose.connect(process.env.MONGO_URI);
        // Log successful connection
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log connection error and exit the process if connection fails
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with a failure code
    }
};

module.exports = connectDB;