/**
 * Logger utility — logs in development, silent in production.
 * Replace all direct console.log/console.error calls with this.
 */

const __DEV__ = process.env.NODE_ENV !== "production";

export const logger = {
  debug(...args: unknown[]) {
    if (__DEV__) {
      console.log(...args);
    }
  },

  info(...args: unknown[]) {
    if (__DEV__) {
      console.log(...args);
    }
  },

  warn(...args: unknown[]) {
    if (__DEV__) {
      console.warn(...args);
    }
  },

  error(...args: unknown[]) {
    if (__DEV__) {
      console.error(...args);
    }
    // In production, this is where you'd send to a crash reporting service
    // e.g., Sentry.captureException(args[0]);
  },
};

export default logger;
