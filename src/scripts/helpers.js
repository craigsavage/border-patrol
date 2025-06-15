const LOG_LABEL = '[BORDER PATROL]';

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

/**
 * Retrieves and formats the class names of an element.
 * Truncates the list if it exceeds the maximum display length.
 *
 * @param {HTMLElement} element - The DOM element whose class names are to be retrieved.
 * @param {number} [maxLength=100] - The maximum length of the class names string.
 * @returns {string} A formatted string of class names.
 */
export function getElementClassNames(element, maxLength = 100) {
  const classAttribute = element.getAttribute('class');
  // Handle cases where class attribute is null or not a string
  if (!classAttribute || typeof classAttribute !== 'string') return '';

  // Split class names by whitespace and filter out empty strings
  const classNames = classAttribute.split(/\s+/).filter(Boolean);
  let elementClasses = '';
  if (classNames.length > 0) {
    elementClasses = `.${classNames.join(' .')}`;
    if (elementClasses.length > maxLength) {
      elementClasses = elementClasses.substring(0, maxLength - 3) + '...';
    }
  }

  return elementClasses;
}
