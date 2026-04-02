import { getTimestampedScreenshotFilename } from '../../scripts/utils/filename';
import Logger from '../../scripts/utils/logger';
import { ensureScriptIsInjected } from '../extension-ui';
import { ensureOffscreenDocument, waitForOffscreenReady } from '../offscreen';

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
export async function captureAndDownloadFullPageScreenshot(
  tabId: number,
  windowId: number,
): Promise<void> {
  const format = 'png';

  // Chrome's captureVisibleTab is rate-limited to ~2 calls/second.
  const MIN_CAPTURE_INTERVAL_MS = 600;

  /**
   * Sends a screenshot overlay command to the content script without breaking
   * the capture flow if the page cannot process the message.
   *
   * @param action - The overlay action to send.
   */
  const sendScreenshotOverlayCommand = async (
    action:
      | 'SHOW_SCREENSHOT_OVERLAY'
      | 'HIDE_SCREENSHOT_OVERLAY'
      | 'REMOVE_SCREENSHOT_OVERLAY',
  ): Promise<void> => {
    try {
      await chrome.tabs.sendMessage(tabId, { action });
    } catch (error) {
      Logger.warn(`Full-page capture overlay command failed: ${action}`, error);
    }
  };

  /**
   * Best-effort fallback that removes the overlay host directly from the page
   * if content-script messaging cannot complete cleanup.
   */
  const forceRemoveScreenshotOverlay = async (): Promise<void> => {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const container = document.getElementById(
            'bp-screenshot-overlay-container',
          );
          container?.remove();
        },
      });
    } catch (error) {
      Logger.warn('Full-page capture overlay fallback removal failed', error);
    }
  };

  await ensureScriptIsInjected(tabId);

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

  await chrome.tabs.sendMessage(tabId, { action: 'HIDE_FIXED_ELEMENTS' });
  await sendScreenshotOverlayCommand('SHOW_SCREENSHOT_OVERLAY');

  try {
    let lastCaptureTime = 0;

    for (let y = 0; y < scrollHeight; y += viewportHeight) {
      for (let x = 0; x < scrollWidth; x += viewportWidth) {
        const actual = (await chrome.tabs.sendMessage(tabId, {
          action: 'SCROLL_TO',
          x,
          y,
        })) as { scrollX: number; scrollY: number };

        const elapsed = Date.now() - lastCaptureTime;
        if (elapsed < MIN_CAPTURE_INTERVAL_MS) {
          await sleep(MIN_CAPTURE_INTERVAL_MS - elapsed);
        }

        await sendScreenshotOverlayCommand('HIDE_SCREENSHOT_OVERLAY');

        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
          format,
        });
        lastCaptureTime = Date.now();

        frames.push({ dataUrl, x: actual.scrollX, y: actual.scrollY });
        Logger.info(
          `Full-page capture: frame at (${actual.scrollX}, ${actual.scrollY})`,
        );

        await sendScreenshotOverlayCommand('SHOW_SCREENSHOT_OVERLAY');
      }
    }
  } finally {
    await sendScreenshotOverlayCommand('REMOVE_SCREENSHOT_OVERLAY');
    await forceRemoveScreenshotOverlay();
    await chrome.tabs.sendMessage(tabId, { action: 'RESTORE_FIXED_ELEMENTS' });
    await chrome.tabs.sendMessage(tabId, {
      action: 'RESTORE_SCROLL',
      x: origX,
      y: origY,
    });
  }

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

  const filename = getTimestampedScreenshotFilename(format);
  await chrome.downloads.download({
    url: stitchResponse.dataUrl,
    filename,
    saveAs: true,
    conflictAction: 'uniquify',
  });

  Logger.info('Full-page screenshot downloaded:', filename);
}
