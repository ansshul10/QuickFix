// quickfix-website/client/src/utils/logger.js
// A simple logger for frontend. For production, consider using a dedicated
// client-side logging service (e.g., Sentry, LogRocket)

const isDev = process.env.NODE_ENV === 'development';

const logger = {
  info: (...args) => {
    if (isDev) {
      console.log(`%c[INFO]%c`, 'color: #3b82f6; font-weight: bold;', 'color: unset;', ...args);
    }
  },
  warn: (...args) => {
    if (isDev) {
      console.warn(`%c[WARN]%c`, 'color: #f59e0b; font-weight: bold;', 'color: unset;', ...args);
    }
  },
  error: (...args) => {
    if (isDev) {
      console.error(`%c[ERROR]%c`, 'color: #ef4444; font-weight: bold;', 'color: unset;', ...args);
    }
  },
  debug: (...args) => {
    if (isDev) {
      console.debug(`%c[DEBUG]%c`, 'color: #a78bfa; font-weight: bold;', 'color: unset;', ...args);
    }
  }
};

export default logger;