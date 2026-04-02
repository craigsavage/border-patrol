import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  ICON_PATHS,
} from './scripts/constants';
import {
  isRestrictedUrl,
  getActiveTab,
  isChromeTabClosedError,
} from './scripts/helpers';
import Logger from './scripts/utils/logger';
import { handleTabStateChange } from './background/extension-ui';
import { clearTabStateCache, getTabState } from './background/tab-state';
import { setupMessageListener } from './background/message-handlers';

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

setupMessageListener();

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
