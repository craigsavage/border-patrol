import Logger from './utils/logger';
import SCREENSHOT_OVERLAY_STYLES from '../styles/components/screenshot-overlay.shadow.scss';

(function () {
  let overlayContainer: HTMLElement | null = null;

  /**
   * Shows the screenshot capture overlay on the page.
   *
   * Creates a shadow DOM container with a dark semi-transparent backdrop and
   * a centered spinner indicator to inform the user that a full-page screenshot
   * is in progress and to prevent accidental clicks during capture.
   */
  function showScreenshotOverlay(): void {
    if (overlayContainer) return;

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'bp-screenshot-overlay-container';

    const shadow = overlayContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = SCREENSHOT_OVERLAY_STYLES;
    shadow.appendChild(style);

    const backdrop = document.createElement('div');
    backdrop.className = 'bp-screenshot-overlay';

    const indicator = document.createElement('div');
    indicator.className = 'bp-screenshot-indicator';

    const spinner = document.createElement('div');
    spinner.className = 'bp-screenshot-spinner';

    const label = document.createElement('div');
    label.className = 'bp-screenshot-label';
    label.textContent = chrome.i18n.getMessage('screenshotCaptureInProgress');

    indicator.appendChild(spinner);
    indicator.appendChild(label);
    backdrop.appendChild(indicator);
    shadow.appendChild(backdrop);

    document.body.appendChild(overlayContainer);
    Logger.info('screenshot-overlay: shown');
  }

  /**
   * Removes the screenshot capture overlay from the page.
   *
   * Waits for two animation frames after removal so that the browser has fully
   * painted the change before the caller proceeds — this ensures the overlay
   * does not appear in the next `captureVisibleTab` frame.
   *
   * @returns A promise that resolves once the overlay removal is painted.
   */
  function hideScreenshotOverlay(): Promise<void> {
    return new Promise(resolve => {
      if (overlayContainer) {
        overlayContainer.remove();
        overlayContainer = null;
        Logger.info('screenshot-overlay: hidden');
      }
      // Double rAF: first frame queues the removal, second confirms paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  chrome.runtime.onMessage.addListener(
    (
      request: { action: string },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      if (request.action === 'SHOW_SCREENSHOT_OVERLAY') {
        showScreenshotOverlay();
        sendResponse({ shown: true });
        return false;
      }

      if (request.action === 'HIDE_SCREENSHOT_OVERLAY') {
        hideScreenshotOverlay().then(() => sendResponse({ hidden: true }));
        return true; // async response
      }

      return false;
    },
  );
})();
