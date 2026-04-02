import Logger from '../../scripts/utils/logger';
import { getTabState } from '../tab-state';

/**
 * Handles content-script-originated runtime messages.
 *
 * @param request - Message request payload.
 * @param tabId - Sender tab ID.
 * @param sendResponse - Runtime response callback.
 */
export function handleContentMessage(
  request: any,
  tabId: number,
  sendResponse: (response?: any) => void,
): void {
  void (async () => {
    if (request.action === 'GET_TAB_ID') {
      sendResponse(tabId);
      return;
    }

    if (request.action === 'GET_BORDER_MODE') {
      const tabState = await getTabState(tabId);
      sendResponse(tabState.borderMode);
      return;
    }

    if (request.action === 'GET_INSPECTOR_MODE') {
      const tabState = await getTabState(tabId);
      sendResponse(tabState.inspectorMode);
      return;
    }

    if (request.action === 'GET_MEASUREMENT_MODE') {
      const tabState = await getTabState(tabId);
      sendResponse(tabState.measurementMode);
      return;
    }

    if (request.action === 'GET_RULER_MODE') {
      const tabState = await getTabState(tabId);
      sendResponse(tabState.rulerMode);
      return;
    }

    if (request.action === 'PING') {
      sendResponse({ status: 'PONG' });
      return;
    }

    sendResponse(false);
  })().catch(error => {
    Logger.error('Error handling content script message:', error);
    sendResponse(false);
  });
}
