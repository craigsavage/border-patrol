import Logger from './utils/logger';
import SCREENSHOT_OVERLAY_STYLES from '../styles/components/screenshot-overlay.shadow.scss';

(function () {
  let overlayContainer: HTMLElement | null = null;
  let backdropElement: HTMLElement | null = null;

  const CAPTURE_CLASS = 'bp-screenshot-capturing';

  /**
   * Resolves after two animation frames so style changes are fully painted.
   *
   * @returns A promise that resolves once paint has settled.
   */
  function waitForPaint(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  /**
   * Shows the screenshot capture overlay on the page.
   *
   * Creates a shadow DOM container with a dark semi-transparent backdrop and
   * a centered spinner indicator to inform the user that a full-page screenshot
   * is in progress and to prevent accidental clicks during capture.
   */
  function showScreenshotOverlay(): void {
    if (overlayContainer && backdropElement) {
      backdropElement.classList.remove(CAPTURE_CLASS);
      Logger.info('screenshot-overlay: visual state restored');
      return;
    }

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'bp-screenshot-overlay-container';

    const shadow = overlayContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = SCREENSHOT_OVERLAY_STYLES;
    shadow.appendChild(style);

    backdropElement = document.createElement('div');
    backdropElement.className = 'bp-screenshot-overlay';

    const indicator = document.createElement('div');
    indicator.className = 'bp-screenshot-indicator';

    const spinner = document.createElement('div');
    spinner.className = 'bp-screenshot-spinner';

    const label = document.createElement('div');
    label.className = 'bp-screenshot-label';
    label.textContent = chrome.i18n.getMessage('screenshotCaptureInProgress');

    indicator.appendChild(spinner);
    indicator.appendChild(label);
    backdropElement.appendChild(indicator);
    shadow.appendChild(backdropElement);

    document.body.appendChild(overlayContainer);
    Logger.info('screenshot-overlay: shown');
  }

  /**
   * Hides overlay visuals while keeping click-blocking active.
   *
   * Waits for paint so the next capture frame does not contain overlay visuals.
   *
   * @returns A promise that resolves once the visual hide is painted.
   */
  function hideScreenshotOverlay(): Promise<void> {
    if (backdropElement) {
      backdropElement.classList.add(CAPTURE_CLASS);
      Logger.info('screenshot-overlay: capture visual state enabled');
    }
    return waitForPaint();
  }

  /**
   * Removes the screenshot overlay from the page.
   */
  function removeScreenshotOverlay(): void {
    if (overlayContainer) {
      overlayContainer.remove();
      overlayContainer = null;
      backdropElement = null;
      Logger.info('screenshot-overlay: removed');
    }
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

      if (request.action === 'REMOVE_SCREENSHOT_OVERLAY') {
        removeScreenshotOverlay();
        sendResponse({ removed: true });
        return false;
      }

      return false;
    },
  );
})();
