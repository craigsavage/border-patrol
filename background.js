/**
 * Runs when the extension is installed or updated.
 * Clears any previous state and updates the extension state.
 * @param {Object} details - Details about the installation or update.
 */
chrome.runtime.onInstalled.addListener(details => {
  chrome.storage.local.set({}); // Clears any previous state
  updateExtensionState(false);
});

/**
 * Injects the border script when a tab is updated (when a page loads or reloads).
 * @param {number} tabId - The ID of the tab that has been updated.
 * @param {Object} changeInfo - Information about the change to the tab.
 * @param {Object} tab - The tab object.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const data = await getData(tabId);
    const isEnabled = data[`isEnabled_${tabId}`] || false;
    updateExtensionState(isEnabled);
    injectBorderScript(tabId);
  }
});

/**
 * Injects the border script when a tab is activated (when switching tabs).
 * @param {Object} activeInfo - Information about the activated tab.
 */
chrome.tabs.onActivated.addListener(async activeInfo => {
  const tabId = activeInfo.tabId;
  const data = await getData(tabId);
  const isEnabled = data[`isEnabled_${tabId}`] || false;
  updateExtensionState(isEnabled);
  injectBorderScript(tabId);
});

/**
 * Toggles the extension state when the extension icon is clicked.
 * @param {Object} tab - The tab object.
 */
chrome.action.onClicked.addListener(async tab => {
  const tabId = tab.id;
  const data = await getData(tabId);
  const isEnabled = data[`isEnabled_${tabId}`] || false;
  const newState = !isEnabled;

  // Store the new state using tab ID as the key
  chrome.storage.local.set({ [`isEnabled_${tab.id}`]: newState });

  updateExtensionState(newState);
  injectBorderScript(tabId);
});

/**
 * Handles messages from content scripts.
 * @param {Object} request - The message sent from the content script.
 * @param {Object} sender - Information about the sender of the message.
 * @param {Function} sendResponse - Function to send a response back to the content script.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabId') {
    sendResponse({ tabId: sender.tab?.id });
  }
});

/**
 * Updates the extension state based on the current state.
 * @param {boolean} isEnabled - Determines whether the extension is enabled or disabled.
 */
function updateExtensionState(isEnabled) {
  chrome.action.setBadgeText({ text: isEnabled ? 'ON' : 'OFF' });
  chrome.action.setIcon({
    path: isEnabled ? 'icons/bp-icon-16.png' : 'icons/bp-icon-disabled-16.png',
  });
  chrome.action.setTitle({
    title: isEnabled ? 'Disable Border Patrol' : 'Enable Border Patrol',
  });
}

/**
 * Injects the border script into the specified tab.
 * @param {number} tabId - The ID of the tab to inject the script into.
 */
function injectBorderScript(tabId) {
  console.log('Injecting border script for tab:', tabId);
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      files: ['scripts/border.js'],
    })
    .catch(error => console.error('Error executing script:', error));
}

/**
 * Retrieves the currently active tab.
 * @returns {Promise<Object>} A promise that resolves to the active tab object.
 */
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
 * Retrieves the extension state data for the specified tab.
 * @param {number} tabId - The ID of the tab to retrieve data for.
 * @returns {Object} The extension state data for the specified tab.
 */
async function getData(tabId) {
  if (!tabId) {
    const tab = await getCurrentTab();
    tabId = tab.id;
  }

  const data = await chrome.storage.local.get(`isEnabled_${tabId}`);
  console.log('Data for tab', tabId, ':', data);
  return data;
}
