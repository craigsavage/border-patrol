import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  DEFAULT_TAB_STATE,
  ICON_PATHS,
} from './scripts/constants';
import {
  isRestrictedUrl,
  getActiveTab,
  hasPermission,
  isChromeTabClosedError,
} from './scripts/helpers';
import { getTimestampedScreenshotFilename } from './scripts/utils/filename';
import Logger from './scripts/utils/logger';
import type { TabState, TabStateChangeOptions } from './types/background';

// In-memory cache for tab states. This helps reduce repeated calls to storage
const cachedTabStates: Record<string, TabState> = {}; // tabId: TabState

/**
 * Retrieves the extension state for the specified tab ID.
 * Checks cache first, then storage. Updates cache from storage.
 *
 * @param tabId - The ID of the tab to retrieve the state for.
 * @returns The state of the extension for the specified tab ID.
 */
async function getTabState(tabId: number): Promise<TabState> {
  const tabIdString = tabId.toString();

  // Check if state exists in cache first
  if (cachedTabStates?.[tabIdString]) {
    return cachedTabStates[tabIdString];
  }

  try {
    // Retrieve state from storage if not in cache
    const storedData = await chrome.storage.local.get(tabIdString);
    const tabState = storedData?.[tabIdString];

    // Update cache with retrieved state
    cachedTabStates[tabIdString] = tabState ?? { ...DEFAULT_TAB_STATE };
    return cachedTabStates[tabIdString];
  } catch (error) {
    Logger.error(
      `Error retrieving tab state for tab ${tabId} from storage:`,
      error
    );
    // Return default state on error
    return { ...DEFAULT_TAB_STATE };
  }
}

/**
 * Updates and stores the extension states for a specified tab.
 * Updates the cache and storage.
 *
 * @param options - Options to set the tab states.
 */
async function setTabState({
  tabId,
  states,
}: TabStateChangeOptions): Promise<void> {
  const tabIdString = tabId.toString();

  // Get current state (this will populate the cache if not already populated)
  const currentState = await getTabState(tabId);

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
 * @param tabId - The ID of the active tab.
 */
async function updateExtensionState(tabId: number): Promise<void> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url) return;

    const isRestricted = isRestrictedUrl(tab.url);
    const tabState = await getTabState(tabId);
    const isActive = tabState.borderMode || tabState.inspectorMode;

    // Set the extension title
    const title = isRestricted
      ? 'Border Patrol - Restricted'
      : isActive
        ? 'Border Patrol - Active'
        : 'Border Patrol - Inactive';

    // Set the extension title
    await chrome.action.setTitle({ tabId, title });

    // Set the extension icon
    const iconPath =
      isRestricted || !isActive ? ICON_PATHS.iconDisabled : ICON_PATHS.icon16;

    await chrome.action.setIcon({ tabId, path: iconPath });
  } catch (error) {
    if (isChromeTabClosedError(error)) {
      Logger.warn(`Tab ${tabId} has been closed or is invalid.`);
    } else {
      Logger.error(`Error updating extension state for tab ${tabId}:`, error);
    }

    // Fallback to default state
    await chrome.action.setTitle({ tabId, title: 'Border Patrol - Error' });
    await chrome.action.setIcon({ tabId, path: ICON_PATHS.iconDisabled });
  }
}

/**
 * Injects the content scripts and CSS into a tab if needed.
 * This should only happen once per tab session (on load/activate).
 *
 * @param tabId - The ID of the tab.
 */
async function ensureScriptIsInjected(tabId: number): Promise<void> {
  if (!tabId) return;

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

  try {
    // Inject overlay styles into the active tab
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['scripts/main-content.css'],
    });

    // Inject border.js and overlay.js into the active tab
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/main-content.js'],
    });

    Logger.info(`Injected content scripts and CSS into tab ${tabId}`);
  } catch (error) {
    if (isChromeTabClosedError(error)) return; // Tab has been closed
    Logger.error(`Error injecting scripts or CSS into tab ${tabId}:`, error);
  }
}

