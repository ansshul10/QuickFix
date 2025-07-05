// quickfix-website/server/server.js
require('dotenv').config();

const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');
const cron = require('node-cron');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const expressWinston = require('express-winston');
const winston = require('winston');
const cors = require('cors');

// Import core config and utilities
const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const errorHandler = require('./utils/errorHandler');
const AppError = require('./utils/appError');
const logger = require('./utils/logger');
const { sendVerificationReminders, cleanupUnverifiedAccounts } = require('./utils/scheduledTasks');

// Import necessary models for default admin creation/settings
const User = require('./models/User');
const Settings = require('./models/Settings');

// Import all routes
const authRoutes = require('./routes/auth');
const guideRoutes = require('./routes/guides');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/ratings');
const premiumRoutes = require('./routes/premium');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const newsletterRoutes = require('./routes/newsletter');
const announcementRoutes = require('./routes/announcements');
const publicRoutes = require('./routes/public');
const contactRoutes = require('./routes/contact');


// Load environment variables (ensure this is done early)
dotenv.config({ path: './config/config.env' });

const app = express();

// --- IMPORTANT: Trust Proxy for Rate Limiting and Correct IP Identification ---
// This must be set before any middleware that relies on req.ip (like express-rate-limit)
// For Render, 1 usually means trusting the Render load balancer.
// If you're behind multiple proxies, you might need a higher number or 'true'.
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : 0);

// --- Database Connection ---
connectDB();

// --- Create Default Admin User ---
const createDefaultAdmin = async () => {
    try {
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            logger.warn('Default admin credentials not set in .env. Skipping default admin creation.');
            return;
        }

        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            const adminUser = await User.create({
                username: 'AdminUser',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                active: true,
                emailVerified: true
            });
            logger.info(`Default admin user created: ${adminUser.email}`);
        } else {
            logger.info(`Default admin user already exists: ${adminExists.email}`);
        }
    } catch (error) {
        logger.error(`Error creating default admin: ${error.message}`, error.stack);
    }
};
createDefaultAdmin();

// --- Initialize Default Settings ---
const initializeDefaultSettings = async () => {
    const defaultSettings = [
        { settingName: 'allowRegistration', settingValue: true, description: 'Enable or disable new user registrations.' },
        { settingName: 'allowLogin', settingValue: true, description: 'Enable or disable user logins.' },
        { settingName: 'websiteMaintenanceMode', settingValue: false, description: 'Put the website in maintenance mode (only admin can access).' },
        { settingName: 'upiIdForPremium', settingValue: 'your.default.upi@bank', description: 'The UPI ID for premium subscriptions (for UPI payment method).' },
        { settingName: 'basicPlanPrice', settingValue: 499, description: 'The price for the Basic premium plan (in INR).' },
        { settingName: 'advancedPlanPrice', settingValue: 999, description: 'The price for the Advanced premium plan (in INR).' },
        { settingName: 'proPlanPrice', settingValue: 1999, description: 'The price for the Pro premium plan (in INR).' },
        { settingName: 'newGuideNotificationToSubscribers', settingValue: true, description: 'Send email notifications to newsletter subscribers for new guides.' },
        { settingName: 'enableEmailVerification', settingValue: true, description: 'Enable email link verification for new user registrations.' },
        { settingName: 'contactEmail', settingValue: 'support@quickfix.com', description: 'Official contact email for the website.' },
        { settingName: 'socialFacebookUrl', settingValue: '', description: 'URL for Facebook page.' },
        { settingName: 'socialTwitterUrl', settingValue: '', description: 'URL for Twitter/X page.' },
        { settingName: 'socialInstagramUrl', settingValue: '', description: 'URL for Instagram page.' },
        { settingName: 'globalAnnouncement', settingValue: 'Welcome to QuickFix! Explore our guides and solutions.', description: 'A general announcement displayed on the website.' },
        { settingName: 'enableComments', settingValue: true, description: 'Allow users to post comments on guides.' },
        { settingName: 'enableRatings', settingValue: true, description: 'Allow users to rate guides.' },
        { settingName: 'privacyPolicyLastUpdated', settingValue: '2025-01-01', description: 'Date when the Privacy Policy was last updated (YYYY-MM-DD).' },
        { settingName: 'termsOfServiceLastUpdated', settingValue: '2025-01-01', description: 'Date when the Terms of Service were last updated (YYYY-MM-DD).' },
        { settingName: 'adminPanelUrl', settingValue: 'http://localhost:3000/admin', description: 'Base URL for the admin panel, used in admin notification emails.' }
    ];
    try {
        for (const setting of defaultSettings) {
            const exists = await Settings.findOne({ settingName: setting.settingName });
            if (!exists) {
                await Settings.create(setting);
                logger.info(`Initialized default setting: ${setting.settingName}`);
            } else {
                logger.debug(`Setting ${setting.settingName} already exists. Skipping creation.`);
            }
        }
        logger.info('Default settings initialization complete.');
    } catch (error) {
        logger.error(`Error initializing default settings: ${error.message}`, error.stack);
    }
};
initializeDefaultSettings();


