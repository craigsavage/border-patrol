import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  ICON_PATHS,
} from './scripts/constants';
import {
  isRestrictedUrl,
  getActiveTab,
  hasPermission,
  isChromeTabClosedError,
} from './scripts/helpers';
import Logger from './scripts/utils/logger';
import { handleTabStateChange } from './background/extension-ui';
import {
  captureAndDownloadScreenshot,
  captureAndDownloadFullPageScreenshot,
} from './background/screenshot';
import { clearTabStateCache, getTabState } from './background/tab-state';

/**
 * Creates the "Border Patrol" context menu with sub-items to toggle each mode.
 * Removes any existing items first to avoid duplicates on reinstall.
 */
function setupContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'bp-parent',
      title: chrome.i18n.getMessage('extensionName'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-border-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleBorderModeCommand'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-inspector-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleInspectorModeCommand'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-measurement-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleMeasurementModeCommand'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-ruler-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleRulerModeCommand'),
      contexts: ['all'],
    });

    Logger.info('Context menu created.');
  });
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
        darkMode: false,
      };

      // Get the existing state from storage if it exists
      const existingStorage = await chrome.storage.local.get([
        'borderSize',
        'borderStyle',
        'darkMode',
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

    // Set up the right-click context menu
    setupContextMenu();
  },
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
    tab: chrome.tabs.Tab,
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
  },
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
  },
);

// Handles clearing cache and storage on tab removal (when closing tabs)
chrome.tabs.onRemoved.addListener(
  async (
    tabId: number,
    removeInfo: { windowId: number; isWindowClosing: boolean },
  ) => {
    Logger.info('onRemoved', tabId, removeInfo);

    // Remove the tab state from the cache
    clearTabStateCache(tabId);

    // Optionally clear storage for the tab if needed
    try {
      await chrome.storage.local.remove(tabId.toString());
      Logger.info(`Cleared storage for tab ${tabId}`);
    } catch (error) {
      Logger.error(`Error clearing storage for tab ${tabId}:`, error);
    }
  },
);

