import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  DEFAULT_TAB_STATE,
} from './scripts/constants.js';
import { isRestrictedUrl, getActiveTab, Logger } from './scripts/helpers.js';

// In-memory cache for tab states. This helps reduce repeated calls to storage
const cachedTabStates = {}; // tabId: { borderMode: boolean, inspectorMode: boolean }

/**
 * Retrieves the extension state for the specified tab ID and key.
 * Checks cache first, then storage. Updates cache from storage.
 *
 * @param {{ tabId: number, key?: string }} options - Options to retrieve the tab state.
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
    Logger.error(
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
    Logger.info(
      `Updated tab state for tab ${tabId} in storage:`,
      cachedTabStates[tabIdString]
    );
  } catch (error) {
    Logger.error(`Error setting tab state for tab ${tabId} in storage:`, error);
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

    chrome.action.setTitle({
      tabId: tabId,
      title: isEnabled ? 'Border Patrol - Enabled' : 'Border Patrol - Disabled',
    });
    chrome.action.setIcon({
      tabId: tabId,
      path: isEnabled
        ? 'assets/icons/bp-icon-16.png'
        : 'assets/icons/bp-icon-16-disabled.png',
    });
  } catch (error) {
    Logger.error(`Error updating extension state for tab ${tabId}:`, error);

    // Fallback to default state
    chrome.action.setTitle({ tabId: tabId, title: 'Border Patrol - Disabled' });
    chrome.action.setIcon({
      tabId: tabId,
      path: 'assets/icons/bp-icon-16-disabled.png',
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
      // Check if scripts are already injected by sending a ping
      await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      // If we get a response, scripts are already injected
      Logger.info(`Scripts already injected in tab ${tabId}.`);
      return;
    } catch (error) {
      Logger.info(`Scripts likely not injected in tab ${tabId}.`);
      // Continue with injection
    }

    // Inject overlay styles into the active tab
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['styles/overlay.css'],
    });

    // Inject border.js and overlay.js into the active tab
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/border.js', 'scripts/overlay.js'],
    });

    Logger.info(`Injected content scripts and CSS into tab ${tabId}`);
  } catch (error) {
    Logger.error(`Error injecting scripts or CSS into tab ${tabId}:`, error);
  }
}

/**
 * Sends the current state of border and inspector modes, and border settings
 * to the content script in the specified tab. This should be called after state changes.
 *
 * @param {number} tabId - The ID of the tab.
 */
async function sendContentScriptUpdates(tabId) {
  if (!tabId) return;

  try {
    // Retrieve the current state for the tab
    const tabState = await getTabState({ tabId });

    // Send messages to update modes in the content script
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_BORDER_MODE',
      isEnabled: tabState.borderMode,
    });
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_INSPECTOR_MODE',
      isEnabled: tabState.inspectorMode,
    });
    Logger.info(`Sent mode updates to tab ${tabId}:`, tabState);

    // Send border settings to the content script
    const settings = await chrome.storage.local.get([
      'borderSize',
      'borderStyle',
    ]);
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_BORDER_SETTINGS',
      borderSize: settings.borderSize ?? DEFAULT_BORDER_SIZE,
      borderStyle: settings.borderStyle ?? DEFAULT_BORDER_STYLE,
    });
    Logger.info(`Sent border settings update to tab ${tabId}:`, settings);
  } catch (error) {
    Logger.warn(`Error sending content script updates to tab ${tabId}:`, error);
  }
}

/**
 * Handles state changes for a specific tab.
 * Updates storage, extension state (icon/title), and sends updates to content scripts.
 *
 * @param {Object} options - Options for handling the tab state change.
 * @param {number} options.tabId - The ID of the tab.
 * @param {Object} [options.states] - The partial state object to merge (e.g., { borderMode: true }).
 */
async function handleTabStateChange({ tabId, states }) {
  if (!tabId) return;

  // Ensure scripts are injected first if needed (Chrome handles not injecting duplicates)
  await ensureScriptIsInjected(tabId);

  if (states) {
    // Update the state in storage and cache
    await setTabState({ tabId, states });
  }

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
  Logger.info('onInstalled', details);

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
    // await chrome.storage.local.clear(); // Commenting this out to preserve settings on update

    // Combine existing settings with defaults (existing takes precedence)
    const settingsToSet = { ...defaultGlobalSettings, ...existingStorage };
    // Set the default settings in storage
    await chrome.storage.local.set(settingsToSet);
  } catch (error) {
    Logger.error('Error during onInstalled:', error);
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
  Logger.info('onUpdated', tabId, changeInfo, tab);

  // Validate if the tab is a valid webpage
  if (!tabId || !tab?.url || isRestrictedUrl(tab.url)) return;

  if (changeInfo.status === 'complete') {
    await handleTabStateChange({ tabId });
  }
});

/**
 * Handles tab activation (when switching tabs).
 * Injects scripts and updates state for the newly active tab.
 *
 * @param {Object} activeInfo - Information about the activated tab.
 */
