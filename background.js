import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  DEFAULT_TAB_STATE,
} from './scripts/constants.js';
import { isRestrictedUrl, getActiveTab } from './scripts/helpers.js';

// In-memory cache for tab states. This helps reduce repeated calls to storage
const cachedTabStates = {}; // tabId: { borderMode: boolean, inspectorMode: boolean }

/**
 * Retrieves the extension state for the specified tab ID and key.
 * Checks cache first, then storage. Updates cache from storage.
 *
 * @param {{ tabId: number, key: string }} options - Options to retrieve the tab state.
 * @param {number} options.tabId - The ID of the tab to retrieve the state for.
 * @param {string} [options.key] - Optional. The key of the state to retrieve. If not provided, returns the entire state.
 * @returns {Promise<boolean | Object>} The state of the extension for the specified tab ID and key, or the full state object.
 */
async function getTabState({ tabId, key }) {
  const tabIdString = tabId.toString();

  // Check if state exists in cache first
  if (cachedTabStates?.[tabIdString]) {
    if (key) return cachedTabStates[tabIdString][key] ?? DEFAULT_TAB_STATE[key];
    else return cachedTabStates[tabIdString];
  }

  try {
    // Retrieve state from storage if not in cache
    const storedData = await chrome.storage.local.get(tabIdString);
    const tabState = storedData?.[tabIdString];

    // Update cache with retrieved state
    cachedTabStates[tabIdString] = tabState ?? { ...DEFAULT_TAB_STATE };

    if (key) return cachedTabStates[tabIdString][key] ?? DEFAULT_TAB_STATE[key];
    else return cachedTabStates[tabIdString];
  } catch (error) {
    console.error(
      `Error retrieving tab state for tab ${tabId} from storage:`,
      error
    );
    // Return default state on error
    if (key) return DEFAULT_TAB_STATE[key] ?? false;
    return { ...DEFAULT_TAB_STATE };
  }
}

/**
 * Updates and stores the extension states for a specified tab.
 * Updates the cache and storage.
 *
 * @param {{ tabId: number, states: Object }} options - Options to set the tab states.
 * @param {number} options.tabId - The ID of the tab to set the states for.
 * @param {Object} options.states - An object containing the states to be updated.
 */
async function setTabState({ tabId, states }) {
  const tabIdString = tabId.toString();

  // Get current state (this will populate the cache if not already populated)
  const currentState = await getTabState({ tabId });

  // Merge the new states into the existing cached states
  cachedTabStates[tabIdString] = { ...currentState, ...states };

  // Persist the updated state to storage
  try {
    await chrome.storage.local.set({
      [tabIdString]: cachedTabStates[tabIdString],
    });
    console.log(
      `Updated tab state for tab ${tabId} in storage:`,
      cachedTabStates[tabIdString]
    );
  } catch (error) {
    console.error(
      `Error setting tab state for tab ${tabId} in storage:`,
      error
    );
  }
}

/**
 * Updates the extension state (icon and title) based on the active tab's state.
 * The extension is considered enabled if either borderMode or inspectorMode is enabled for the active tab.
 *
 * @param {number} tabId - The ID of the active tab.
 */
async function updateExtensionState(tabId) {
  try {
    const tabState = await getTabState({ tabId });
    const isEnabled = tabState?.borderMode || tabState?.inspectorMode;
    console.log(
      `Updating extension state for tab ${tabId}:`,
      tabState,
      isEnabled
    );

    chrome.action.setTitle({
      tabId: tabId,
      title: isEnabled ? 'Border Patrol - Enabled' : 'Border Patrol - Disabled',
    });
    chrome.action.setIcon({
      tabId: tabId,
      path: isEnabled
        ? 'icons/border-patrol-icon-16.png'
        : 'icons/border-patrol-icon-16-disabled.png',
    });
  } catch (error) {
    console.error(`Error updating extension state for tab ${tabId}:`, error);

    // Fallback to default state
    chrome.action.setTitle({ tabId: tabId, title: 'Border Patrol - Disabled' });
    chrome.action.setIcon({
      tabId: tabId,
      path: 'icons/border-patrol-icon-16-disabled.png',
    });
  }
}

/**
 * Executed when the extension is installed or updated.
 * Clears any previous (tab specific) state and initializes with default settings.
 * Keeps global state such as borderSize and borderStyle.
 */
chrome.runtime.onInstalled.addListener(async details => {
  console.log('onInstalled', details);

  try {
    // Get state that should be preserved
    const preservedState = await chrome.storage.local.get([
      'borderSize',
      'borderStyle',
    ]);

    // Clear all storage data
    await chrome.storage.local.clear();

    // Combine preserved state with default state and set
    const newState = { ...DEFAULT_TAB_STATE, ...preservedState };
    await chrome.storage.local.set(newState);
  } catch (error) {
    console.error('Error during onInstalled:', error);
  }
});

/**
 * Injects the border script when a tab is updated (when a page loads or reloads).
 *
 * @param {number} tabId - The ID of the tab that has been updated.
 * @param {Object} changeInfo - Information about the change to the tab.
 * @param {Object} tab - The tab object.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log('onUpdated', tabId, changeInfo, tab);

  // Validate if the tab is a valid webpage
  if (!tabId || !tab?.url || isRestrictedUrl(tab.url)) return;

  if (changeInfo.status === 'complete') {
    updateExtensionState(tabId);
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
  console.log('onActivated', activeInfo);

  const tabId = activeInfo?.tabId;
  if (!tabId) return;

  updateExtensionState(tabId);
  injectScripts(tabId);
  sendInspectorModeUpdate(tabId);
});

/**
 * Toggles the extension state when the extension icon is clicked.
 *
 * @param {Object} tab - The tab object.
 */
chrome.action.onClicked.addListener(async tab => {
  console.log('onClicked', tab);

  // Validate if the tab is a valid webpage
  if (!tabId || !tab?.url || isRestrictedUrl(tab.url)) return;

  // Get tab ID
  const tabId = tab.id;

  // Get and toggle the current state
  const isEnabled = await getTabState({ tabId, key: 'borderMode' });
  const newState = !isEnabled;

  // Store the new state using tab ID as the key
  setTabState({ tabId, states: { borderMode: newState } });

  updateExtensionState(tabId);
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
      console.log('Received message from popup:', request);
      if (!request.tabId) return;
      updateExtensionState(request.tabId);
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
    updateExtensionState(tabId);
    return;
  }
  // Recieve message to get border mode state
  if (request.action === 'GET_BORDER_MODE') {
    const state = await getTabState({ tabId, key: 'borderMode' });
    sendResponse(state);
  }
  // Recieve message to get inspector mode state
  if (request.action === 'GET_INSPECTOR_MODE') {
    const state = await getTabState({ tabId, key: 'inspectorMode' });
    sendResponse(state);
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
    setTabState({ tabId, states: { borderMode: newState } });

    updateExtensionState(tabId);

    // Apply changes to the active tab
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/border.js'],
    });
  }
});
