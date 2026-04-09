import type { RuntimeMessage } from 'types/runtime-messages';
import { isRestrictedUrl } from '../../scripts/helpers';
import Logger from '../../scripts/utils/logger';
import { handleContentMessage } from './content-handlers';
import { handlePopupMessage } from './popup-handlers';

/**
 * Registers the runtime message listener and delegates handling by sender type.
 */
export function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    Logger.info('Received message:', request, 'from sender:', sender);

    const tabId = sender?.tab?.id;

    if (!tabId) {
      handlePopupMessage(request as RuntimeMessage, sendResponse);
      return true;
    }

    if (!sender?.tab?.url || isRestrictedUrl(sender.tab.url)) {
      return false;
    }

    handleContentMessage(request, tabId, sendResponse);
    return true;
  });
}
