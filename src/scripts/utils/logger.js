const LOG_LABEL = '[BORDER PATROL]';

/**
 * A logger that allows enabling/disabling of logs.
 *
 * @constant
 * @type {Object}
 * @property {boolean} isDebug - Enables or disables debug logging
 * @property {function} info - Logs an informational message
 * @property {function} error - Logs an error message
 * @property {function} warn - Logs a warning message
 */
const Logger = {
  isDebug: true,
  info(...args) {
    if (this.isDebug) console.log(`%c${LOG_LABEL}`, 'color: #2374ab', ...args);
  },
  warn(...args) {
    if (this.isDebug) {
      console.warn(`%c${LOG_LABEL}`, 'color: #f1c40f', ...args);
    }
  },
  error(...args) {
    // Errors are always logged regardless of debug state
    console.error(`%c${LOG_LABEL}`, 'color: #e74c3c', ...args);
  },
};

export default Logger;