chrome.tabs.onActivated.addListener(async activeInfo => {
  Logger.info('onActivated', activeInfo);

  const tabId = activeInfo?.tabId;
  if (!tabId) return;

  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url || isRestrictedUrl(tab.url)) {
      Logger.info(`Restricted URL on activation, skipping: ${tab?.url}`);
      // Set icon to disabled for restricted tabs
      chrome.action.setTitle({
        tabId: tabId,
        title: 'Border Patrol - Restricted',
      });
      chrome.action.setIcon({
        tabId: tabId,
        path: 'assets/icons/bp-icon-16-disabled.png',
      });
      return;
    }

    await handleTabStateChange({ tabId });
  } catch (error) {
    Logger.error(`Error in onActivated for tab ${tabId}:`, error);
    // Disable extention state if there's an error
    chrome.action.setTitle({ tabId: tabId, title: 'Border Patrol - Disabled' });
    chrome.action.setIcon({
      tabId: tabId,
      path: 'assets/icons/bp-icon-16-disabled.png',
    });
  }
});

// Handles recieving messages from popup and content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  Logger.info('Received message:', request, 'from sender:', sender);

  // Check if the sender has a tab ID (messages from popup don't)
  const tabId = sender?.tab?.id;

  // Handle messages from the popup (no sender.tab.id)
  if (!tabId) {
    try {
      // Get the active tab to determine which tab the popup is associated with
      const activeTab = await getActiveTab();
      if (!activeTab?.id || !activeTab?.url || isRestrictedUrl(activeTab.url))
        return;

      // Use the active tab's ID for processing popup messages
      const activeTabId = activeTab.id;

      // Receive message to toggle border mode
      if (request.action === 'TOGGLE_BORDER_MODE') {
        const currentBorderState = await getTabState({ tabId: activeTabId });
        const newBorderState = !currentBorderState.borderMode;
        await handleTabStateChange({
          tabId: activeTabId,
          states: { borderMode: newBorderState },
        });
        return true; // Indicate async handling
      }
      // Receive message to toggle inspector mode
      else if (request.action === 'TOGGLE_INSPECTOR_MODE') {
        const currentInspectorState = await getTabState({
          tabId: activeTabId,
        });
        const newInspectorState = !currentInspectorState.inspectorMode;
        await handleTabStateChange({
          tabId: activeTabId,
          states: { inspectorMode: newInspectorState },
        });
        return true; // Indicate async handling
      }
      // Receive message to update border settings
      else if (request.action === 'UPDATE_BORDER_SETTINGS') {
        // Get new border settings from request
        const { borderSize, borderStyle } = request;
        // Update the settings in storage
        await chrome.storage.local.set({ borderSize, borderStyle });

        // Send update to content script immediately if border mode is active
        const tabState = await getTabState({ tabId: activeTabId });
        if (tabState.borderMode) {
          try {
            await chrome.tabs.sendMessage(activeTabId, {
              action: 'UPDATE_BORDER_SETTINGS',
              borderSize: borderSize ?? DEFAULT_BORDER_SIZE,
              borderStyle: borderStyle ?? DEFAULT_BORDER_STYLE,
            });
          } catch (contentScriptError) {
            Logger.error(
              `Error sending updated border settings to tab ${activeTabId}:`,
              contentScriptError
            );
          }
        }
      } else {
        Logger.warn('Received unknown message from popup:', request);
        return false; // No action matched
      }

      return true; // Indicate async handling for popup messages
    } catch (error) {
      Logger.error('Error handling popup message:', error);
      return false; // An error occurred
    }
  } else {
    // Handle messages from content scripts (have sender.tab.id)
    if (!sender?.tab?.url || isRestrictedUrl(sender?.tab?.url)) return false;

    // Receive message to retrieve tab ID
    if (request.action === 'GET_TAB_ID') {
      sendResponse(tabId);
      return true; // Indicate async handling
    }
    // Recieve message to get border mode state
    else if (request.action === 'GET_BORDER_MODE') {
      const borderState = await getTabState({
        tabId: tabId,
        key: 'borderMode',
      });
      sendResponse(borderState);
      return true; // Indicate async handling
    }
    // Recieve message to get inspector mode state
    else if (request.action === 'GET_INSPECTOR_MODE') {
      const inspectorState = await getTabState({
        tabId: tabId,
        key: 'inspectorMode',
      });
      sendResponse(inspectorState);
      return true; // Indicate async handling
    }
    // Recieve message to ping
    else if (request.action === 'PING') {
      // Respond to PING message for injection check
      sendResponse({ status: 'PONG' });
      return true; // Indicate async handling
    }
    // No action matched for content script message
    return false;
  }
});

// Handles keyboard shortcut commands
chrome.commands.onCommand.addListener(async command => {
  Logger.info('Command received:', command);

  // Toggle the border for the active tab
  if (command === 'toggle_border_patrol') {
    const tab = await getActiveTab();

    // Validate if the tab is a valid webpage
    if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) {
      Logger.warn('Ignoring command on restricted or invalid tab.');
      return;
    }

    const tabId = tab.id;

    // Get current state
    const currentState = await getTabState({ tabId });
    // Toggle border mode
    const newState = !currentState.borderMode;

    Logger.info(`Toggling border mode for tab ${tabId}:`, newState);

    // Handle the state change centrally
    await handleTabStateChange({ tabId, states: { borderMode: newState } });
  }
});
