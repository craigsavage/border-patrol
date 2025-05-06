import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  DEFAULT_TAB_STATE,
} from './scripts/constants.js';
import { isRestrictedUrl, getActiveTab } from './scripts/helpers.js';

// In-memory cache for tab states
const cachedTabStates = {}; // tabId: { borderMode: boolean, inspectorMode: boolean }

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
  if (cachedTabStates?.[tabIdString]) {
    console.log('getTabState from cache', cachedTabStates[tabIdString]);
    if (key) return cachedTabStates[tabIdString][key];
    else return cachedTabStates[tabIdString];
  }

  try {
    // Retrieve state from storage if it doesn't exist in cache
    const storedData = await chrome.storage.local.get(tabIdString);
    console.log('getTabState from storage', storedData);
    const tabState = storedData?.[tabIdString];

    // Save state to cache
    cachedTabStates[tabIdString] = tabState ?? { ...DEFAULT_TAB_STATE };

    if (key) return tabState?.[key] ?? false;
    else return tabState ?? { ...DEFAULT_TAB_STATE };
  } catch (error) {
    // Ignore errors
    console.error('Error retrieving tab state from storage:', error);
    if (key) return false;
    return { ...DEFAULT_TAB_STATE };
  }
}

/**
 * Updates and stores the extension states for a specified tab.
 *
 * @param {{ tabId: number, states: Object }} options - Options to set the tab states.
 * @param {number} options.tabId - The ID of the tab to set the states for.
 * @param {Object} options.states - An object containing the states to be updated.
 */
function setTabState({ tabId, states }) {
  const tabIdString = tabId.toString();

  // Ensure the cache has a default state for the tab
  cachedTabStates[tabIdString] = cachedTabStates[tabIdString] ?? {
    borderMode: false,
    inspectorMode: false,
  };

  // Merge the new states into the existing cached states
  cachedTabStates[tabIdString] = { ...cachedTabStates[tabIdString], ...states };

  // Persist the updated state to Chrome's local storage
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
 * Executed when the extension is installed or updated.
 * Clears any previous state and initializes the extension state and default settings.
 *
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
  setTabState({ tabId, states: { borderMode: newState } });

  updateExtensionState(newState);
  injectScripts(tabId);
  sendInspectorModeUpdate(tabId);
});

// Handles recieving messages from content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('Received message from content script:', request, sender);

  // Check if the sender has a tab ID (possibly from popup)
  if (!sender?.tab?.id) {
    // Handle message from popup (sender.tab.id is undefined)
    if (request.action === 'UPDATE_ICON') {
      updateExtensionState(request.isEnabled);
    }
    return;
  }

  if (!sender?.tab?.url || isRestrictedUrl(sender?.tab?.url)) return;

  const tabId = sender.tab.id;

  // Receive message to retrieve tab ID
  if (request.action === 'GET_TAB_ID') {
    sendResponse(tabId);
    return tabId;
  }
  // Receive message to update extension state
  if (request.action === 'UPDATE_ICON') {
    updateExtensionState(request.isEnabled);
    return;
  }
  // Recieve message to get border mode state
  if (request.action === 'GET_BORDER_MODE') {
    const state = await getTabState({ tabId, key: 'borderMode' });
    sendResponse(state);
    return state;
  }
  // Recieve message to get inspector mode state
  if (request.action === 'GET_INSPECTOR_MODE') {
    const state = await getTabState({ tabId, key: 'inspectorMode' });
    sendResponse(state);
    return state;
  }
  return;
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
    setTabState({ tabId, states: { borderMode: newState } });

    updateExtensionState(newState);

    // Apply changes to the active tab
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/border.js'],
    });
  }
});