/**
 * Sends the current state of border and inspector modes, and border settings
 * to the content script in the specified tab. This should be called after state changes.
 *
 * @param tabId - The ID of the tab.
 */
async function sendContentScriptUpdates(tabId: number): Promise<void> {
  if (!tabId) return;

  try {
    // Retrieve the current state for the tab
    const tabState = await getTabState(tabId);

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
 * @param options - Options for handling the tab state change.
 */
async function handleTabStateChange({
  tabId,
  states,
}: TabStateChangeOptions): Promise<void> {
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
 * Captures a visible tab and downloads the screenshot.
 *
 * @param windowId - The ID of the window containing the tab to capture.
 */
async function captureAndDownloadScreenshot(windowId: number): Promise<void> {
  const format = 'png';
  try {
    // Capture the visible tab
    const screenshotUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format,
    });
    Logger.info('Screenshot captured successfully:', {
      windowId,
      screenshotUrl,
    });

    // Generate a filename with timestamp
    const filename = getTimestampedScreenshotFilename(format);
    Logger.info('Generated filename:', filename);

    // Download the screenshot using the downloads API
    await chrome.downloads.download({
      url: screenshotUrl,
      filename,
      saveAs: true, // Prompt user to choose location
      conflictAction: 'uniquify', // Add a number if filename exists
    });
  } catch (error) {
    Logger.error('Error in captureAndDownloadScreenshot:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Executed when the extension is installed or updated.
 * Initializes default settings and potentially clears old per-tab state keys.
 */
chrome.runtime.onInstalled.addListener(
  async (details: chrome.runtime.InstalledDetails) => {
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
  }
);

/**
 * Injects the border script when a tab is updated (when a page loads or reloads).
 *
 * @param {number} tabId - The ID of the tab that has been updated.
 * @param {Object} changeInfo - Information about the change to the tab.
 * @param {Object} tab - The tab object.
 */
chrome.tabs.onUpdated.addListener(
  async (
    tabId: number,
    changeInfo: { status?: string },
    tab: chrome.tabs.Tab
  ) => {
    Logger.info('onUpdated', tabId, changeInfo, tab);

    // Validate if the tab is a valid webpage
    if (!tabId || !tab?.url || isRestrictedUrl(tab.url)) return;

    if (changeInfo.status === 'complete') {
      try {
        await handleTabStateChange({ tabId });
      } catch (error) {
        if (isChromeTabClosedError(error)) return; // Tab has been closed
        Logger.error(`Error in onUpdated for tab ${tabId}:`, error);
      }
    }
  }
);

/**
 * Handles tab activation (when switching tabs).
 * Injects scripts and updates state for the newly active tab.
 *
 * @param {Object} activeInfo - Information about the activated tab.
 */
chrome.tabs.onActivated.addListener(
  async (activeInfo: { tabId: number; windowId: number }) => {
    Logger.info('onActivated', activeInfo);

    const tabId = activeInfo?.tabId;
    if (!tabId) return;

    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab?.url || isRestrictedUrl(tab.url)) {
        Logger.info(`Restricted URL on activation, skipping: ${tab?.url}`);
        // Set icon to disabled for restricted tabs
        chrome.action.setTitle({ tabId, title: 'Border Patrol - Restricted' });
        chrome.action.setIcon({ tabId, path: ICON_PATHS.iconDisabled });
        return;
      }

      await handleTabStateChange({ tabId });
    } catch (error) {
      if (isChromeTabClosedError(error)) {
        Logger.warn(`Tab ${tabId} has been closed or is invalid.`);
      } else {
        Logger.error(`Error in onActivated for tab ${tabId}:`, error);
      }
      // Disable extention state if there's an error
      chrome.action.setTitle({ tabId, title: 'Border Patrol - Disabled' });
      chrome.action.setIcon({ tabId, path: ICON_PATHS.iconDisabled });
    }
  }
);

// Handles clearing cache and storage on tab removal (when closing tabs)
chrome.tabs.onRemoved.addListener(
  async (
    tabId: number,
    removeInfo: { windowId: number; isWindowClosing: boolean }
  ) => {
    Logger.info('onRemoved', tabId, removeInfo);

    // Remove the tab state from the cache
    delete cachedTabStates[tabId];

    // Optionally clear storage for the tab if needed
    try {
      await chrome.storage.local.remove(tabId.toString());
      Logger.info(`Cleared storage for tab ${tabId}`);
    } catch (error) {
      Logger.error(`Error clearing storage for tab ${tabId}:`, error);
    }
  }
);

// Handles recieving messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  async (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
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
        Logger.info(
          `Handling popup message for active tab ${activeTabId}:`,
          activeTab
        );

        // Receive message to toggle border mode
        if (request.action === 'TOGGLE_BORDER_MODE') {
          const currentBorderState = await getTabState(activeTabId);
          const newBorderState = !currentBorderState.borderMode;
          await handleTabStateChange({
            tabId: activeTabId,
            states: { borderMode: newBorderState },
          });
          return true; // Indicate async handling
        }
        // Receive message to toggle inspector mode
        else if (request.action === 'TOGGLE_INSPECTOR_MODE') {
          const currentInspectorState = await getTabState(activeTabId);
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
          const tabState = await getTabState(activeTabId);
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
        }
        // Handle screenshot request from popup
        else if (request.action === 'CAPTURE_SCREENSHOT') {
          try {
            // Check if we have the downloads permission
            const hasDownloadPermission = await hasPermission('downloads');

            if (!hasDownloadPermission) {
              Logger.warn(
                'Attempted to take screenshot without download permission'
              );
              return false;
            }

            // Check if the active tab is a valid target
            if (!activeTab || !activeTab.windowId) {
              Logger.error('No active tab available for screenshot');
              return false;
            }

            await captureAndDownloadScreenshot(activeTab.windowId);
            sendResponse(true);
            return true; // Success
          } catch (error) {
            Logger.error('Error in CAPTURE_SCREENSHOT handler:', error);
            return false; // Indicate failure
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
        const tabState = await getTabState(tabId);
        sendResponse(tabState.borderMode);
        return true; // Indicate async handling
      }
      // Recieve message to get inspector mode state
      else if (request.action === 'GET_INSPECTOR_MODE') {
        const tabState = await getTabState(tabId);
        sendResponse(tabState.inspectorMode);
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
  }
);

// Handles keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command: string) => {
  Logger.info('Command received:', command);

  // Toggle the border for the active tab
  if (command === 'toggle_border_mode') {
    let tabId;

    try {
      // Get the active tab to determine which tab to toggle
      const activeTab = await getActiveTab();
      if (!activeTab?.id || !activeTab?.url || isRestrictedUrl(activeTab.url)) {
        Logger.warn('Ignoring command on restricted or invalid tab.');
        return;
      }
      tabId = activeTab.id;

      // Get current state and toggle border mode
      const currentState = await getTabState(tabId);
      const newState = !currentState.borderMode;

      // Handle the state change centrally
      await handleTabStateChange({ tabId, states: { borderMode: newState } });
    } catch (error) {
      Logger.error(`Error toggling border mode for tab ${tabId}:`, error);
      return;
    }
  }

  // Toggle the inspector for the active tab
  else if (command === 'toggle_inspector_mode') {
    let tabId;

    try {
      // Get the active tab to determine which tab to toggle
      const activeTab = await getActiveTab();
      if (!activeTab?.id || !activeTab?.url || isRestrictedUrl(activeTab.url)) {
        Logger.warn('Ignoring command on restricted or invalid tab.');
        return;
      }
      tabId = activeTab.id;

      // Get current state and toggle inspector mode
      const currentState = await getTabState(tabId);
      const newState = !currentState.inspectorMode;

      // Handle the state change centrally
      await handleTabStateChange({
        tabId,
        states: { inspectorMode: newState },
      });
    } catch (error) {
      Logger.error(`Error toggling inspector mode for tab ${tabId}:`, error);
      return;
    }
  } else {
    Logger.warn('Unknown command received:', command);
  }
});
