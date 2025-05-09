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
 * Injects the content scripts and CSS into a tab if needed.
 * This should only happen once per tab session (on load/activate).
 *
 * @param {number} tabId - The ID of the tab.
 */
async function ensureScriptIsInjected(tabId) {
  if (!tabId) return;

  try {
    // Check if the tab is a valid webpage
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url || isRestrictedUrl(tab.url)) return;

    try {
      // Check if scripts are already injected
      await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      console.log(`Scripts likely already injected in tab ${tabId}.`);
      // return;  // No need to inject again
    } catch (error) {
      console.log(`Scripts likely not injected in tab ${tabId}.`);
      // Continue with injection
    }

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

    console.log(`Injected content scripts and CSS into tab ${tabId}`);
  } catch (error) {
    console.error(`Error injecting scripts or CSS into tab ${tabId}:`, error);
  }
}

/**
 * Sends the current state of border and inspector modes to the content script in the specified tab.
 * This should be called after state changes.
 *
 * @param {number} tabId - The ID of the tab.
 */
async function sendContentScriptUpdates(tabId) {
  if (!tabId) return;

  try {
    // Retrieve the current state for the tab
    const tabState = await getTabState({ tabId });

    // Send messages to update modes in the content script
    // TODO: Could combine these to reduce requests
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_BORDER_MODE',
      isEnabled: tabState.borderMode,
    });
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_INSPECTOR_MODE',
      isEnabled: tabState.inspectorMode,
    });
    console.log(`Sent mode updates to tab ${tabId}:`, tabState);

    // Also send current border settings on state updates, just in case the content script needs them
    const settings = await chrome.storage.local.get([
      'borderSize',
      'borderStyle',
    ]);
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_BORDER_SETTINGS', // Re-using this action name
      tabId: tabId,
      borderSize: settings.borderSize ?? DEFAULT_BORDER_SIZE,
      borderStyle: settings.borderStyle ?? DEFAULT_BORDER_STYLE,
    });
    console.log(`Sent border settings update to tab ${tabId}:`, settings);
  } catch (error) {
    console.warn(
      `Error sending content script updates to tab ${tabId}:`,
      error
    );
  }
}

/**
 * Handles state changes for a specific tab.
 * Updates storage, extension state (icon/title), and sends updates to content scripts.
 *
 * @param {number} tabId - The ID of the tab.
 * @param {Object} statesToUpdate - The partial state object to merge (e.g., { borderMode: true }).
 */
async function handleTabStateChange(tabId, statesToUpdate) {
  if (!tabId) return;

  // Ensure scripts are injected first if needed (Chrome handles not injecting duplicates)
  await ensureScriptIsInjected(tabId);

  // Update the state in storage and cache
  await setTabState({ tabId, states: statesToUpdate });

  // Update the extension icon and title based on the NEW state
  await updateExtensionState(tabId);

  // Send the NEW state to the content script(s)
  await sendContentScriptUpdates(tabId);
}

/**
 * Executed when the extension is installed or updated.
 * Initializes default settings and potentially clears old per-tab state keys.
 */
chrome.runtime.onInstalled.addListener(async details => {
  console.log('onInstalled', details);

  try {
    // Define default global settings
    const defaultGlobalSettings = {
      borderSize: DEFAULT_BORDER_SIZE,
      borderStyle: DEFAULT_BORDER_STYLE,
    };

    // Get the existing state from storage if it exists
    const existingStorage = await chrome.storage.local.get([
      'borderSize',
      'borderStyle',
    ]);

    // Clear all storage data
    await chrome.storage.local.clear();

    // Combine existing settings with defaults (existing takes precedence)
    const settingsToSet = { ...defaultGlobalSettings, ...existingStorage };
    // Set the default settings in storage
    await chrome.storage.local.set(settingsToSet);
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
    // Ensure scripts are injected and send initial state
    // Pass empty object to avoid overwriting state since nothing changed
    await handleTabStateChange(tabId, {});
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

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url || isRestrictedUrl(tab.url)) {
      console.log(`Restricted URL on activation, skipping: ${tab?.url}`);
      // Consider setting icon to disabled for restricted tabs
      chrome.action.setTitle({
        tabId: tabId,
        title: 'Border Patrol - Restricted',
      });
      chrome.action.setIcon({
        tabId: tabId,
        path: 'icons/border-patrol-icon-16-disabled.png',
      });
      return;
    }

    // Ensure scripts are injected and send current state
    await handleTabStateChange(tabId, {}); // Pass empty object to avoid overwriting state
  } catch (error) {
    console.error(`Error in onActivated for tab ${tabId}:`, error);
    // Disable extention state if there's an error
    chrome.action.setTitle({ tabId: tabId, title: 'Border Patrol - Disabled' });
    chrome.action.setIcon({
      tabId: tabId,
      path: 'icons/border-patrol-icon-16-disabled.png',
    });
  }
});