// Handles receiving messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    Logger.info('Received message:', request, 'from sender:', sender);

    // Check if the sender has a tab ID (messages from popup don't)
    const tabId = sender?.tab?.id;

    // Handle messages from the popup (no sender.tab.id)
    if (!tabId) {
      void (async () => {
        try {
          // Get the active tab to determine which tab the popup is associated with
          const activeTab = await getActiveTab();
          if (
            !activeTab?.id ||
            !activeTab?.url ||
            isRestrictedUrl(activeTab.url)
          ) {
            sendResponse(false);
            return;
          }

          // Use the active tab's ID for processing popup messages
          const activeTabId = activeTab.id;
          Logger.info(
            `Handling popup message for active tab ${activeTabId}:`,
            activeTab,
          );

          // Receive message to toggle border mode
          if (request.action === 'TOGGLE_BORDER_MODE') {
            const currentBorderState = await getTabState(activeTabId);
            const newBorderState = !currentBorderState.borderMode;
            await handleTabStateChange({
              tabId: activeTabId,
              states: { borderMode: newBorderState },
            });
            sendResponse(true);
            return;
          }
          // Receive message to toggle inspector mode
          else if (request.action === 'TOGGLE_INSPECTOR_MODE') {
            const currentInspectorState = await getTabState(activeTabId);
            const newInspectorState = !currentInspectorState.inspectorMode;
            await handleTabStateChange({
              tabId: activeTabId,
              states: { inspectorMode: newInspectorState },
            });
            sendResponse(true);
            return;
          }
          // Receive message to toggle measurement mode
          else if (request.action === 'TOGGLE_MEASUREMENT_MODE') {
            const currentMeasurementState = await getTabState(activeTabId);
            const newMeasurementState =
              !currentMeasurementState.measurementMode;
            await handleTabStateChange({
              tabId: activeTabId,
              states: { measurementMode: newMeasurementState },
            });
            sendResponse(true);
            return;
          }
          // Receive message to toggle ruler mode
          else if (request.action === 'TOGGLE_RULER_MODE') {
            const currentRulerState = await getTabState(activeTabId);
            const newRulerState = !currentRulerState.rulerMode;
            await handleTabStateChange({
              tabId: activeTabId,
              states: { rulerMode: newRulerState },
            });
            sendResponse(true);
            return;
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
                  contentScriptError,
                );
              }
            }
            sendResponse(true);
            return;
          }
          // Handle screenshot request from popup
          else if (request.action === 'CAPTURE_SCREENSHOT') {
            try {
              // Check if we have the downloads permission
              const hasDownloadPermission = await hasPermission('downloads');

              if (!hasDownloadPermission) {
                Logger.warn(
                  'Attempted to take screenshot without download permission',
                );
                sendResponse(false);
                return;
              }

              // Check if the active tab is a valid target
              if (!activeTab || !activeTab.windowId) {
                Logger.error('No active tab available for screenshot');
                sendResponse(false);
                return;
              }

              await captureAndDownloadScreenshot(activeTab.windowId);
              sendResponse(true);
              return;
            } catch (error) {
              Logger.error('Error in CAPTURE_SCREENSHOT handler:', error);
              sendResponse(false);
              return;
            }
          }
          // Handle full-page screenshot request from popup
          else if (request.action === 'CAPTURE_FULL_SCREENSHOT') {
            try {
              const hasDownloadPermission = await hasPermission('downloads');

              if (!hasDownloadPermission) {
                Logger.warn(
                  'Attempted to take full-page screenshot without download permission',
                );
                sendResponse(false);
                return;
              }

              if (!activeTab || !activeTab.id || !activeTab.windowId) {
                Logger.error(
                  'No active tab available for full-page screenshot',
                );
                sendResponse(false);
                return;
              }

              await captureAndDownloadFullPageScreenshot(
                activeTab.id,
                activeTab.windowId,
              );
              sendResponse(true);
              return;
            } catch (error) {
              Logger.error('Error in CAPTURE_FULL_SCREENSHOT handler:', error);
              sendResponse(false);
              return;
            }
          } else {
            Logger.warn('Received unknown message from popup:', request);
            sendResponse(false);
            return;
          }
        } catch (error) {
          Logger.error('Error handling popup message:', error);
          sendResponse(false);
        }
      })();

      return true;
    } else {
      // Handle messages from content scripts (have sender.tab.id)
      if (!sender?.tab?.url || isRestrictedUrl(sender?.tab?.url)) return false;

      void (async () => {
        // Receive message to retrieve tab ID
        if (request.action === 'GET_TAB_ID') {
          sendResponse(tabId);
          return;
        }
        // Receive message to get border mode state
        else if (request.action === 'GET_BORDER_MODE') {
          const tabState = await getTabState(tabId);
          sendResponse(tabState.borderMode);
          return;
        }
        // Receive message to get inspector mode state
        else if (request.action === 'GET_INSPECTOR_MODE') {
          const tabState = await getTabState(tabId);
          sendResponse(tabState.inspectorMode);
          return;
        }
        // Receive message to get measurement mode state
        else if (request.action === 'GET_MEASUREMENT_MODE') {
          const tabState = await getTabState(tabId);
          sendResponse(tabState.measurementMode);
          return;
        }
        // Receive message to get ruler mode state
        else if (request.action === 'GET_RULER_MODE') {
          const tabState = await getTabState(tabId);
          sendResponse(tabState.rulerMode);
          return;
        }
        // Receive message to ping
        else if (request.action === 'PING') {
          // Respond to PING message for injection check
          sendResponse({ status: 'PONG' });
          return;
        }

        // No action matched for content script message
        sendResponse(false);
      })().catch(error => {
        Logger.error('Error handling content script message:', error);
        sendResponse(false);
      });

      return true;
    }
  },
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
  }

  // Toggle measurement mode for the active tab
  else if (command === 'toggle_measurement_mode') {
    let tabId;

    try {
      const activeTab = await getActiveTab();
      if (!activeTab?.id || !activeTab?.url || isRestrictedUrl(activeTab.url)) {
        Logger.warn('Ignoring command on restricted or invalid tab.');
        return;
      }
      tabId = activeTab.id;

      const currentState = await getTabState(tabId);
      const newState = !currentState.measurementMode;

      await handleTabStateChange({
        tabId,
        states: { measurementMode: newState },
      });
    } catch (error) {
      Logger.error(`Error toggling measurement mode for tab ${tabId}:`, error);
      return;
    }
  }

  // Toggle ruler mode for the active tab
  else if (command === 'toggle_ruler_mode') {
    let tabId;

    try {
      const activeTab = await getActiveTab();
      if (!activeTab?.id || !activeTab?.url || isRestrictedUrl(activeTab.url)) {
        Logger.warn('Ignoring command on restricted or invalid tab.');
        return;
      }
      tabId = activeTab.id;

      const currentState = await getTabState(tabId);
      const newState = !currentState.rulerMode;

      await handleTabStateChange({
        tabId,
        states: { rulerMode: newState },
      });
    } catch (error) {
      Logger.error(`Error toggling ruler mode for tab ${tabId}:`, error);
      return;
    }
  } else {
    Logger.warn('Unknown command received:', command);
  }
});

/**
 * Handles clicks on the right-click context menu items.
 * Toggles the corresponding mode for the tab the menu was opened on.
 *
 * @param info - Data about the menu item that was clicked.
 * @param tab - The tab in which the menu was triggered.
 */
chrome.contextMenus.onClicked.addListener(
  async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    Logger.info('Context menu clicked:', info.menuItemId, tab);

    if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) {
      Logger.warn('Context menu clicked on restricted or invalid tab.');
      return;
    }

    const tabId = tab.id;

    try {
      if (info.menuItemId === 'bp-toggle-border-mode') {
        const currentState = await getTabState(tabId);
        await handleTabStateChange({
          tabId,
          states: { borderMode: !currentState.borderMode },
        });
      } else if (info.menuItemId === 'bp-toggle-inspector-mode') {
        const currentState = await getTabState(tabId);
        await handleTabStateChange({
          tabId,
          states: { inspectorMode: !currentState.inspectorMode },
        });
      } else if (info.menuItemId === 'bp-toggle-measurement-mode') {
        const currentState = await getTabState(tabId);
        await handleTabStateChange({
          tabId,
          states: { measurementMode: !currentState.measurementMode },
        });
      } else if (info.menuItemId === 'bp-toggle-ruler-mode') {
        const currentState = await getTabState(tabId);
        await handleTabStateChange({
          tabId,
          states: { rulerMode: !currentState.rulerMode },
        });
      }
    } catch (error) {
      Logger.error(
        `Error handling context menu click "${info.menuItemId}" for tab ${tabId}:`,
        error,
      );
    }
  },
);
