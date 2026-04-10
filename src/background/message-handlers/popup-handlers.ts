import {
  DEFAULT_BORDER_SIZE,
  DEFAULT_BORDER_STYLE,
} from '../../scripts/constants';
import {
  getActiveTab,
  hasPermission,
  isRestrictedUrl,
} from '../../scripts/helpers';
import Logger from '../../scripts/utils/logger';
import {
  RUNTIME_MESSAGES,
  type RuntimeMessage,
} from 'types/runtime-messages';
import {
  captureAndDownloadFullPageScreenshot,
  captureAndDownloadScreenshot,
} from '../screenshot';
import { getTabState } from '../tab-state';
import { handleTabStateChange } from '../extension-ui';

/**
 * Handles popup-originated runtime messages.
 *
 * @param request - Message request payload.
 * @param sendResponse - Runtime response callback.
 */
export function handlePopupMessage(
  request: RuntimeMessage,
  sendResponse: (response?: unknown) => void,
): void {
  void (async () => {
    try {
      const activeTab = await getActiveTab();
      if (!activeTab?.id || !activeTab?.url || isRestrictedUrl(activeTab.url)) {
        sendResponse(false);
        return;
      }

      const activeTabId = activeTab.id;
      Logger.info(
        `Handling popup message for active tab ${activeTabId}:`,
        activeTab,
      );

      if (request.action === RUNTIME_MESSAGES.TOGGLE_BORDER_MODE) {
        const { isEnabled } = request.payload;
        await handleTabStateChange({
          tabId: activeTabId,
          states: { borderMode: isEnabled },
        });
        sendResponse(true);
        return;
      }

      if (request.action === RUNTIME_MESSAGES.TOGGLE_INSPECTOR_MODE) {
        const { isEnabled } = request.payload;
        await handleTabStateChange({
          tabId: activeTabId,
          states: { inspectorMode: isEnabled },
        });
        sendResponse(true);
        return;
      }

      if (request.action === RUNTIME_MESSAGES.TOGGLE_MEASUREMENT_MODE) {
        const { isEnabled } = request.payload;
        await handleTabStateChange({
          tabId: activeTabId,
          states: { measurementMode: isEnabled },
        });
        sendResponse(true);
        return;
      }

      if (request.action === RUNTIME_MESSAGES.TOGGLE_RULER_MODE) {
        const { isEnabled } = request.payload;
        await handleTabStateChange({
          tabId: activeTabId,
          states: { rulerMode: isEnabled },
        });
        sendResponse(true);
        return;
      }

      if (request.action === RUNTIME_MESSAGES.UPDATE_BORDER_SETTINGS) {
        const { size: borderSize, style: borderStyle } = request.payload;
        await chrome.storage.local.set({ borderSize, borderStyle });

        const tabState = await getTabState(activeTabId);
        if (tabState.borderMode) {
          try {
            await chrome.tabs.sendMessage(activeTabId, {
              action: RUNTIME_MESSAGES.UPDATE_BORDER_SETTINGS,
              payload: {
                size: borderSize ?? DEFAULT_BORDER_SIZE,
                style: borderStyle ?? DEFAULT_BORDER_STYLE,
              },
            } satisfies RuntimeMessage);
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

      if (request.action === RUNTIME_MESSAGES.CAPTURE_SCREENSHOT) {
        try {
          const hasDownloadPermission = await hasPermission('downloads');

          if (!hasDownloadPermission) {
            Logger.warn(
              'Attempted to take screenshot without download permission',
            );
            sendResponse(false);
            return;
          }

          if (!activeTab.windowId) {
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

      if (request.action === RUNTIME_MESSAGES.CAPTURE_FULL_SCREENSHOT) {
        try {
          const hasDownloadPermission = await hasPermission('downloads');

          if (!hasDownloadPermission) {
            Logger.warn(
              'Attempted to take full-page screenshot without download permission',
            );
            sendResponse(false);
            return;
          }

          if (!activeTab.id || !activeTab.windowId) {
            Logger.error('No active tab available for full-page screenshot');
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
      }

      Logger.warn('Received unknown message from popup:', request);
      sendResponse(false);
    } catch (error) {
      Logger.error('Error handling popup message:', error);
      sendResponse(false);
    }
  })();
}
