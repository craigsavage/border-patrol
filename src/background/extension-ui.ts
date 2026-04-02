import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
  ICON_PATHS,
} from '../scripts/constants';
import { isRestrictedUrl, isChromeTabClosedError } from '../scripts/helpers';
import Logger from '../scripts/utils/logger';
import type { TabStateChangeOptions } from '../types/background';
import { getTabState, setTabState } from './tab-state';

/**
 * Updates the extension state (icon and title) based on the active tab's state.
 * The extension is considered enabled if any mode is enabled for the active tab.
 *
 * @param tabId - The ID of the active tab.
 */
export async function updateExtensionState(tabId: number): Promise<void> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url) return;

    const isRestricted = isRestrictedUrl(tab.url);
    const tabState = await getTabState(tabId);
    const isActive =
      tabState.borderMode ||
      tabState.inspectorMode ||
      tabState.measurementMode ||
      tabState.rulerMode;

    const title = isRestricted
      ? 'Border Patrol - Restricted'
      : isActive
        ? 'Border Patrol - Active'
        : 'Border Patrol - Inactive';

    await chrome.action.setTitle({ tabId, title });

    const iconPath =
      isRestricted || !isActive ? ICON_PATHS.iconDisabled : ICON_PATHS.icon16;

    await chrome.action.setIcon({ tabId, path: iconPath });
  } catch (error) {
    if (isChromeTabClosedError(error)) {
      Logger.warn(`Tab ${tabId} has been closed or is invalid.`);
    } else {
      Logger.error(`Error updating extension state for tab ${tabId}:`, error);
    }

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
export async function ensureScriptIsInjected(tabId: number): Promise<void> {
  if (!tabId) return;

  const tab = await chrome.tabs.get(tabId);
  if (!tab?.url || isRestrictedUrl(tab.url)) return;

  try {
    await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    Logger.info(`Scripts already injected in tab ${tabId}.`);
    return;
  } catch {
    Logger.info(`Scripts likely not injected in tab ${tabId}.`);
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['scripts/main-content.css'],
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/main-content.js'],
    });

    Logger.info(`Injected content scripts and CSS into tab ${tabId}`);
  } catch (error) {
    if (isChromeTabClosedError(error)) return;
    Logger.error(`Error injecting scripts or CSS into tab ${tabId}:`, error);
  }
}

/**
 * Sends the current state of border and inspector modes, and border settings
 * to the content script in the specified tab. This should be called after state changes.
 *
 * @param tabId - The ID of the tab.
 */
export async function sendContentScriptUpdates(tabId: number): Promise<void> {
  if (!tabId) return;

  try {
    const tabState = await getTabState(tabId);

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
export async function handleTabStateChange({
  tabId,
  states,
}: TabStateChangeOptions): Promise<void> {
  if (!tabId) return;

  await ensureScriptIsInjected(tabId);

  if (states) {
    await setTabState({ tabId, states });
  }

  await updateExtensionState(tabId);
  await sendContentScriptUpdates(tabId);
}
