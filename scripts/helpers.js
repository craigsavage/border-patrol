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
    'file:',
  ];

  return (
    invalidSchemes.some(scheme => url.startsWith(scheme)) ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com')
  );
}

/**
 * Retrieves the active tab object.
 *
 * @returns {Promise<Object>} The active tab object, or an empty object if not found.
 */
export async function getActiveTab() {
  try {
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    if (!tab) return {};

    return tab;
  } catch (error) {
    console.error('Error retrieving active tab:', error);
    return {};
  }
}
