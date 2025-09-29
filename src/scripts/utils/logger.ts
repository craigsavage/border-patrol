const LOG_LABEL: string = '[BORDER PATROL]';

/**
 * An ILogger interface defining the structure of the logger object.
 *
 * @interface ILogger
 * @property {boolean} isDebug - Indicates if debug logging is enabled.
 * @property {function} info - Logs informational messages.
 * @property {function} debug - Logs debug messages.
 * @property {function} warn - Logs warning messages.
 * @property {function} error - Logs error messages. Errors are always logged.
 */
interface ILogger {
  isDebug: boolean;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * A logger that allows enabling/disabling of logs.
 *
 * Note: Errors are always logged.
 */
const Logger: ILogger = {
  isDebug: false,

  info(message: string, ...args: any[]) {
    if (this.isDebug)
      console.log(`%c${LOG_LABEL}`, 'color: #2374ab', message, ...args);
  },
  debug(message: string, ...args: any[]) {
    if (this.isDebug)
      console.debug(`%c${LOG_LABEL}`, 'color: #2ecc71', message, ...args);
  },
  warn(message: string, ...args: any[]) {
    if (this.isDebug) {
      console.warn(`%c${LOG_LABEL}`, 'color: #f1c40f', message, ...args);
    }
  },
  error(message: string, ...args: any[]) {
    // Errors are always logged regardless of debug state
    console.error(`%c${LOG_LABEL}`, 'color: #e74c3c', message, ...args);
  },
};

export default Logger;
