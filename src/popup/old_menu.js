import {
  getActiveTab,
  isRestrictedUrl,
  hasPermission,
} from '../scripts/helpers.js';
import Logger from '../scripts/utils/logger.js';

// Get DOM elements
const toggleBorders = document.querySelector('#toggle-borders');
const toggleInspector = document.querySelector('#toggle-inspector');
const borderSize = document.querySelector('#border-size');
const borderStyle = document.querySelector('#border-style');
const restrictedMessage = document.querySelector('#restricted-message');
const screenshotButton = document.querySelector('#screenshot-button');
const permissionWarning = document.querySelector(
  '#screenshot-permission-warning'
);
const grantPermissionButton = document.querySelector(
  '#grant-permission-button'
);

// Check if we have download permissions
let hasDownloadPermission = false;

/** Checks if the extension has download permissions */
async function checkDownloadPermission() {
  try {
    // Check if we have the 'downloads' permission using our helper
    hasDownloadPermission = await hasPermission('downloads');
    Logger.info(`Download permission status: ${hasDownloadPermission}`);

    // Update UI based on permission state
    if (hasDownloadPermission) {
      permissionWarning.style.display = 'none';
      screenshotButton.disabled = false;
    } else {
      permissionWarning.style.display = 'block';
      screenshotButton.disabled = true;
    }

    return hasDownloadPermission;
  } catch (error) {
    Logger.error('Error checking download permission:', error);
    permissionWarning.style.display = 'block';
    screenshotButton.disabled = true;
    return false;
  }
}

/** Requests download permission from the user */
async function requestDownloadPermission() {
  try {
    const granted = await chrome.permissions.request({
      permissions: ['downloads'],
    });

    if (granted) {
      hasDownloadPermission = true;
      permissionWarning.style.display = 'none';
      screenshotButton.disabled = false;
      showNotification('Download permission granted!', 'success');
    } else {
      hasDownloadPermission = false;
      permissionWarning.style.display = 'block';
      screenshotButton.disabled = true;
      showNotification('Download permission denied', 'error');
    }

    return granted;
  } catch (error) {
    Logger.error('Error requesting download permission:', error);

    showNotification('Failed to request download permission', 'error');
    return false;
  }
}

/**
 * Shows a notification message to the user.
 * This function updates the screenshot button text to the provided message,
 * disables it temporarily, and then reverts to the original text after a delay.
 *
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - The type of notification (info, success, error).
 * @returns {void}
 */
function showNotification(message, type = 'info') {
  Logger.info(`Notification: ${message} (Type: ${type})`);
  const originalText = screenshotButton.textContent;
  screenshotButton.textContent = message;
  screenshotButton.disabled = true;

  // Wait for a short time before reverting to the original state
  setTimeout(() => {
    screenshotButton.textContent = originalText;
    screenshotButton.disabled = !hasDownloadPermission;
  }, 2000);
}

/**
 * Toggles the restricted page state in the popup.
 * This function updates the body class, shows or hides the restricted message,
 * and disables or enables all form controls except the restricted message itself.
 *
 * @param {boolean} isRestricted - Whether the page is restricted or not.
 * @returns {void}
 */
function toggleRestrictedState(isRestricted) {
  document.body.classList.toggle('restricted', isRestricted);

  // Show/hide the restricted message
  if (restrictedMessage) {
    restrictedMessage.style.display = isRestricted ? 'block' : 'none';
  } else {
    Logger.warn('Restricted message element not found.');
  }

  // Disable/enable all form controls except the restricted message itself
  document
    .querySelectorAll('input, select, button, fieldset')
    .forEach(control => (control.disabled = isRestricted));
}

/** Shows the restricted state in the popup. */
const showRestrictedState = () => toggleRestrictedState(true);

/** Hides the restricted state in the popup. */
const hideRestrictedState = () => toggleRestrictedState(false);

/** Initializes the toggle switch state and border settings from storage. */
async function initializeStates() {
  Logger.info('Initializing popup state...');

  // Check if DOM elements exist before accessing
  if (
    !toggleBorders ||
    !toggleInspector ||
    !borderSize ||
    !borderStyle ||
    !restrictedMessage ||
    !screenshotButton
  ) {
    Logger.warn('One or more required DOM elements are missing.');
    return;
  }

  try {
    // Get the active tab and check if it's valid
    const tab = await getActiveTab();
    if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) {
      showRestrictedState();
      Logger.info('Restricted page detected. Hiding form controls.');
      return;
    }

    // Ensure restricted state is hidden if we're on a valid page
    hideRestrictedState();

    const tabIdString = tab.id.toString();

    // Get state from storage
    const data = await chrome.storage.local.get([
      tabIdString,
      'borderSize',
      'borderStyle',
    ]);

    // Set the toggle switch states
    toggleBorders.checked = data[tabIdString]?.borderMode ?? false;
    toggleInspector.checked = data[tabIdString]?.inspectorMode ?? false;

    // Set the border settings values
    borderSize.value = data.borderSize ?? 1;
    borderStyle.value = data.borderStyle ?? 'solid';
  } catch (error) {
    Logger.error('Error during initialization:', error);
    showRestrictedState();
    return;
  }
}

/** Toggles the border. */
function toggleBorderMode() {
  // Send message to background script to handle the state toggle
  chrome.runtime.sendMessage({ action: 'TOGGLE_BORDER_MODE' });
}

/** Toggles the inspector mode. */
function toggleInspectorMode() {
  // Send message to background script to handle the state toggle
  chrome.runtime.sendMessage({ action: 'TOGGLE_INSPECTOR_MODE' });
}

/** Updates the border settings */
function updateBorderSettings() {
  // Send message to background script to handle the settings update
  chrome.runtime.sendMessage({
    action: 'UPDATE_BORDER_SETTINGS',
    borderSize: borderSize.value,
    borderStyle: borderStyle.value,
  });
}

/** Handles the screenshot request */
async function handleScreenshotRequest() {
  // Check permissions first
  if (!hasDownloadPermission) {
    const granted = await requestDownloadPermission();
    if (!granted) return;
  }

  try {
    // Disable button while processing
    screenshotButton.disabled = true;
    screenshotButton.textContent = 'Capturing...';

    // Send message to background script to capture screenshot
    const success = await chrome.runtime.sendMessage({
      action: 'CAPTURE_SCREENSHOT',
    });
    Logger.info('Screenshot capture response:', success);

    if (success === false) {
      showNotification('Failed to capture screenshot', 'error');
    } else {
      showNotification('Screenshot captured!', 'success');
    }
  } catch (error) {
    Logger.error('Error capturing screenshot:', error);
    showNotification('Error capturing screenshot', 'error');
  } finally {
    // Re-enable button
    screenshotButton.textContent = 'Take Screenshot';
    screenshotButton.disabled = !hasDownloadPermission;
  }
}

// Run initialization when popup loads
document.addEventListener('DOMContentLoaded', async () => {
  await initializeStates();

  // Only check download permissions if the page is not restricted
  if (!document.body.classList.contains('restricted')) {
    await checkDownloadPermission();
  }
});

// Add event listeners
toggleBorders?.addEventListener('change', toggleBorderMode);
toggleInspector?.addEventListener('change', toggleInspectorMode);
borderSize?.addEventListener('input', updateBorderSettings);
borderStyle?.addEventListener('change', updateBorderSettings);
screenshotButton?.addEventListener('click', handleScreenshotRequest);
grantPermissionButton?.addEventListener('click', requestDownloadPermission);
