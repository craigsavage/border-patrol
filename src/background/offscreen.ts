import Logger from '../scripts/utils/logger';

/**
 * Ensures that the offscreen document used for canvas stitching exists.
 * Creates it only if no offscreen context is already open.
 */
export async function ensureOffscreenDocument(): Promise<void> {
  const url = chrome.runtime.getURL('offscreen/offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [url],
  });
  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url,
    reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
    justification: 'Canvas stitching for full-page screenshot',
  });
}

/**
 * Polls the offscreen document with an OFFSCREEN_PING until it responds or
 * the maximum number of attempts is exhausted.
 *
 * @param maxAttempts - Maximum ping attempts before giving up.
 * @param intervalMs - Delay between attempts in milliseconds.
 */
export async function waitForOffscreenReady(
  maxAttempts = 20,
  intervalMs = 50,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'OFFSCREEN_PING',
      });
      if (response?.ready) return;
    } catch {
      // Offscreen listener not yet registered; retry after a short delay.
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  Logger.warn('Offscreen document did not become ready in time');
}
