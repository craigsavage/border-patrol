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
      error,
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
      cachedTabStates[tabIdString],
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
    const isActive =
      tabState.borderMode || tabState.inspectorMode || tabState.measurementMode || tabState.rulerMode;

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
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_MEASUREMENT_MODE',
      isEnabled: tabState.measurementMode,
    });
    await chrome.tabs.sendMessage(tabId, {
      action: 'UPDATE_RULER_MODE',
      isEnabled: tabState.rulerMode,
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
 * Ensures that the offscreen document used for canvas stitching exists.
 * Creates it only if no offscreen context is already open.
 */
async function ensureOffscreenDocument(): Promise<void> {
  const url = chrome.runtime.getURL('offscreen/offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [url],
  });
  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url,
    reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
    justification: 'Canvas stitching for full-page screenshot',
  });
}

/**
 * Polls the offscreen document with an OFFSCREEN_PING until it responds or
 * the maximum number of attempts is exhausted. This guards against the race
 * where createDocument() resolves before the offscreen page has registered
 * its onMessage listener.
 *
 * @param maxAttempts - Maximum ping attempts before giving up.
 * @param intervalMs - Delay between attempts in milliseconds.
 */
async function waitForOffscreenReady(
  maxAttempts = 20,
  intervalMs = 50,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_PING',
      });
      if (response?.ready) return;
    } catch {
      // Offscreen listener not yet registered; retry after a short delay.
    }
    await sleep(intervalMs);
  }
  Logger.warn('Offscreen document did not become ready in time');
}

interface StitchFrame {
  dataUrl: string;
  x: number;
  y: number;
}

/**
 * Returns a promise that resolves after the specified number of milliseconds.
 *
 * @param ms - Milliseconds to wait.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrolls a tab through its full height and width, captures each viewport,
 * stitches the frames in an offscreen document, then downloads the result.
 *
 * @param tabId - The ID of the tab to capture.
 * @param windowId - The window ID used by captureVisibleTab.
 */
async function captureAndDownloadFullPageScreenshot(
  tabId: number,
  windowId: number,
): Promise<void> {
  const format = 'png';

  // Chrome's captureVisibleTab is rate-limited to ~2 calls/second.
  // We enforce a minimum interval between captures to avoid the quota error.
  const MIN_CAPTURE_INTERVAL_MS = 600;

  // Ensure the fullpage content script is present before sending any messages.
  // On freshly-installed or never-activated tabs, the listener won't exist yet.
  await ensureScriptIsInjected(tabId);

  // 1. Get full page dimensions and save the original scroll position.
  const dims = (await chrome.tabs.sendMessage(tabId, {
    action: 'GET_PAGE_DIMENSIONS',
  })) as {
    scrollHeight: number;
    scrollWidth: number;
    viewportHeight: number;
    viewportWidth: number;
    scrollX: number;
    scrollY: number;
    devicePixelRatio: number;
  };

  Logger.info('Full-page capture: page dimensions', dims);

  const {
    scrollHeight,
    scrollWidth,
    viewportHeight,
    viewportWidth,
    scrollX: origX,
    scrollY: origY,
    devicePixelRatio,
  } = dims;

  const frames: StitchFrame[] = [];

  // Hide fixed/sticky elements so they don't repeat in every captured frame.
  await chrome.tabs.sendMessage(tabId, { action: 'HIDE_FIXED_ELEMENTS' });

  try {
    // 2. Loop through rows and columns, capturing each viewport-sized region.
    let lastCaptureTime = 0;

    for (let y = 0; y < scrollHeight; y += viewportHeight) {
      for (let x = 0; x < scrollWidth; x += viewportWidth) {
        // Scroll the page and wait for repaint.
        const actual = (await chrome.tabs.sendMessage(tabId, {
          action: 'SCROLL_TO',
          x,
          y,
        })) as { scrollX: number; scrollY: number };

        // Enforce the minimum interval between captureVisibleTab calls.
        const elapsed = Date.now() - lastCaptureTime;
        if (elapsed < MIN_CAPTURE_INTERVAL_MS) {
          await sleep(MIN_CAPTURE_INTERVAL_MS - elapsed);
        }

        // Capture the visible area after scrolling.
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
          format,
        });
        lastCaptureTime = Date.now();

        frames.push({ dataUrl, x: actual.scrollX, y: actual.scrollY });
        Logger.info(
          `Full-page capture: frame at (${actual.scrollX}, ${actual.scrollY})`,
        );
      }
    }
  } finally {
    // 3. Restore fixed/sticky elements and the original scroll position.
    await chrome.tabs.sendMessage(tabId, { action: 'RESTORE_FIXED_ELEMENTS' });
    await chrome.tabs.sendMessage(tabId, {
      action: 'RESTORE_SCROLL',
      x: origX,
      y: origY,
    });
  }

  // 4. Stitch frames in the offscreen document.
  await ensureOffscreenDocument();
  await waitForOffscreenReady();

  const stitchResponse = await new Promise<{
    dataUrl?: string;
    error?: string;
  }>(resolve => {
    chrome.runtime.sendMessage(
      {
        action: 'STITCH_FRAMES',
        frames,
        totalWidth: scrollWidth,
        totalHeight: scrollHeight,
        viewportWidth,
        viewportHeight,
        devicePixelRatio,
      },
      response => resolve(response),
    );
  });

  if (stitchResponse.error || !stitchResponse.dataUrl) {
    throw new Error(
      `Full-page stitch failed: ${stitchResponse.error ?? 'no data URL returned'}`,
    );
  }

  // 5. Download the stitched image.
  const filename = getTimestampedScreenshotFilename(format);
  await chrome.downloads.download({
    url: stitchResponse.dataUrl,
    filename,
    saveAs: true,
    conflictAction: 'uniquify',
  });

  Logger.info('Full-page screenshot downloaded:', filename);
}

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
    delete cachedTabStates[tabId];

    // Optionally clear storage for the tab if needed
    try {
      await chrome.storage.local.remove(tabId.toString());
      Logger.info(`Cleared storage for tab ${tabId}`);
    } catch (error) {
      Logger.error(`Error clearing storage for tab ${tabId}:`, error);
    }
  },
);

