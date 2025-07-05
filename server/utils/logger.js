// quickfix-website/server/utils/logger.js
const winston = require('winston');

// Define log levels and their numerical values
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Define colors for each log level when outputting to console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'white',
};

// Add these colors to Winston
winston.addColors(colors);

// Format for console output: colorized level, timestamp, message
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// Format for file output: timestamp, JSON format for easier parsing/analysis
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
);

const logger = winston.createLogger({
  levels: levels, // Use our custom levels
  transports: [
    // Console transport: for real-time logging during development
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug', // Log all levels (debug and above) to console in development
      handleExceptions: true, // Capture and log uncaught exceptions
    }),
    // File transport for errors: dedicated file for error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error', // Only log messages of level 'error' to this file
      format: fileFormat,
      maxsize: 5242880, // Max size of log file (5MB)
      maxFiles: 5, // Max number of log files to keep (will rotate)
    }),
    // File transport for combined logs: includes info, warn, error
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info', // Log messages of level 'info' and above to this file
      format: fileFormat,
      maxsize: 10485760, // Max size of log file (10MB)
      maxFiles: 10, // Max number of log files to keep
    }),
  ],
  // Handlers for uncaught exceptions and unhandled promise rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log', format: fileFormat }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log', format: fileFormat }),
  ],
  exitOnError: false, // Prevents Winston from exiting the process on handled exceptions
});

module.exports = logger;