/**
 * Checks if the provided URL is a restricted URL.
 *
 * @param {string} url - The URL to check.
 * @returns {boolean} True if the URL is restricted, false otherwise.
 */
export function isRestrictedUrl(url) {
  const invalidSchemes = [
    'chrome:',
    'chrome-extension:',
    'about:',
    'edge:',
    'edge-extension:',
    'moz-extension:',
  ];

  return (
    invalidSchemes.some(scheme => url.startsWith(scheme)) ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com') ||
    url.startsWith('https://addons.mozilla.org/')
  );
}

/**
 * Retrieves the active tab in the current window.
 *
 * @returns {Promise<chrome.tabs.Tab>} The active tab object, or an empty object if not found.
 */
export async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return tab ?? {};
  } catch (error) {
    Logger.error('Error retrieving active tab:', error);
    return {};
  }
}

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
export const Logger = {
  isDebug: false,
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

/** A test function to verify that the script is loaded. */
export const test = () => {
  console.log('Test function called!');
};
