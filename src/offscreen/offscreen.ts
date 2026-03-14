import Logger from '../scripts/utils/logger';

interface StitchFrame {
  dataUrl: string;
  x: number;
  y: number;
}

interface StitchFramesRequest {
  action: 'STITCH_FRAMES';
  frames: StitchFrame[];
  totalWidth: number;
  totalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

interface PingRequest {
  action: 'OFFSCREEN_PING';
}

/**
 * Loads an image from a data URL.
 *
 * @param dataUrl - The data URL of the image to load.
 * @returns A promise that resolves to the loaded HTMLImageElement.
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = err => reject(err);
    img.src = dataUrl;
  });
}

/**
 * Stitches multiple screenshot frames onto a canvas and returns the result as a data URL.
 *
 * Each frame captured by captureVisibleTab is in physical pixels (CSS pixels × dpr).
 * The canvas is therefore sized in physical pixels too, and all draw coordinates
 * are scaled by dpr so frames land in the correct position.
 *
 * @param frames - Array of frame objects with dataUrl and CSS-pixel position (x, y).
 * @param totalWidth - Total page width in CSS pixels.
 * @param totalHeight - Total page height in CSS pixels.
 * @param viewportWidth - Viewport width in CSS pixels.
 * @param viewportHeight - Viewport height in CSS pixels.
 * @param dpr - Device pixel ratio of the captured tab.
 * @returns A promise that resolves to a PNG data URL of the stitched image.
 */
async function stitchFrames(
  frames: StitchFrame[],
  totalWidth: number,
  totalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  dpr: number,
): Promise<string> {
  const canvas = document.createElement('canvas');
  // Size the canvas in physical pixels.
  canvas.width = Math.round(totalWidth * dpr);
  canvas.height = Math.round(totalHeight * dpr);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D canvas context in offscreen document');
  }

  for (const frame of frames) {
    const img = await loadImage(frame.dataUrl);

    // Physical-pixel clip: last row/col may be a partial viewport.
    // Round to integer physical pixels to avoid seams/blur when dpr is non-integer.
    const drawWidth = Math.round(
      Math.min(viewportWidth, totalWidth - frame.x) * dpr,
    );
    const drawHeight = Math.round(
      Math.min(viewportHeight, totalHeight - frame.y) * dpr,
    );

    ctx.drawImage(
      img,
      0,
      0,
      drawWidth,
      drawHeight, // source rect (physical pixels from top-left of frame)
      Math.round(frame.x * dpr), // destination x (physical pixels on full canvas)
      Math.round(frame.y * dpr), // destination y
      drawWidth,
      drawHeight, // destination size
    );
  }

  return canvas.toDataURL('image/png');
}

// Listen for the STITCH_FRAMES message from the background service worker
chrome.runtime.onMessage.addListener(
  (
    request: StitchFramesRequest | PingRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (request.action === 'OFFSCREEN_PING') {
      sendResponse({ ready: true });
      return false;
    }

    if (request.action !== 'STITCH_FRAMES') return false;

    Logger.info('Offscreen: received STITCH_FRAMES request', {
      frames: request.frames.length,
      totalWidth: request.totalWidth,
      totalHeight: request.totalHeight,
      devicePixelRatio: request.devicePixelRatio,
    });

    stitchFrames(
      request.frames,
      request.totalWidth,
      request.totalHeight,
      request.viewportWidth,
      request.viewportHeight,
      request.devicePixelRatio ?? 1,
    )
      .then(dataUrl => {
        Logger.info('Offscreen: stitching complete');
        sendResponse({ dataUrl });
      })
      .catch(err => {
        Logger.error('Offscreen: stitching failed', err);
        sendResponse({ error: String(err) });
      });

    return true; // keep the message channel open for the async response
  },
);