// --- Global Middleware ---
app.use(morgan('dev'));

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: 'debug',
            handleExceptions: true,
        }),
        new winston.transports.File({ filename: 'logs/http.log', level: 'http' }),
    ],
    format: winston.format.combine(
        winston.format.json()
    ),
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true,
    ignoreRoute: function (req, res) { return false; }
}));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            // Ensure both frontend and API URLs are allowed for images
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com",
                     process.env.NODE_ENV === 'production' ? process.env.YOUR_DOMAIN : 'localhost:*',
                     process.env.NODE_ENV === 'production' ? process.env.API_URL : ''
                    ],
            // connectSrc should include the API URL where requests are sent
            connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000",
                         process.env.NODE_ENV === 'production' ? process.env.API_URL : '',
                         // If your frontend communicates with other external APIs, add them here
                        ],
            frameSrc: ["'self'", "https://js.stripe.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: new AppError('Too many requests from this IP, please try again after 15 minutes', 429),
    standardHeaders: true,
    legacyHeaders: false,
    // keyGenerator is implicitly using req.ip, which is now correct due to 'trust proxy'
});
app.use('/api', globalLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// --- CORRECTED CORS CONFIGURATION ---
// In production, only the frontend URL should be allowed to make requests to this API.
// The API_URL itself is where this server is, not an origin that makes requests to it.
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL.replace(/\/$/, '')] // Remove trailing slash for consistency
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g., direct API calls, mobile apps)
        if (!origin) return callback(null, true);

        // Check if the request origin is in the allowed list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
            logger.error(`CORS Blocked: ${msg}`); // Log the blocked origin
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.options('*', cors()); // Enable pre-flight across all routes

app.use(passport.initialize());
configurePassport(passport);

// Serve static files from the 'public/uploads' directory (e.g., screenshots)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/contact', contactRoutes);

// --- Maintenance Mode Check ---
app.use(async (req, res, next) => {
    const maintenanceSetting = await Settings.findOne({ settingName: 'websiteMaintenanceMode' });
    const isMaintenance = maintenanceSetting ? maintenanceSetting.settingValue : false;

    // Allow static assets to be served even in maintenance mode
    if (req.originalUrl.startsWith('/uploads/') || req.originalUrl.startsWith('/static/') || req.originalUrl.startsWith('/manifest.json') || req.originalUrl.startsWith('/favicon.ico')) {
        return next();
    }

    // Admins can bypass maintenance mode for all API routes and frontend pages
    if (isMaintenance && req.user && req.user.role === 'admin') {
        return next();
    }

    // Allow specific auth-related public routes even in maintenance mode for non-admins
    if (isMaintenance && (
        req.originalUrl.startsWith('/api/auth/login') ||
        req.originalUrl.startsWith('/api/auth/forgotpassword') ||
        req.originalUrl.startsWith('/api/auth/resetpassword') ||
        req.originalUrl.startsWith('/api/auth/verify-email') ||
        req.originalUrl.startsWith('/api/auth/resend-verification-link')
    )) {
        return next();
    }

    // If in maintenance and not an admin or allowed auth route, block API access
    if (isMaintenance && req.originalUrl.startsWith('/api')) {
        return next(new AppError('The website API is currently under maintenance. Please try again later.', 503));
    }

    next();
});

// --- Schedule Cron Jobs ---
// Schedule email verification reminders
cron.schedule(process.env.EMAIL_VERIFICATION_REMINDER_CRON_SCHEDULE, async () => {
    logger.info('Running scheduled task: Sending email verification reminders...');
    await sendVerificationReminders();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Set your desired timezone
});

// Schedule cleanup of old unverified accounts
cron.schedule(process.env.CLEANUP_UNVERIFIED_ACCOUNTS_CRON_SCHEDULE, async () => {
    logger.info('Running scheduled task: Cleaning up old unverified accounts...');
    await cleanupUnverifiedAccounts();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Set your desired timezone
});


// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
    });
}


// --- Error Handling Middleware (MUST BE THE LAST MIDDLEWARE) ---
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(errorHandler);


// --- Server Start ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// --- Graceful Shutdown ---
process.on('unhandledRejection', (err, promise) => {
    logger.error(`UNHANDLED REJECTION! Shutting down... ${err.name}: ${err.message}`, err.stack);
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    logger.error(`UNCAUGHT EXCEPTION! Shutting down... ${err.name}: ${err.message}`, err.stack);
    process.exit(1);
});
