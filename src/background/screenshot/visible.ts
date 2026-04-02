import { getTimestampedScreenshotFilename } from '../../scripts/utils/filename';
import Logger from '../../scripts/utils/logger';

/**
 * Captures a visible tab and downloads the screenshot.
 *
 * @param windowId - The ID of the window containing the tab to capture.
 */
export async function captureAndDownloadScreenshot(
  windowId: number,
): Promise<void> {
  const format = 'png';

  try {
    const screenshotUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format,
    });
    Logger.info('Screenshot captured successfully:', {
      windowId,
      screenshotUrl,
    });

    const filename = getTimestampedScreenshotFilename(format);
    Logger.info('Generated filename:', filename);

    await chrome.downloads.download({
      url: screenshotUrl,
      filename,
      saveAs: true,
      conflictAction: 'uniquify',
    });
  } catch (error) {
    Logger.error('Error in captureAndDownloadScreenshot:', error);
    throw error;
  }
}
