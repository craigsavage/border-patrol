import { RUNTIME_MESSAGES, RuntimeMessage } from 'types/runtime-messages';
import Logger from './utils/logger';

(function () {
  // Holds references to hidden fixed/sticky elements so they can be restored.
  type HiddenEntry = { el: HTMLElement; originalVisibility: string };
  let hiddenFixedElements: HiddenEntry[] = [];

  /**
   * Returns the full scrollable dimensions, current scroll position, and
   * device pixel ratio of the page.
   */
  function getPageDimensions() {
    return {
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * Hides all fixed and sticky elements by setting visibility:hidden.
   * Uses visibility rather than display:none to avoid layout reflows
   * that could change the page dimensions already recorded for capture.
   * Waits for two animation frames so the compositor has flushed the
   * style change before the caller proceeds to capture.
   *
   * @returns A promise that resolves to the number of elements hidden.
   */
  function hideFixedElements(): Promise<number> {
    return new Promise(resolve => {
      hiddenFixedElements = [];
      const all = document.querySelectorAll<HTMLElement>('*');
      for (const el of all) {
        const pos = window.getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'sticky') {
          hiddenFixedElements.push({
            el,
            originalVisibility: el.style.visibility,
          });
          el.style.visibility = 'hidden';
        }
      }
      Logger.info(
        `fullpage: hid ${hiddenFixedElements.length} fixed/sticky element(s)`,
      );
      // Double rAF: first frame queues the style recalc, second confirms paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve(hiddenFixedElements.length));
      });
    });
  }

  /**
   * Restores visibility on all elements previously hidden by hideFixedElements.
   */
  function restoreFixedElements(): void {
    for (const { el, originalVisibility } of hiddenFixedElements) {
      el.style.visibility = originalVisibility;
    }
    Logger.info(
      `fullpage: restored ${hiddenFixedElements.length} fixed/sticky element(s)`,
    );
    hiddenFixedElements = [];
  }

  chrome.runtime.onMessage.addListener(
    (
      request: RuntimeMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      if (request.action === RUNTIME_MESSAGES.GET_PAGE_DIMENSIONS) {
        sendResponse(getPageDimensions());
        return false;
      }

      if (request.action === RUNTIME_MESSAGES.HIDE_FIXED_ELEMENTS) {
        hideFixedElements().then(count => sendResponse({ count }));
        return true; // async
      }

      if (request.action === RUNTIME_MESSAGES.RESTORE_FIXED_ELEMENTS) {
        restoreFixedElements();
        sendResponse({ restored: true });
        return false;
      }

      if (request.action === RUNTIME_MESSAGES.SCROLL_TO) {
        const { x = 0, y = 0 } = request.payload;
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

      if (request.action === RUNTIME_MESSAGES.RESTORE_SCROLL) {
        const { x = 0, y = 0 } = request.payload;
        window.scrollTo(x, y);
        sendResponse({ scrollX: window.scrollX, scrollY: window.scrollY });
        return false;
      }

      return false;
    },
  );
})();