/**
 * Toggles the extension state when the extension icon is clicked.
 *
 * @param {Object} tab - The tab object.
 */
chrome.action.onClicked.addListener(async tab => {
  console.log('onClicked', tab);
  // Actions are now handled via the popup UI and keyboard commands
});

// Handles recieving messages from content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('Received message:', request, 'from sender:', sender);

  // Check if the sender has a tab ID (possibly from popup)
  if (!sender?.tab?.id) {
    const tab = await getActiveTab();

    // Validate if the tab is a valid webpage
    if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) return;
    const tabId = tab.id;

    // Receive message to get initial popup state
    if (request.action === 'GET_INITIAL_POPUP_STATE') {
      const tabState = await getTabState({ tabId });
      const borderSettings = await chrome.storage.local.get([
        'borderSize',
        'borderStyle',
      ]);
      console.log('Initial state:', { tabState, borderSettings });
      sendResponse({ tabState, borderSettings });
      return true; // Indicate async handling
    }
    // Receive message to update border mode
    if (request.action === 'TOGGLE_BORDER_MODE') {
      const currentBorderState = await getTabState({ tabId });
      const newBorderState = !currentBorderState.borderMode;
      await handleTabStateChange(tabId, { borderMode: newBorderState });
      sendResponse(newBorderState);
      return true; // Indicate async handling
    }
    // Receive message to update inspector mode
    if (request.action === 'TOGGLE_INSPECTOR_MODE') {
      const currentInspectorState = await getTabState({ tabId });
      const newInspectorState = !currentInspectorState.inspectorMode;
      await handleTabStateChange(tabId, { inspectorMode: newInspectorState });
      sendResponse(newInspectorState);
      return true; // Indicate async handling
    }
    // Receive message to update border settings
    if (request.action === 'UPDATE_BORDER_SETTINGS') {
      // Get new border settings from request
      const { borderSize, borderStyle } = request;
      // Update the settings in storage
      await chrome.storage.local.set({
        borderSize,
        borderStyle,
      });
      console.log('Updated border settings:', { borderSize, borderStyle });
      sendResponse({ borderSize, borderStyle });
      return true; // Indicate async handling
    }

    // Return false if sendResponse is not called asynchronously
    return false;
  }

  if (!sender?.tab?.url || isRestrictedUrl(sender?.tab?.url)) return;

  const tabId = sender.tab.id;

  // Receive message to retrieve tab ID
  if (request.action === 'GET_TAB_ID') {
    sendResponse(tabId);
    return true; // Indicate async handling
  }
  // Recieve message to get border mode state
  if (request.action === 'GET_BORDER_MODE') {
    const borderState = await getTabState({ tabId, key: 'borderMode' });
    sendResponse(borderState);
    return true; // Indicate async handling
  }
  // Recieve message to get inspector mode state
  if (request.action === 'GET_INSPECTOR_MODE') {
    const inspectorState = await getTabState({ tabId, key: 'inspectorMode' });
    sendResponse(inspectorState);
    return true; // Indicate async handling
  }
  // Recieve message to ping
  if (request.action === 'PING') {
    // Respond to PING message for injection check
    sendResponse({ status: 'PONG' });
    return true; // Indicate async handling
  }

  // Return false if no action matched
  return false;
});

// Handles keyboard shortcut commands
chrome.commands.onCommand.addListener(async command => {
  console.log('Command received:', command);

  // Toggle the border for the active tab
  if (command === 'toggle_border_patrol') {
    const tab = await getActiveTab();

    // Validate if the tab is a valid webpage
    if (!tabId || !tab?.url || isRestrictedUrl(tab.url)) return;

    const tabId = tab.id;

    // Get current state
    const currentState = await getTabState({ tabId });
    // Toggle border mode
    const newState = !currentState.borderMode;

    console.log(`Command toggling border mode for tab ${tabId} to ${newState}`);

    // Handle the state change centrally
    await handleTabStateChange(tabId, { borderMode: newState });
  }
});
