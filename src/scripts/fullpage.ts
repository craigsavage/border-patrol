import Logger from './utils/logger';

(function () {
  /**
   * Returns the full scrollable dimensions and current scroll position of the page.
   */
  function getPageDimensions() {
    return {
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  }

  chrome.runtime.onMessage.addListener(
    (
      request: { action: string; x?: number; y?: number },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      if (request.action === 'GET_PAGE_DIMENSIONS') {
        sendResponse(getPageDimensions());
        return false;
      }

      if (request.action === 'SCROLL_TO') {
        const { x = 0, y = 0 } = request;
        window.scrollTo(x, y);
        // Wait for the browser to repaint before responding so that
        // captureVisibleTab in the background reflects the new scroll position.
        setTimeout(() => {
          Logger.info(
            `fullpage: scrolled to (${x}, ${y}), actual (${window.scrollX}, ${window.scrollY})`,
          );
          sendResponse({ scrollX: window.scrollX, scrollY: window.scrollY });
        }, 150);
        return true; // async
      }

      if (request.action === 'RESTORE_SCROLL') {
        const { x = 0, y = 0 } = request;
        window.scrollTo(x, y);
        sendResponse({ scrollX: window.scrollX, scrollY: window.scrollY });
        return false;
      }

      return false;
    },
  );
})();
