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
 * @param frames - Array of frame objects with dataUrl and position (x, y).
 * @param totalWidth - The total width of the full-page canvas in pixels.
 * @param totalHeight - The total height of the full-page canvas in pixels.
 * @param viewportWidth - The width of the captured viewport (used for clipping edge frames).
 * @param viewportHeight - The height of the captured viewport (used for clipping edge frames).
 * @returns A promise that resolves to a PNG data URL of the stitched image.
 */
async function stitchFrames(
  frames: StitchFrame[],
  totalWidth: number,
  totalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2D canvas context in offscreen document');
  }

  for (const frame of frames) {
    const img = await loadImage(frame.dataUrl);

    // Clip the drawn region to the actual page area — the last row/col may be
    // smaller than a full viewport if the page doesn't divide evenly.
    const drawWidth = Math.min(viewportWidth, totalWidth - frame.x);
    const drawHeight = Math.min(viewportHeight, totalHeight - frame.y);

    ctx.drawImage(
      img,
      0,
      0,
      drawWidth,
      drawHeight, // source rect (from top-left of captured viewport)
      frame.x,
      frame.y,
      drawWidth,
      drawHeight, // destination rect on the full canvas
    );
  }

  return canvas.toDataURL('image/png');
}

// Listen for the STITCH_FRAMES message from the background service worker
chrome.runtime.onMessage.addListener(
  (
    request: StitchFramesRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { dataUrl?: string; error?: string }) => void,
  ) => {
    if (request.action !== 'STITCH_FRAMES') return false;

    Logger.info('Offscreen: received STITCH_FRAMES request', {
      frames: request.frames.length,
      totalWidth: request.totalWidth,
      totalHeight: request.totalHeight,
    });

    stitchFrames(
      request.frames,
      request.totalWidth,
      request.totalHeight,
      request.viewportWidth,
      request.viewportHeight,
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
