import Logger from './utils/logger';

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
 * The active tab is the last focused tab in the current window.
 * If no tab is found, an empty object is returned.
 *
 * @returns The active tab object, or an empty object if not found.
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab> {
  try {
    // Query for the active tab in the current window
    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    // Return the first tab found, or an empty object if none are found
    return tabs[0] ?? {};
  } catch (error) {
    return {};
  }
}

/**
 * Checks if the extension has the specified permission.
 *
 * @param {string|string[]} permissions - The permission or array of permissions to check.
 * @returns {Promise<boolean>} A promise that resolves to true if all permissions are granted.
 */
export async function hasPermission(permissions) {
  const perms = Array.isArray(permissions) ? permissions : [permissions];

  try {
    // Check if the permissions are already granted
    return await chrome.permissions.contains({ permissions: perms });
  } catch (error) {
    Logger.error('Error checking permissions:', error);
    return false;
  }
}
