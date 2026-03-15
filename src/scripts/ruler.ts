import Logger from './utils/logger';
import RULER_STYLES from '../styles/components/ruler.shadow.scss';

(function () {
  let isRulerModeEnabled = false;
  let isDarkMode = false;
  let mouseX = -1;
  let mouseY = -1;
  let rafPending = false;

  const RULER_SIZE = 20; // CSS pixels — thickness of each ruler bar

  // Shadow DOM refs
  let rulerContainer: HTMLElement | null = null;
  let rulerRoot: ShadowRoot | null = null;
  let hCanvas: HTMLCanvasElement | null = null;
  let vCanvas: HTMLCanvasElement | null = null;
  let cornerDiv: HTMLElement | null = null;

  interface RulerColors {
    bg: string;
    border: string;
    tick: string;
    label: string;
    crosshair: string;
  }

  /**
   * Returns the color palette for the ruler based on the current dark mode setting.
   *
   * @returns The set of colors to use for rendering the ruler.
   */
  function getColors(): RulerColors {
    if (isDarkMode) {
      return {
        bg: '#1c4e70', // bp-blue-800
        border: '#1d5a87', // bp-blue-700
        tick: '#92c7e7', // bp-blue-300
        label: '#c5e0f2', // bp-blue-200
        crosshair: '#aa4465', // bp-blush-600
      };
    }
    return {
      bg: '#f2f8fd', // bp-blue-50
      border: '#c5e0f2', // bp-blue-200
      tick: '#57a9d9', // bp-blue-400
      label: '#1d5a87', // bp-blue-700
      crosshair: '#aa4465', // bp-blush-600
    };
  }

  /**
   * Creates or re-uses the shadow DOM container and its child elements (two canvases + corner div).
   * Idempotent — safe to call multiple times.
   */
  function initializeDOM(): void {
    rulerContainer = document.getElementById(
      'bp-ruler-container',
    ) as HTMLElement | null;

    if (!rulerContainer) {
      rulerContainer = document.createElement('div');
      rulerContainer.id = 'bp-ruler-container';
      // Append to <html> so it is not clipped by overflow:hidden on <body>
      document.documentElement.appendChild(rulerContainer);
    }

    rulerRoot = rulerContainer.shadowRoot;
    if (!rulerRoot) {
      rulerContainer.replaceChildren();
      rulerRoot = rulerContainer.attachShadow({ mode: 'open' });
    }

    // Inject compiled SCSS string
    let styles = rulerRoot.getElementById(
      'bp-ruler-styles',
    ) as HTMLStyleElement | null;
    if (!styles) {
      styles = document.createElement('style') as HTMLStyleElement;
      styles.id = 'bp-ruler-styles';
      rulerRoot.appendChild(styles);
    }
    styles.textContent = RULER_STYLES;

    // Horizontal canvas – top ruler
    hCanvas = rulerRoot.getElementById(
      'bp-ruler-h',
    ) as HTMLCanvasElement | null;
    if (!hCanvas) {
      hCanvas = document.createElement('canvas');
      hCanvas.id = 'bp-ruler-h';
      rulerRoot.appendChild(hCanvas);
    }

    // Vertical canvas – left ruler
    vCanvas = rulerRoot.getElementById(
      'bp-ruler-v',
    ) as HTMLCanvasElement | null;
    if (!vCanvas) {
      vCanvas = document.createElement('canvas');
      vCanvas.id = 'bp-ruler-v';
      rulerRoot.appendChild(vCanvas);
    }

    // Corner square that covers the top-left intersection of the two rulers
    cornerDiv = rulerRoot.getElementById(
      'bp-ruler-corner',
    ) as HTMLElement | null;
    if (!cornerDiv) {
      cornerDiv = document.createElement('div');
      cornerDiv.id = 'bp-ruler-corner';
      rulerRoot.appendChild(cornerDiv);
    }
  }

  /**
   * Sets the pixel dimensions of both canvases and the corner div to match the
   * current viewport size, accounting for devicePixelRatio for crisp rendering.
   */
  function sizeCanvases(): void {
    if (!hCanvas || !vCanvas || !cornerDiv) return;

    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Horizontal ruler: full-width strip at top
    hCanvas.style.cssText = `position:absolute; top:0; left:0; width:${vw}px; height:${RULER_SIZE}px; display:block;`;
    hCanvas.width = Math.round(vw * dpr);
    hCanvas.height = Math.round(RULER_SIZE * dpr);

    // Vertical ruler: full-height strip at left
    vCanvas.style.cssText = `position:absolute; top:0; left:0; width:${RULER_SIZE}px; height:${vh}px; display:block;`;
    vCanvas.width = Math.round(RULER_SIZE * dpr);
    vCanvas.height = Math.round(vh * dpr);

    // Corner square sits on top of both canvases at their intersection
    cornerDiv.style.cssText = `position:absolute; top:0; left:0; width:${RULER_SIZE}px; height:${RULER_SIZE}px; z-index:1; box-sizing:border-box;`;
  }

  /**
   * Updates the corner div's background and border colors to match the current theme.
   */
  function applyCornerTheme(): void {
    if (!cornerDiv) return;
    const colors = getColors();
    cornerDiv.style.background = colors.bg;
    cornerDiv.style.borderRight = `1px solid ${colors.border}`;
    cornerDiv.style.borderBottom = `1px solid ${colors.border}`;
  }

  /**
   * Draws the horizontal (top) ruler to hCanvas.
   * Shows page-coordinate ticks: minor every 50 px, medium at 100 px, major at 200 px.
   * Labels are rendered at every 200 px mark. A blush vertical line tracks mouseX.
   */
  function drawHRuler(): void {
    if (!hCanvas) return;
    const ctx = hCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const colors = getColors();
    const scrollX = window.scrollX;
    const pw = hCanvas.width;
    const ph = hCanvas.height;
    const cssW = pw / dpr;

    ctx.clearRect(0, 0, pw, ph);

    // Background fill
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, pw, ph);

    // Bottom border line
    ctx.fillStyle = colors.border;
    ctx.fillRect(0, ph - Math.max(1, dpr), pw, Math.max(1, dpr));

    // Ticks and labels — iterate page coordinates aligned to 50 px grid
    const startPage = Math.floor(scrollX / 50) * 50;
    const endPage = Math.ceil((scrollX + cssW) / 50) * 50;

    ctx.font = `${Math.round(9 * dpr)}px system-ui,-apple-system,sans-serif`;
    ctx.textBaseline = 'top';

    for (let page = startPage; page <= endPage; page += 50) {
      const screen = page - scrollX;
      const x = Math.round(screen * dpr);
      if (x < 0 || x > pw) continue;

      const isMajor = page % 200 === 0;
      const isMedium = !isMajor && page % 100 === 0;

      const tickH = isMajor
        ? Math.round(ph * 0.65)
        : isMedium
          ? Math.round(ph * 0.5)
          : Math.round(ph * 0.3);

      ctx.fillStyle = colors.tick;
      ctx.fillRect(
        x,
        ph - tickH - Math.max(1, dpr),
        Math.max(1, Math.round(dpr)),
        tickH,
      );

      if (isMajor) {
        ctx.fillStyle = colors.label;
        ctx.fillText(
          String(page),
          x + Math.round(2 * dpr),
          Math.round(2 * dpr),
        );
      }
    }

    // Blush crosshair line at mouse position
    if (mouseX >= 0) {
      const cx = Math.round(mouseX * dpr);
      ctx.fillStyle = colors.crosshair;
      ctx.fillRect(cx, 0, Math.max(1, Math.round(dpr)), ph);
    }
  }

  /**
   * Draws the vertical (left) ruler to vCanvas.
   * Shows page-coordinate ticks: minor every 50 px, medium at 100 px, major at 200 px.
   * Labels are rotated -90° and rendered at every 200 px mark. A blush horizontal line tracks mouseY.
   */
  function drawVRuler(): void {
    if (!vCanvas) return;
    const ctx = vCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const colors = getColors();
    const scrollY = window.scrollY;
    const pw = vCanvas.width;
    const ph = vCanvas.height;
    const cssH = ph / dpr;

    ctx.clearRect(0, 0, pw, ph);

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, pw, ph);

    // Right border line
    ctx.fillStyle = colors.border;
    ctx.fillRect(pw - Math.max(1, dpr), 0, Math.max(1, dpr), ph);

    const startPage = Math.floor(scrollY / 50) * 50;
    const endPage = Math.ceil((scrollY + cssH) / 50) * 50;

    ctx.font = `${Math.round(9 * dpr)}px system-ui,-apple-system,sans-serif`;

    for (let page = startPage; page <= endPage; page += 50) {
      const screen = page - scrollY;
      const y = Math.round(screen * dpr);
      if (y < 0 || y > ph) continue;

      const isMajor = page % 200 === 0;
      const isMedium = !isMajor && page % 100 === 0;

      const tickW = isMajor
        ? Math.round(pw * 0.65)
        : isMedium
          ? Math.round(pw * 0.5)
          : Math.round(pw * 0.3);

      ctx.fillStyle = colors.tick;
      ctx.fillRect(
        pw - tickW - Math.max(1, dpr),
        y,
        tickW,
        Math.max(1, Math.round(dpr)),
      );

      if (isMajor) {
        ctx.save();
        ctx.fillStyle = colors.label;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        // Translate to the tick position and rotate -90° so number reads top-to-bottom from the ruler
        ctx.translate(Math.round(pw * 0.5), y - Math.round(2 * dpr));
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(page), 0, 0);
        ctx.restore();
      }
    }

    // Blush crosshair line at mouse position
    if (mouseY >= 0) {
      const cy = Math.round(mouseY * dpr);
      ctx.fillStyle = colors.crosshair;
      ctx.fillRect(0, cy, pw, Math.max(1, Math.round(dpr)));
    }
  }

  /**
   * Schedules a redraw of both rulers on the next animation frame.
   * Multiple calls within one frame are coalesced into a single redraw.
   */
  function scheduleRedraw(): void {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      drawHRuler();
      drawVRuler();
    });
  }

  function handleMouseMove(event: MouseEvent): void {
    mouseX = event.clientX;
    mouseY = event.clientY;
    scheduleRedraw();
  }

  function handleScroll(): void {
    scheduleRedraw();
  }

  function handleResize(): void {
    sizeCanvases();
    applyCornerTheme();
    scheduleRedraw();
  }

  /**
   * Responds to chrome.storage changes so the ruler recolors immediately when the
   * user toggles dark mode in the popup, without requiring a page reload.
   *
   * @param changes - The storage changes object.
   * @param areaName - The storage area that changed.
   */
  function handleStorageChange(
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void {
    if (areaName !== 'local' || !('darkMode' in changes)) return;
    isDarkMode = !!changes.darkMode.newValue;
    applyCornerTheme();
    scheduleRedraw();
  }

  function addEventListeners(): void {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    chrome.storage.onChanged.addListener(handleStorageChange);
  }

  function removeEventListeners(): void {
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
    chrome.storage.onChanged.removeListener(handleStorageChange);
  }

  /** Removes the ruler container and all its children from the DOM, resetting all refs. */
  function removeElements(): void {
    if (rulerContainer) {
      rulerContainer.remove();
    }
    rulerContainer = null;
    rulerRoot = null;
    hCanvas = null;
    vCanvas = null;
    cornerDiv = null;
  }

  /**
   * Reads the dark mode preference from storage and caches it in the module-level variable.
   */
  async function loadDarkMode(): Promise<void> {
    try {
      const { darkMode } = await chrome.storage.local.get('darkMode');
      isDarkMode = !!darkMode;
    } catch (error) {
      Logger.error('Error loading dark mode preference for ruler:', error);
    }
  }

  /**
   * Initialises the shadow DOM, sizes the canvases, applies the current theme,
   * attaches event listeners, and triggers the first draw.
   */
  async function enableRulerMode(): Promise<void> {
    await loadDarkMode();
    initializeDOM();
    sizeCanvases();
    applyCornerTheme();
    addEventListeners();
    scheduleRedraw();
  }

  /**
   * Handles ruler mode state changes from the background script.
   *
   * @param isEnabled - Whether ruler mode should be enabled.
   */
  function handleRulerModeUpdate(isEnabled: boolean): void {
    Logger.info('Ruler received UPDATE_RULER_MODE:', isEnabled);
    isRulerModeEnabled = isEnabled;

    if (isRulerModeEnabled) {
      enableRulerMode().catch(err =>
        Logger.error('Error enabling ruler mode:', err),
      );
    } else {
      removeEventListeners();
      removeElements();
      mouseX = -1;
      mouseY = -1;
    }
  }

  chrome.runtime.onMessage.addListener(
    (request: { action: string; isEnabled: boolean }) => {
      if (request.action === 'UPDATE_RULER_MODE') {
        handleRulerModeUpdate(request.isEnabled);
      }
    },
  );
})();
