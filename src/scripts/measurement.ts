import Logger from './utils/logger';
import MEASUREMENT_STYLES from '../styles/components/measurement.shadow.scss';

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

    // Create hover highlight
    hoverHighlight = createOverlayElement('bp-meas-hover');

    // Create first selection highlight + badge
    firstHighlight = createOverlayElement('bp-meas-first');
    firstBadge = document.createElement('div');
    firstBadge.id = 'bp-meas-first-badge';
    firstBadge.className = 'bp-meas-badge bp-meas-badge--first';
    firstBadge.textContent = '1st';
    measurementRoot.appendChild(firstBadge);

    // Create second selection highlight + badge
    secondHighlight = createOverlayElement('bp-meas-second');
    secondBadge = document.createElement('div');
    secondBadge.id = 'bp-meas-second-badge';
    secondBadge.className = 'bp-meas-badge bp-meas-badge--second';
    secondBadge.textContent = '2nd';
    measurementRoot.appendChild(secondBadge);

    // Create SVG connector line
    const svgNS = 'http://www.w3.org/2000/svg';
    connectorLine = document.createElementNS(
      svgNS,
      'svg',
    ) as unknown as SVGElement;
    (connectorLine as unknown as HTMLElement).id = 'bp-meas-connector';
    connectorLine.setAttribute('class', 'bp-meas-connector');
    measurementRoot.appendChild(connectorLine);

    // Create distance label
    distanceLabel = document.createElement('div');
    distanceLabel.id = 'bp-meas-distance';
    distanceLabel.className = 'bp-meas-distance';
    measurementRoot.appendChild(distanceLabel);

    hideAll();
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
      secondHighlight,
      secondBadge,
      distanceLabel,
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
   * Returns the center point of an element's bounding rect.
   *
   * @param el - The element.
   * @returns An object with x and y coordinates.
   */
  function getCenter(el: HTMLElement): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  /**
   * Calculates the Euclidean distance between two points.
   *
   * @param a - First point.
   * @param b - Second point.
   * @returns The pixel distance, rounded.
   */
  function calcDistance(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): number {
    return Math.round(
      Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)),
    );
  }

  /** Draws the SVG connector line and distance label between the two selected elements. */
  function drawConnector(): void {
    if (!firstSelected || !secondSelected || !connectorLine || !distanceLabel)
      return;

    const a = getCenter(firstSelected);
    const b = getCenter(secondSelected);
    const dist = calcDistance(a, b);

    const svgNS = 'http://www.w3.org/2000/svg';
    const svgEl = connectorLine as unknown as HTMLElement;

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

    // Clear previous content
    while (connectorLine.firstChild) {
      connectorLine.removeChild(connectorLine.firstChild);
    }

    // Draw the line
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', String(a.x));
    line.setAttribute('y1', String(a.y));
    line.setAttribute('x2', String(b.x));
    line.setAttribute('y2', String(b.y));
    line.setAttribute('stroke', CONNECTOR_COLOR);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6 4');
    connectorLine.appendChild(line);

    // Draw endpoint circles
    [a, b].forEach(point => {
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', String(point.x));
      circle.setAttribute('cy', String(point.y));
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', CONNECTOR_COLOR);
      connectorLine!.appendChild(circle);
    });

    // Position distance label at midpoint
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    distanceLabel.textContent = `${dist}px`;
    distanceLabel.style.position = 'fixed';
    distanceLabel.style.left = `${midX}px`;
    distanceLabel.style.top = `${midY}px`;
    distanceLabel.style.display = 'block';
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
    if (hoverHighlight) {
      positionHighlight(hoverHighlight, target, false);
    }
  }

  /** Handles mouseout events to hide the hover highlight. */
  function mouseOutHandler(): void {
    hoveredElement = null;
    if (hoverHighlight) hoverHighlight.style.display = 'none';
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
    } else if (!secondSelected && target !== firstSelected) {
      // Second selection
      secondSelected = target;
      if (hoverHighlight) hoverHighlight.style.display = 'none';
      if (secondHighlight) positionHighlight(secondHighlight, target, true);
      if (secondBadge) positionBadge(secondBadge, target);
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
  }

  /** Removes event listeners. */
  function removeEventListeners(): void {
    try {
      document.removeEventListener('mouseover', mouseOverHandler, true);
      document.removeEventListener('mouseout', mouseOutHandler, true);
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('keydown', keydownHandler, true);
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
    secondHighlight = null;
    secondBadge = null;
    connectorLine = null;
    distanceLabel = null;
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
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void,
    ) => {
      try {
        if (request.action === 'UPDATE_MEASUREMENT_MODE') {
          handleMeasurementModeUpdate(request.isEnabled);
        } else if (request.action === 'PING') {
          sendResponse({ status: 'PONG' });
          return true;
        }
      } catch (error) {
        Logger.error('Error handling measurement message:', error);
        return false;
      }
    },
  );
})();