// Handles recieving messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  async (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
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
        // Receive message to toggle measurement mode
        else if (request.action === 'TOGGLE_MEASUREMENT_MODE') {
          const currentMeasurementState = await getTabState(activeTabId);
          const newMeasurementState = !currentMeasurementState.measurementMode;
          await handleTabStateChange({
            tabId: activeTabId,
            states: { measurementMode: newMeasurementState },
          });
          return true; // Indicate async handling
        }
        // Receive message to toggle ruler mode
        else if (request.action === 'TOGGLE_RULER_MODE') {
          const currentRulerState = await getTabState(activeTabId);
          const newRulerState = !currentRulerState.rulerMode;
          await handleTabStateChange({
            tabId: activeTabId,
            states: { rulerMode: newRulerState },
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
                contentScriptError,
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
                'Attempted to take screenshot without download permission',
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
        }
        // Handle full-page screenshot request from popup
        else if (request.action === 'CAPTURE_FULL_SCREENSHOT') {
          try {
            const hasDownloadPermission = await hasPermission('downloads');

            if (!hasDownloadPermission) {
              Logger.warn(
                'Attempted to take full-page screenshot without download permission',
              );
              return false;
            }

            if (!activeTab || !activeTab.id || !activeTab.windowId) {
              Logger.error('No active tab available for full-page screenshot');
              return false;
            }

            await captureAndDownloadFullPageScreenshot(
              activeTab.id,
              activeTab.windowId,
            );
            sendResponse(true);
            return true;
          } catch (error) {
            Logger.error('Error in CAPTURE_FULL_SCREENSHOT handler:', error);
            return false;
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
      // Recieve message to get measurement mode state
      else if (request.action === 'GET_MEASUREMENT_MODE') {
        const tabState = await getTabState(tabId);
        sendResponse(tabState.measurementMode);
        return true; // Indicate async handling
      }
      // Recieve message to get ruler mode state
      else if (request.action === 'GET_RULER_MODE') {
        const tabState = await getTabState(tabId);
        sendResponse(tabState.rulerMode);
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
