import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
} from './scripts/constants.js';
import { isRestrictedUrl, getActiveTab } from './scripts/helpers.js';

// In-memory cache for tab states
const cachedTabStates = {}; // tabId -> { borderMode: boolean, inspectorMode: boolean }

/**
 * Retrieves the extension state for the specified tab ID and key.
 *
 * @param {{ tabId: number, key: string }} options - Options to retrieve the tab state.
 * @param {number} options.tabId - The ID of the tab to retrieve the state for.
 * @param {string} options.key - The key of the state to retrieve.
 * @returns {boolean} The state of the extension for the specified tab ID and key.
 */
async function getTabState({ tabId, key }) {
  const tabIdString = tabId.toString();

  // Check if the tab ID exists in cache before accessing its properties
  if (cachedTabStates?.[tabIdString]?.hasOwnProperty(key)) {
    return cachedTabStates[tabIdString][key];
  }

  try {
    // Retrieve state from storage if it doesn't exist in cache
    const storedData = await chrome.storage.local.get(tabIdString);
    console.log('getTabState from storage', storedData);
    return storedData?.[tabIdString]?.[key]
      ? storedData[tabIdString][key]
      : false;
  } catch (error) {
    // Ignore errors
    console.error('Error retrieving tab state from storage:', error);
    return false;
  }
}

/**
 * Sets the extension state for the specified tab ID and key.
 *
 * @param {{ tabId: number, key: string, value: boolean }} options - Options to set the tab state.
 * @param {number} options.tabId - The ID of the tab to set the state for.
 * @param {string} options.key - The key of the state to set.
 * @param {boolean} options.value - The value to set the state to.
 */
function setTabState({ tabId, key, value }) {
  const tabIdString = tabId.toString();

  // Update cache with new state
  cachedTabStates[tabIdString] = cachedTabStates[tabIdString] || {};
  cachedTabStates[tabIdString][key] = value;

  // Update storage with new state
  chrome.storage.local.set({ [tabIdString]: cachedTabStates[tabIdString] });
}

/**
 * Updates the extension state based on the current state.
 *
 * @param {boolean} isEnabled - Determines whether the extension is enabled or disabled.
 */
function updateExtensionState(isEnabled) {
  // TODO: Should enable if either borderMode or inspectorMode is enabled
  chrome.action.setTitle({
    title: isEnabled ? 'Border Patrol - Enabled' : 'Border Patrol - Disabled',
  });
  chrome.action.setIcon({
    path: isEnabled
      ? 'icons/border-patrol-icon-16.png'
      : 'icons/border-patrol-icon-16-disabled.png',
  });
}

/**
 * Runs when the extension is installed or updated.
 * Clears any previous state and initializes the extension state and default settings.
 * @param {Object} details - Details about the installation or update.
 */
chrome.runtime.onInstalled.addListener(async details => {
  console.log('onInstalled');
  // Clear any previous state
  await chrome.storage.local.set({});
  // Set default settings for the extension
  await chrome.storage.local.set({
    borderSize: DEFAULT_BORDER_SIZE,
    borderStyle: DEFAULT_BORDER_STYLE,
  });
  updateExtensionState(false);

  try {
    const tab = await getActiveTab();
    if (!tab?.url || isRestrictedUrl(tab.url) || !tab.id) return;

    const tabId = tab.id;

    // Initialize the extension state for the active tab to false after installation
    await chrome.storage.local.set({ [`isBorderEnabled_${tabId}`]: false });

    injectScripts(tabId);
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
});

/**
 * Injects the border script when a tab is updated (when a page loads or reloads).
 *
 * @param {number} tabId - The ID of the tab that has been updated.
 * @param {Object} changeInfo - Information about the change to the tab.
 * @param {Object} tab - The tab object.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  console.log('onUpdated');

  if (!tabId) return;

  // Validate if the tab is a valid webpage
  const tab = await chrome.tabs.get(tabId);
  if (!tab?.url || isRestrictedUrl(tab.url)) return;

  if (changeInfo.status === 'complete') {
    const isEnabled = await getTabState({ tabId, key: 'borderMode' });

    updateExtensionState(isEnabled);
    injectScripts(tabId);
    sendInspectorModeUpdate(tabId);
  }
});

/**
 * Injects the border script when a tab is activated (when switching tabs).
 *
 * @param {Object} activeInfo - Information about the activated tab.
 */
chrome.tabs.onActivated.addListener(async activeInfo => {
  console.log('onActivated');
  const tabId = activeInfo?.tabId;
  if (!tabId) return;

  const isEnabled = await getTabState({ tabId, key: 'borderMode' });
  updateExtensionState(isEnabled);
  injectScripts(tabId);
  sendInspectorModeUpdate(tabId);
});

/**
 * Toggles the extension state when the extension icon is clicked.
 *
 * @param {Object} tab - The tab object.
 */
chrome.action.onClicked.addListener(async tab => {
  console.log('onClicked');
  if (!tab) return;

  // Validate if the tab is a valid webpage
  if (!tab?.url || isRestrictedUrl(tab.url)) return;
  if (!chrome || !chrome.storage) return;

  // Get tab ID
  const tabId = tab.id;

  // Get and toggle the current state
  const isEnabled = await getTabState({ tabId, key: 'borderMode' });
  const newState = !isEnabled;

  // Store the new state using tab ID as the key
  setTabState({ tabId, key: 'borderMode', value: newState });

  updateExtensionState(newState);
  injectScripts(tabId);
  sendInspectorModeUpdate(tabId);
});

// Handles recieving messages from content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (!sender.tab) return;
  const tabId = sender.tab.id;

  // Receive message to retrieve tab ID
  if (request.action === 'GET_TAB_ID') {
    sendResponse(tabId);
  }
  // Receive message to update extension state
  if (request.action === 'UPDATE_ICON') {
    updateExtensionState(request.isEnabled);
  }
  // Recieve message to get border mode state
  if (request.action === 'GET_BORDER_MODE') {
    sendResponse(await getTabState({ tabId, key: 'borderMode' }));
  }
  // Recieve message to get inspector mode state
  if (request.action === 'GET_INSPECTOR_MODE') {
    sendResponse(await getTabState({ tabId, key: 'inspectorMode' }));
  }
});

/**
 * Injects the border.js and overlay.js scripts into the active tab.
 *
 * @param {number} tabId - The ID of the tab to inject the script into.
 */
async function injectScripts(tabId) {
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
 *
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
    const isEnabled = await getTabState({ tabId, key: 'inspectorMode' });

    // Send message to update inspector mode
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_INSPECTOR_MODE',
      isEnabled,
    });
  } catch (error) {
    console.error('Error sending message to content script:', error);
  }
}

// Handles keyboard shortcut commands
chrome.commands.onCommand.addListener(async command => {
  // Toggle the border for the active tab
  if (command === 'toggle_border_patrol') {
    const tab = await getActiveTab();

    // Validate if the tab is a valid webpage
    if (!tab?.url || isRestrictedUrl(tab.url)) return;
    if (!chrome || !chrome.storage) return;

    const tabId = tab.id;

    // Get and toggle the current state
    const isEnabled = await getTabState({ tabId, key: 'borderMode' });
    const newState = !isEnabled;

    // Store the new state using tab ID as the key
    setTabState({ tabId: tab.id, key: 'borderMode', value: newState });

    updateExtensionState(newState);

    // Apply changes to the active tab
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/border.js'],
    });
  }
});
