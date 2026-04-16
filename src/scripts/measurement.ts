import Logger from './utils/logger';
import MEASUREMENT_STYLES from '../styles/components/measurement.shadow.scss';
import { RUNTIME_MESSAGES, RuntimeMessage } from 'types/runtime-messages';

(function () {
  let isMeasurementModeEnabled = false;

  // DOM references
  let measurementContainer: HTMLElement | null = null;
  let measurementRoot: ShadowRoot | null = null;

  // Selection state
  let hoveredElement: HTMLElement | null = null;
  let firstSelected: HTMLElement | null = null;
  let secondSelected: HTMLElement | null = null;

  // Shadow DOM elements for selection highlights and connector
  let hoverHighlight: HTMLElement | null = null;
  let firstHighlight: HTMLElement | null = null;
  let firstBadge: HTMLElement | null = null;
  let secondHighlight: HTMLElement | null = null;
  let secondBadge: HTMLElement | null = null;
  let connectorLine: SVGElement | null = null;
  let distanceLabel: HTMLElement | null = null;
  let xDistanceLabel: HTMLElement | null = null;
  let yDistanceLabel: HTMLElement | null = null;
  let firstSizeLabel: HTMLElement | null = null;
  let secondSizeLabel: HTMLElement | null = null;

  const HIGHLIGHT_COLOR = 'rgba(59, 130, 246, 0.15)';
  const OUTLINE_COLOR = 'rgba(59, 130, 246, 0.8)';
  const SELECTED_COLOR = 'rgba(16, 185, 129, 0.15)';
  const SELECTED_OUTLINE = 'rgba(16, 185, 129, 0.8)';
  const CONNECTOR_COLOR = '#ef4444';

  /**
   * Checks if an element belongs to the measurement UI itself.
   *
   * @param element - The element to check.
   * @returns True if the element is part of the measurement UI.
   */
  function isMeasurementUIElement(element: Element): boolean {
    if (!measurementContainer || !element) return false;
    return (
      measurementContainer === element || measurementContainer.contains(element)
    );
  }

  /**
   * Checks if an element belongs to any Border Patrol UI container.
   *
   * @param element - The element to check.
   * @returns True if it's a BP UI element.
   */
  function isBPElement(element: Element): boolean {
    if (isMeasurementUIElement(element)) return true;
    const inspectorContainer = document.getElementById(
      'bp-inspector-container',
    );
    if (
      inspectorContainer &&
      (inspectorContainer === element || inspectorContainer.contains(element))
    ) {
      return true;
    }
    return false;
  }

  /** Initializes the shadow DOM container and elements for measurement overlays. */
  function initializeDOM(): void {
    measurementContainer = document.getElementById(
      'bp-measurement-container',
    ) as HTMLElement | null;

    if (!measurementContainer) {
      measurementContainer = document.createElement('div');
      measurementContainer.id = 'bp-measurement-container';
      document.body.appendChild(measurementContainer);
    }

    measurementRoot = measurementContainer.shadowRoot;
    if (!measurementRoot) {
      measurementContainer.replaceChildren();
      measurementRoot = measurementContainer.attachShadow({ mode: 'open' });
    }

    // Inject styles
    let styles = measurementRoot.getElementById(
      'bp-measurement-styles',
    ) as HTMLStyleElement | null;
    if (!styles) {
      styles = document.createElement('style') as HTMLStyleElement;
      styles.id = 'bp-measurement-styles';
      measurementRoot.appendChild(styles);
    }
    styles.textContent = MEASUREMENT_STYLES;

    // Reuse existing elements if already present (idempotent re-init)
    hoverHighlight =
      (measurementRoot.getElementById('bp-meas-hover') as HTMLElement | null) ??
      createOverlayElement('bp-meas-hover');

    firstHighlight =
      (measurementRoot.getElementById('bp-meas-first') as HTMLElement | null) ??
      createOverlayElement('bp-meas-first');

    firstBadge = measurementRoot.getElementById(
      'bp-meas-first-badge',
    ) as HTMLElement | null;
    if (!firstBadge) {
      firstBadge = document.createElement('div');
      firstBadge.id = 'bp-meas-first-badge';
      firstBadge.className = 'bp-meas-badge bp-meas-badge--first';
      firstBadge.textContent = '1st';
      measurementRoot.appendChild(firstBadge);
    }

    secondHighlight =
      (measurementRoot.getElementById(
        'bp-meas-second',
      ) as HTMLElement | null) ?? createOverlayElement('bp-meas-second');

    secondBadge = measurementRoot.getElementById(
      'bp-meas-second-badge',
    ) as HTMLElement | null;
    if (!secondBadge) {
      secondBadge = document.createElement('div');
      secondBadge.id = 'bp-meas-second-badge';
      secondBadge.className = 'bp-meas-badge bp-meas-badge--second';
      secondBadge.textContent = '2nd';
      measurementRoot.appendChild(secondBadge);
    }

    const svgNS = 'http://www.w3.org/2000/svg';
    connectorLine =
      (measurementRoot.getElementById(
        'bp-meas-connector',
      ) as unknown as SVGElement | null) ??
      (() => {
        const svg = document.createElementNS(
          svgNS,
          'svg',
        ) as unknown as SVGElement;
        (svg as unknown as HTMLElement).id = 'bp-meas-connector';
        svg.setAttribute('class', 'bp-meas-connector');
        measurementRoot!.appendChild(svg);
        return svg;
      })();

    distanceLabel = measurementRoot.getElementById(
      'bp-meas-distance',
    ) as HTMLElement | null;
    if (!distanceLabel) {
      distanceLabel = document.createElement('div');
      distanceLabel.id = 'bp-meas-distance';
      distanceLabel.className = 'bp-meas-distance';
      measurementRoot.appendChild(distanceLabel);
    }

    xDistanceLabel = measurementRoot.getElementById(
      'bp-meas-x-distance',
    ) as HTMLElement | null;
    if (!xDistanceLabel) {
      xDistanceLabel = document.createElement('div');
      xDistanceLabel.id = 'bp-meas-x-distance';
      xDistanceLabel.className = 'bp-meas-distance';
      measurementRoot.appendChild(xDistanceLabel);
    }

    yDistanceLabel = measurementRoot.getElementById(
      'bp-meas-y-distance',
    ) as HTMLElement | null;
    if (!yDistanceLabel) {
      yDistanceLabel = document.createElement('div');
      yDistanceLabel.id = 'bp-meas-y-distance';
      yDistanceLabel.className = 'bp-meas-distance';
      measurementRoot.appendChild(yDistanceLabel);
    }

    firstSizeLabel = measurementRoot.getElementById(
      'bp-meas-first-size',
    ) as HTMLElement | null;
    if (!firstSizeLabel) {
      firstSizeLabel = document.createElement('div');
      firstSizeLabel.id = 'bp-meas-first-size';
      firstSizeLabel.className = 'bp-meas-size bp-meas-size--first';
      measurementRoot.appendChild(firstSizeLabel);
    }

    secondSizeLabel = measurementRoot.getElementById(
      'bp-meas-second-size',
    ) as HTMLElement | null;
    if (!secondSizeLabel) {
      secondSizeLabel = document.createElement('div');
      secondSizeLabel.id = 'bp-meas-second-size';
      secondSizeLabel.className = 'bp-meas-size bp-meas-size--second';
      measurementRoot.appendChild(secondSizeLabel);
    }

    // Restore selection visuals if elements were already selected before re-init,
    // otherwise ensure everything starts hidden.
    if (firstSelected || secondSelected) {
      repositionAll();
    } else {
      hideAll();
    }
  }

  /**
   * Creates a highlight overlay element inside the shadow root.
   *
   * @param id - The element ID.
   * @returns The created element.
   */
  function createOverlayElement(id: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    el.className = 'bp-meas-highlight';
    measurementRoot!.appendChild(el);
    return el;
  }

  /** Hides all overlay elements. */
  function hideAll(): void {
    [
      hoverHighlight,
      firstHighlight,
      firstBadge,
      firstSizeLabel,
      secondHighlight,
      secondBadge,
      secondSizeLabel,
      distanceLabel,
      xDistanceLabel,
      yDistanceLabel,
    ].forEach(el => {
      if (el) el.style.display = 'none';
    });
    if (connectorLine)
      (connectorLine as unknown as HTMLElement).style.display = 'none';
  }

  /**
   * Positions a highlight element over the given target element.
   *
   * @param highlight - The highlight overlay element.
   * @param target - The DOM element to highlight.
   * @param isSelected - Whether this is a selected (not hovered) highlight.
   */
  function positionHighlight(
    highlight: HTMLElement,
    target: HTMLElement,
    isSelected: boolean,
  ): void {
    const rect = target.getBoundingClientRect();
    highlight.style.position = 'fixed';
    highlight.style.top = `${rect.top}px`;
    highlight.style.left = `${rect.left}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.backgroundColor = isSelected
      ? SELECTED_COLOR
      : HIGHLIGHT_COLOR;
    highlight.style.outline = `2px solid ${isSelected ? SELECTED_OUTLINE : OUTLINE_COLOR}`;
    highlight.style.display = 'block';
  }

  /**
   * Positions a badge near the top-left corner of a target element.
   *
   * @param badge - The badge element.
   * @param target - The target DOM element.
   */
  function positionBadge(badge: HTMLElement, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    badge.style.position = 'fixed';
    badge.style.top = `${rect.top - 10}px`;
    badge.style.left = `${rect.left - 10}px`;
    badge.style.display = 'block';
  }

  /**
   * Positions a size label below a target element and updates its text.
   *
   * @param label - The size label element.
   * @param target - The target DOM element.
   */
  function positionSizeLabel(label: HTMLElement, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    label.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}px`;
    label.style.position = 'fixed';
    label.style.left = `${rect.left + rect.width / 2}px`;
    label.style.top = `${rect.bottom + 4}px`;
    label.style.display = 'block';
  }

  /**
   * Returns the nearest edge anchor points between two DOMRects along with
   * the individual horizontal and vertical gap distances between them.
   *
   * @param a - The first element's bounding rect.
   * @param b - The second element's bounding rect.
   * @returns Edge anchor points on each rect and the x/y gap values.
   */
  function getEdgeData(
    a: DOMRect,
    b: DOMRect,
  ): {
    pointA: { x: number; y: number };
    pointB: { x: number; y: number };
    xGap: number;
    yGap: number;
  } {
    // Horizontal component
    let ax: number, bx: number, xGap: number;
    if (a.right <= b.left) {
      ax = a.right;
      bx = b.left;
      xGap = b.left - a.right;
    } else if (b.right <= a.left) {
      ax = a.left;
      bx = b.right;
      xGap = a.left - b.right;
    } else {
      const xMid = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
      ax = xMid;
      bx = xMid;
      xGap = 0;
    }

    // Vertical component
    let ay: number, by: number, yGap: number;
    if (a.bottom <= b.top) {
      ay = a.bottom;
      by = b.top;
      yGap = b.top - a.bottom;
    } else if (b.bottom <= a.top) {
      ay = a.top;
      by = b.bottom;
      yGap = a.top - b.bottom;
    } else {
      const yMid = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
      ay = yMid;
      by = yMid;
      yGap = 0;
    }

    return {
      pointA: { x: ax, y: ay },
      pointB: { x: bx, y: by },
      xGap,
      yGap,
    };
  }

  /** Draws the SVG connector and distance label(s) between the two selected elements. */
  function drawConnector(overrideSecond?: HTMLElement): void {
    const second = overrideSecond ?? secondSelected;
    if (
      !firstSelected ||
      !second ||
      !connectorLine ||
      !distanceLabel ||
      !xDistanceLabel ||
      !yDistanceLabel
    )
      return;

    const rectA = firstSelected.getBoundingClientRect();
    const rectB = second.getBoundingClientRect();
    const { pointA: a, pointB: b, xGap, yGap } = getEdgeData(rectA, rectB);

    const svgNS = 'http://www.w3.org/2000/svg';
    const svgEl = connectorLine as unknown as HTMLElement;

    // Reset all labels
    distanceLabel.style.display = 'none';
    xDistanceLabel.style.display = 'none';
    yDistanceLabel.style.display = 'none';

    // Overlap case — elements share area on both axes
    if (xGap === 0 && yGap === 0) {
      svgEl.style.display = 'none';
      const midX = (rectA.left + rectA.right + rectB.left + rectB.right) / 4;
      const midY = (rectA.top + rectA.bottom + rectB.top + rectB.bottom) / 4;
      distanceLabel.textContent = '0px';
      distanceLabel.style.position = 'fixed';
      distanceLabel.style.left = `${midX}px`;
      distanceLabel.style.top = `${midY}px`;
      distanceLabel.style.display = 'block';
      return;
    }

    // Size the SVG to cover the viewport
    svgEl.style.position = 'fixed';
    svgEl.style.top = '0';
    svgEl.style.left = '0';
    svgEl.style.width = '100vw';
    svgEl.style.height = '100vh';
    svgEl.style.display = 'block';
    connectorLine.setAttribute(
      'viewBox',
      `0 0 ${window.innerWidth} ${window.innerHeight}`,
    );

    // Clear previous SVG content
    while (connectorLine.firstChild) {
      connectorLine.removeChild(connectorLine.firstChild);
    }

    if (xGap > 0 && yGap > 0) {
      // L-shaped connector: horizontal segment then vertical segment
      // Corner sits at (b.x, a.y) — horizontal from A, then vertical to B
      const corner = { x: b.x, y: a.y };

      const drawSegment = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
      ): void => {
        const seg = document.createElementNS(svgNS, 'line');
        seg.setAttribute('x1', String(x1));
        seg.setAttribute('y1', String(y1));
        seg.setAttribute('x2', String(x2));
        seg.setAttribute('y2', String(y2));
        seg.setAttribute('stroke', CONNECTOR_COLOR);
        seg.setAttribute('stroke-width', '2');
        seg.setAttribute('stroke-dasharray', '6 4');
        connectorLine!.appendChild(seg);
      };

      // Horizontal: A edge → corner
      drawSegment(a.x, a.y, corner.x, corner.y);
      // Vertical: corner → B edge
      drawSegment(corner.x, corner.y, b.x, b.y);

      // Endpoint circles at A and B
      [a, b].forEach(point => {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', String(point.x));
        circle.setAttribute('cy', String(point.y));
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', CONNECTOR_COLOR);
        connectorLine!.appendChild(circle);
      });

      // Small dot at the corner
      const cornerDot = document.createElementNS(svgNS, 'circle');
      cornerDot.setAttribute('cx', String(corner.x));
      cornerDot.setAttribute('cy', String(corner.y));
      cornerDot.setAttribute('r', '3');
      cornerDot.setAttribute('fill', CONNECTOR_COLOR);
      cornerDot.setAttribute('opacity', '0.5');
      connectorLine.appendChild(cornerDot);

      // X label centred on the horizontal segment
      xDistanceLabel.textContent = `${Math.round(xGap)}px`;
      xDistanceLabel.style.position = 'fixed';
      xDistanceLabel.style.left = `${(a.x + corner.x) / 2}px`;
      xDistanceLabel.style.top = `${a.y}px`;
      xDistanceLabel.style.display = 'block';

      // Y label centred on the vertical segment
      yDistanceLabel.textContent = `${Math.round(yGap)}px`;
      yDistanceLabel.style.position = 'fixed';
      yDistanceLabel.style.left = `${corner.x}px`;
      yDistanceLabel.style.top = `${(corner.y + b.y) / 2}px`;
      yDistanceLabel.style.display = 'block';
    } else {
      // Single-axis: one straight line with one label
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(a.x));
      line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x));
      line.setAttribute('y2', String(b.y));
      line.setAttribute('stroke', CONNECTOR_COLOR);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '6 4');
      connectorLine.appendChild(line);

      [a, b].forEach(point => {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', String(point.x));
        circle.setAttribute('cy', String(point.y));
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', CONNECTOR_COLOR);
        connectorLine!.appendChild(circle);
      });

      const dist = xGap > 0 ? Math.round(xGap) : Math.round(yGap);
      distanceLabel.textContent = `${dist}px`;
      distanceLabel.style.position = 'fixed';
      distanceLabel.style.left = `${(a.x + b.x) / 2}px`;
      distanceLabel.style.top = `${(a.y + b.y) / 2}px`;
      distanceLabel.style.display = 'block';
    }
  }

  /**
   * Repositions all active selection highlights, badges, and the connector
   * to their current viewport positions. Called on scroll and resize so
   * overlays stay aligned with their target elements.
   */
  function repositionAll(): void {
    if (firstSelected && firstHighlight) {
      positionHighlight(firstHighlight, firstSelected, true);
    }
    if (firstSelected && firstBadge) {
      positionBadge(firstBadge, firstSelected);
    }
    if (firstSelected && firstSizeLabel) {
      positionSizeLabel(firstSizeLabel, firstSelected);
    }
    if (secondSelected && secondHighlight) {
      positionHighlight(secondHighlight, secondSelected, true);
    }
    if (secondSelected && secondBadge) {
      positionBadge(secondBadge, secondSelected);
    }
    if (secondSelected && secondSizeLabel) {
      positionSizeLabel(secondSizeLabel, secondSelected);
    }
    if (firstSelected && secondSelected) {
      drawConnector();
    }
  }

  /** Handles scroll and resize events to keep overlays aligned with their elements. */
  function scrollResizeHandler(): void {
    repositionAll();
  }

  /** Clears the current selection state and hides overlays. */
  function resetSelection(): void {
    firstSelected = null;
    secondSelected = null;
    hoveredElement = null;
    hideAll();
  }

  /**
   * Handles mouseover events to show the hover highlight.
   *
   * @param event - The mouse event.
   */
  function mouseOverHandler(event: MouseEvent): void {
    if (!isMeasurementModeEnabled) return;

    const target = event.target as HTMLElement;
    if (!target || !(target instanceof HTMLElement)) return;
    if (isBPElement(target)) return;

    // Don't show hover highlight on already-selected elements
    if (target === firstSelected || target === secondSelected) return;

    hoveredElement = target;

    // After first selection, show a live preview of the measurement
    if (firstSelected && !secondSelected && target !== firstSelected) {
      if (secondHighlight) positionHighlight(secondHighlight, target, false);
      if (secondBadge) positionBadge(secondBadge, target);
      if (secondSizeLabel) positionSizeLabel(secondSizeLabel, target);
      drawConnector(target);
      return;
    }

    if (hoverHighlight) {
      positionHighlight(hoverHighlight, target, false);
    }
  }

  /** Handles mouseout events to hide the hover highlight. */
  function mouseOutHandler(): void {
    hoveredElement = null;
    if (hoverHighlight) hoverHighlight.style.display = 'none';

    // Hide preview elements when mousing out without a confirmed second selection
    if (firstSelected && !secondSelected) {
      if (secondHighlight) secondHighlight.style.display = 'none';
      if (secondBadge) secondBadge.style.display = 'none';
      if (secondSizeLabel) secondSizeLabel.style.display = 'none';
      if (connectorLine)
        (connectorLine as unknown as HTMLElement).style.display = 'none';
      if (distanceLabel) distanceLabel.style.display = 'none';
      if (xDistanceLabel) xDistanceLabel.style.display = 'none';
      if (yDistanceLabel) yDistanceLabel.style.display = 'none';
    }
  }

  /**
   * Handles click events for element selection.
   *
   * @param event - The mouse event.
   */
  function clickHandler(event: MouseEvent): void {
    if (!isMeasurementModeEnabled) return;

    const target = event.target as HTMLElement;
    if (!target || !(target instanceof HTMLElement)) return;
    if (isBPElement(target)) return;

    event.preventDefault();
    event.stopPropagation();

    // If both are already selected, reset and start fresh
    if (firstSelected && secondSelected) {
      resetSelection();
    }

    if (!firstSelected) {
      // First selection
      firstSelected = target;
      if (hoverHighlight) hoverHighlight.style.display = 'none';
      if (firstHighlight) positionHighlight(firstHighlight, target, true);
      if (firstBadge) positionBadge(firstBadge, target);
      if (firstSizeLabel) positionSizeLabel(firstSizeLabel, target);
    } else if (!secondSelected && target !== firstSelected) {
      // Second selection
      secondSelected = target;
      if (hoverHighlight) hoverHighlight.style.display = 'none';
      if (secondHighlight) positionHighlight(secondHighlight, target, true);
      if (secondBadge) positionBadge(secondBadge, target);
      if (secondSizeLabel) positionSizeLabel(secondSizeLabel, target);
      drawConnector();
    }
  }

  /** Handles keydown for Escape key to reset selection. */
  function keydownHandler(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isMeasurementModeEnabled) {
      resetSelection();
    }
  }

  /** Adds event listeners for measurement mode interactions. */
  function addEventListeners(): void {
    document.addEventListener('mouseover', mouseOverHandler, true);
    document.addEventListener('mouseout', mouseOutHandler, true);
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keydownHandler, true);
    window.addEventListener('scroll', scrollResizeHandler, true);
    window.addEventListener('resize', scrollResizeHandler);
  }

  /** Removes event listeners. */
  function removeEventListeners(): void {
    try {
      document.removeEventListener('mouseover', mouseOverHandler, true);
      document.removeEventListener('mouseout', mouseOutHandler, true);
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('keydown', keydownHandler, true);
      window.removeEventListener('scroll', scrollResizeHandler, true);
      window.removeEventListener('resize', scrollResizeHandler);
    } catch (error) {
      Logger.error('Error removing measurement event listeners:', error);
    }
  }

  /** Removes all measurement DOM elements and resets references. */
  function removeElements(): void {
    measurementContainer?.remove();
    measurementContainer = null;
    measurementRoot = null;
    hoverHighlight = null;
    firstHighlight = null;
    firstBadge = null;
    firstSizeLabel = null;
    secondHighlight = null;
    secondBadge = null;
    secondSizeLabel = null;
    connectorLine = null;
    distanceLabel = null;
    xDistanceLabel = null;
    yDistanceLabel = null;
  }

  /**
   * Handles measurement mode state changes.
   *
   * @param isEnabled - Whether measurement mode is being enabled or disabled.
   */
  function handleMeasurementModeUpdate(isEnabled: boolean): void {
    Logger.info('Measurement mode update:', isEnabled);
    isMeasurementModeEnabled = isEnabled;

    if (isEnabled) {
      initializeDOM();
      addEventListeners();
    } else {
      removeEventListeners();
      resetSelection();
      removeElements();
    }
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(
    (
      request: RuntimeMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void,
    ) => {
      try {
        if (request.action === RUNTIME_MESSAGES.UPDATE_MEASUREMENT_MODE) {
          handleMeasurementModeUpdate(request.payload.isEnabled);
        } else if (request.action === RUNTIME_MESSAGES.PING) {
          sendResponse({ status: RUNTIME_MESSAGES.PONG });
          return true;
        }
      } catch (error) {
        Logger.error('Error handling measurement message:', error);
        return false;
      }
    },
  );
})();
