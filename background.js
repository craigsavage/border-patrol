/**
 * Updates the extension state based on the current state.
 * @param {boolean} isEnabled - Determines whether the extension is enabled or disabled.
 */
function updateExtensionState(isEnabled) {
  chrome.action.setIcon({
    path: isEnabled
      ? 'icons/border-patrol-icon-16.png'
      : 'icons/border-patrol-icon-16-disabled.png',
  });
  chrome.action.setTitle({
    title: isEnabled ? 'Border Patrol - Enabled' : 'Border Patrol - Disabled',
  });
}

/**
 * Runs when the extension is installed or updated.
 * Clears any previous state and initializes the extension state and default settings.
 * @param {Object} details - Details about the installation or update.
 */
chrome.runtime.onInstalled.addListener(async details => {
  // Clear any previous state
  await chrome.storage.local.set({});
  // Set default settings for the extension
  await chrome.storage.local.set({
    borderThickness: 1,
    borderStyle: 'solid',
    isInspectorModeEnabled: false,
  });
  updateExtensionState(false);

  try {
    const tab = await getTab();
    if (!tab?.url || isRestrictedUrl(tab.url) || !tab.id) return;

    const tabId = tab.id;

    // Initialize the extension state for the active tab to false after installation
    await chrome.storage.local.set({ [`isEnabled_${tabId}`]: false });

    injectBorderScript(tabId);
  } catch (error) {
    // Ignore errors
  }
});

/**
 * Injects the border script when a tab is updated (when a page loads or reloads).
 * @param {number} tabId - The ID of the tab that has been updated.
 * @param {Object} changeInfo - Information about the change to the tab.
 * @param {Object} tab - The tab object.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!tabId) return;

  if (changeInfo.status === 'complete') {
    const data = await getData(tabId);
    if (!data) return;

    const isEnabled = data[`isEnabled_${tabId}`] || false;
    updateExtensionState(isEnabled);
    injectBorderScript(tabId);
    sendInspectorModeUpdate(tabId);
  }
});

/**
 * Injects the border script when a tab is activated (when switching tabs).
 * @param {Object} activeInfo - Information about the activated tab.
 */
chrome.tabs.onActivated.addListener(async activeInfo => {
  const tabId = activeInfo?.tabId;
  if (!tabId) return;

  const data = await getData(tabId);
  if (!data) return;

  const isEnabled = data[`isEnabled_${tabId}`] || false;
  updateExtensionState(isEnabled);
  injectBorderScript(tabId);
  sendInspectorModeUpdate(tabId);
});

/**
 * Toggles the extension state when the extension icon is clicked.
 * @param {Object} tab - The tab object.
 */
chrome.action.onClicked.addListener(async tab => {
  if (!tab) return;

  const tabId = tab.id;
  const data = await getData(tabId);
  if (!data) return;

  const isEnabled = data[`isEnabled_${tabId}`] || false;
  const newState = !isEnabled;

  // Store the new state using tab ID as the key
  await chrome.storage.local.set({ [`isEnabled_${tab.id}`]: newState });

  updateExtensionState(newState);
  injectBorderScript(tabId);
  sendInspectorModeUpdate(tabId);
});

// Handles recieving messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Receive message to retrieve tab ID
  if (request.action === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab?.id });
  }
  // Receive message to update extension state
  if (request.action === 'UPDATE_ICON') {
    updateExtensionState(request.isEnabled);
  }
});

/**
 * Checks if the provided URL is a restricted URL.
 * @param {string} url - The URL to check.
 * @returns {boolean} True if the URL is restricted, false otherwise.
 */
function isRestrictedUrl(url) {
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
 * Injects the border script into the specified tab.
 * @param {number} tabId - The ID of the tab to inject the script into.
 */
async function injectBorderScript(tabId) {
  if (!tabId) return;

  try {
    // Check if the tab is a valid webpage
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url || isRestrictedUrl(tab.url)) return;

    // Inject overlay.css into the active tab
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['css/overlay.css'],
    });

    // Inject border.js and overlay.js into the active tab
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/border.js', 'scripts/overlay.js'],
    });

    // Connect to the content script
    chrome.tabs.connect(tabId, { name: 'content-connection' });
  } catch (error) {
    console.error('Error injecting scripts or CSS:', error);
  }
}

/**
 * Sends a message to the content script to update the inspector mode state.
 * @param {number} tabId - The ID of the tab to send the message to.
 */
async function sendInspectorModeUpdate(tabId) {
  if (!tabId) return;

  try {
    // Check if the tab is a valid webpage
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url || isRestrictedUrl(tab.url)) return;

    if (!chrome || !chrome.storage) return;

    // Retrieve the inspector mode state
    const data = await chrome.storage.local.get('isInspectorModeEnabled');
    const isEnabled = data?.isInspectorModeEnabled || false;

    // Send message to update inspector mode
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_INSPECTOR_MODE',
      isEnabled,
    });
  } catch (error) {
    // Ignore errors if the tab is no longer active
  }
}

/**
 * Retrieves the extension state data for the specified tab.
 * @param {number} tabId - The ID of the tab to retrieve data for.
 * @returns {Object} The extension state data for the specified tab.
 */
async function getData(tabId) {
  if (!tabId) {
    const tab = await getTab();
    tabId = tab.id;
  }

  if (!tabId) return {};

  const data = await chrome.storage.local.get(`isEnabled_${tabId}`);
  return data;
}

/**
 * Retrieves the active tab.
 * @returns {Promise<Object>} The active tab object, or an empty object if not found.
 */
async function getTab() {
  try {
    const queryOptions = { active: true, lastFocusedWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    if (!tab) {
      return {};
    }
    return tab;
  } catch (error) {
    return {};
  }
}

// Handles keyboard shortcut commands
chrome.commands.onCommand.addListener(async command => {
  // Toggle the extension
  if (command === 'toggle_border_patrol') {
    const tabId = (await getTab())?.id;
    const data = await getData(tabId);
    if (!data) return;

    const isEnabled = data[`isEnabled_${tabId}`] || false;
    const newState = !isEnabled;

    // Store the new state using tab ID as the key
    await chrome.storage.local.set({ [`isEnabled_${tabId}`]: newState });

    updateExtensionState(newState);

    // Apply changes to the active tab
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/border.js'],
    });
  }
});
