import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  ICON_PATHS,
} from './scripts/constants';
import { isRestrictedUrl, isChromeTabClosedError } from './scripts/helpers';
import Logger from './scripts/utils/logger';
import { handleTabStateChange } from './background/extension-ui';
import { clearTabStateCache } from './background/tab-state';
import { setupMessageListener } from './background/message-handlers';
import {
  setupContextMenu,
  setupContextMenuClickListener,
} from './background/context-menu';
import { setupCommandListener } from './background/commands';

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

setupMessageListener();
setupCommandListener();
setupContextMenuClickListener();
