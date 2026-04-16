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
  let lastPreviewTarget: HTMLElement | null = null;
  let previewRafId: number | null = null;

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
  const GUIDELINE_COLOR = 'rgba(148, 163, 184, 0.3)';
  /** Minimum pixel difference before an edge misalignment is shown. */
  const EDGE_EPSILON = 1;
  const SVG_NS = 'http://www.w3.org/2000/svg';

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

  // ---------------------------------------------------------------------------
  // SVG primitive helpers — append directly to connectorLine
  // ---------------------------------------------------------------------------

  /** Appends a dashed connector line between two points to the SVG overlay. */
  function appendConnectorLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): void {
    if (!connectorLine) return;
    const el = document.createElementNS(SVG_NS, 'line');
    el.setAttribute('x1', String(x1));
    el.setAttribute('y1', String(y1));
    el.setAttribute('x2', String(x2));
    el.setAttribute('y2', String(y2));
    el.setAttribute('stroke', CONNECTOR_COLOR);
    el.setAttribute('stroke-width', '2');
    el.setAttribute('stroke-dasharray', '6 4');
    connectorLine.appendChild(el);
  }

  /** Appends a filled circle to the SVG overlay. */
  function appendConnectorDot(
    cx: number,
    cy: number,
    r = 4,
    opacity?: string,
  ): void {
    if (!connectorLine) return;
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('cx', String(cx));
    el.setAttribute('cy', String(cy));
    el.setAttribute('r', String(r));
    el.setAttribute('fill', CONNECTOR_COLOR);
    if (opacity !== undefined) el.setAttribute('opacity', opacity);
    connectorLine.appendChild(el);
  }

  // ---------------------------------------------------------------------------
  // Connector branch functions — each handles one measurement layout
  // ---------------------------------------------------------------------------

  /** L-shaped connector for elements offset on both axes. */
  function drawLShaped(
    a: { x: number; y: number },
    b: { x: number; y: number },
    xGap: number,
    yGap: number,
  ): void {
    const corner = { x: b.x, y: a.y };
    appendConnectorLine(a.x, a.y, corner.x, corner.y);
    appendConnectorLine(corner.x, corner.y, b.x, b.y);
    appendConnectorDot(a.x, a.y);
    appendConnectorDot(b.x, b.y);
    appendConnectorDot(corner.x, corner.y, 3, '0.5');

    xDistanceLabel!.textContent = `${Math.round(xGap)}px`;
    xDistanceLabel!.style.position = 'fixed';
    xDistanceLabel!.style.left = `${(a.x + corner.x) / 2}px`;
    xDistanceLabel!.style.top = `${a.y}px`;
    xDistanceLabel!.style.display = 'block';

    yDistanceLabel!.textContent = `${Math.round(yGap)}px`;
    yDistanceLabel!.style.position = 'fixed';
    yDistanceLabel!.style.left = `${corner.x}px`;
    yDistanceLabel!.style.top = `${(corner.y + b.y) / 2}px`;
    yDistanceLabel!.style.display = 'block';
  }

  /**
   * Horizontal edge-misalignment layout: elements are vertically separated with
   * horizontal overlap but misaligned left/right edges. Shows the y-gap plus
   * left and/or right edge differences.
   */
  function drawHEdgeMisalign(
    rectA: DOMRect,
    rectB: DOMRect,
    a: { x: number; y: number },
    b: { x: number; y: number },
    yGap: number,
  ): void {
    const leftEdgeDiff = Math.abs(rectA.left - rectB.left);
    const rightEdgeDiff = Math.abs(rectA.right - rectB.right);
    const yBetween = (a.y + b.y) / 2;
    const rectACenterY = rectA.top + rectA.height / 2;
    const rectBCenterY = rectB.top + rectB.height / 2;
    const leftGapY = rectA.left > rectB.left ? rectACenterY : rectBCenterY;
    const rightGapY = rectA.right < rectB.right ? rectACenterY : rectBCenterY;

    appendConnectorLine(a.x, a.y, a.x, b.y);
    appendConnectorDot(a.x, a.y);
    appendConnectorDot(a.x, b.y);

    yDistanceLabel!.textContent = `${Math.round(yGap)}px`;
    yDistanceLabel!.style.position = 'fixed';
    yDistanceLabel!.style.left = `${a.x}px`;
    yDistanceLabel!.style.top = `${yBetween}px`;
    yDistanceLabel!.style.display = 'block';

    if (leftEdgeDiff > EDGE_EPSILON) {
      const leftFrom = Math.min(rectA.left, rectB.left);
      const leftTo = Math.max(rectA.left, rectB.left);
      appendConnectorLine(leftFrom, leftGapY, leftTo, leftGapY);
      appendConnectorDot(leftFrom, leftGapY);
      appendConnectorDot(leftTo, leftGapY);
      xDistanceLabel!.textContent = `${Math.round(leftEdgeDiff)}px`;
      xDistanceLabel!.style.position = 'fixed';
      xDistanceLabel!.style.left = `${(leftFrom + leftTo) / 2}px`;
      xDistanceLabel!.style.top = `${leftGapY}px`;
      xDistanceLabel!.style.display = 'block';
    }

    if (rightEdgeDiff > EDGE_EPSILON) {
      const rightFrom = Math.min(rectA.right, rectB.right);
      const rightTo = Math.max(rectA.right, rectB.right);
      appendConnectorLine(rightFrom, rightGapY, rightTo, rightGapY);
      appendConnectorDot(rightFrom, rightGapY);
      appendConnectorDot(rightTo, rightGapY);
      distanceLabel!.textContent = `${Math.round(rightEdgeDiff)}px`;
      distanceLabel!.style.position = 'fixed';
      distanceLabel!.style.left = `${(rightFrom + rightTo) / 2}px`;
      distanceLabel!.style.top = `${rightGapY}px`;
      distanceLabel!.style.display = 'block';
    }
  }

  /**
   * Vertical edge-misalignment layout: elements are horizontally separated with
   * vertical overlap but misaligned top/bottom edges. Shows the x-gap plus
   * top and/or bottom edge differences.
   */
  function drawVEdgeMisalign(
    rectA: DOMRect,
    rectB: DOMRect,
    a: { x: number; y: number },
    b: { x: number; y: number },
    xGap: number,
  ): void {
    const topEdgeDiff = Math.abs(rectA.top - rectB.top);
    const bottomEdgeDiff = Math.abs(rectA.bottom - rectB.bottom);
    const xBetween = (a.x + b.x) / 2;
    const rectACenterX = rectA.left + rectA.width / 2;
    const rectBCenterX = rectB.left + rectB.width / 2;
    const topGapX = rectA.top > rectB.top ? rectACenterX : rectBCenterX;
    const bottomGapX =
      rectA.bottom < rectB.bottom ? rectACenterX : rectBCenterX;

    appendConnectorLine(a.x, a.y, b.x, b.y);
    appendConnectorDot(a.x, a.y);
    appendConnectorDot(b.x, b.y);

    distanceLabel!.textContent = `${Math.round(xGap)}px`;
    distanceLabel!.style.position = 'fixed';
    distanceLabel!.style.left = `${xBetween}px`;
    distanceLabel!.style.top = `${a.y}px`;
    distanceLabel!.style.display = 'block';

    if (topEdgeDiff > EDGE_EPSILON) {
      const topFrom = Math.min(rectA.top, rectB.top);
      const topTo = Math.max(rectA.top, rectB.top);
      appendConnectorLine(topGapX, topFrom, topGapX, topTo);
      appendConnectorDot(topGapX, topFrom);
      appendConnectorDot(topGapX, topTo);
      xDistanceLabel!.textContent = `${Math.round(topEdgeDiff)}px`;
      xDistanceLabel!.style.position = 'fixed';
      xDistanceLabel!.style.left = `${topGapX}px`;
      xDistanceLabel!.style.top = `${(topFrom + topTo) / 2}px`;
      xDistanceLabel!.style.display = 'block';
    }

    if (bottomEdgeDiff > EDGE_EPSILON) {
      const bottomFrom = Math.min(rectA.bottom, rectB.bottom);
      const bottomTo = Math.max(rectA.bottom, rectB.bottom);
      appendConnectorLine(bottomGapX, bottomFrom, bottomGapX, bottomTo);
      appendConnectorDot(bottomGapX, bottomFrom);
      appendConnectorDot(bottomGapX, bottomTo);
      yDistanceLabel!.textContent = `${Math.round(bottomEdgeDiff)}px`;
      yDistanceLabel!.style.position = 'fixed';
      yDistanceLabel!.style.left = `${bottomGapX}px`;
      yDistanceLabel!.style.top = `${(bottomFrom + bottomTo) / 2}px`;
      yDistanceLabel!.style.display = 'block';
    }
  }

  /** Single dashed line with one distance label for pure x or y separation. */
  function drawSingleAxis(
    a: { x: number; y: number },
    b: { x: number; y: number },
    xGap: number,
    yGap: number,
  ): void {
    appendConnectorLine(a.x, a.y, b.x, b.y);
    appendConnectorDot(a.x, a.y);
    appendConnectorDot(b.x, b.y);
    const dist = xGap > 0 ? Math.round(xGap) : Math.round(yGap);
    distanceLabel!.textContent = `${dist}px`;
    distanceLabel!.style.position = 'fixed';
    distanceLabel!.style.left = `${(a.x + b.x) / 2}px`;
    distanceLabel!.style.top = `${(a.y + b.y) / 2}px`;
    distanceLabel!.style.display = 'block';
  }

  // ---------------------------------------------------------------------------
  // Main connector dispatcher
  // ---------------------------------------------------------------------------

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
    const svgEl = connectorLine as unknown as HTMLElement;

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

    while (connectorLine.firstChild) {
      connectorLine.removeChild(connectorLine.firstChild);
    }

    drawGuidelines(rectA);
    drawGuidelines(rectB);

    if (xGap > 0 && yGap > 0) {
      drawLShaped(a, b, xGap, yGap);
    } else if (
      xGap === 0 &&
      yGap > 0 &&
      (Math.abs(rectA.left - rectB.left) > EDGE_EPSILON ||
        Math.abs(rectA.right - rectB.right) > EDGE_EPSILON)
    ) {
      drawHEdgeMisalign(rectA, rectB, a, b, yGap);
    } else if (
      yGap === 0 &&
      xGap > 0 &&
      (Math.abs(rectA.top - rectB.top) > EDGE_EPSILON ||
        Math.abs(rectA.bottom - rectB.bottom) > EDGE_EPSILON)
    ) {
      drawVEdgeMisalign(rectA, rectB, a, b, xGap);
    } else {
      drawSingleAxis(a, b, xGap, yGap);
    }
  }

  /**
   * Draws thin dashed guideline extensions from each corner of the given rect
   * to the viewport edges. Called for both elements so connector lines always
   * originate from a visible guideline.
   *
   * @param rect - The bounding rect of an element to draw guidelines for.
   */
  function drawGuidelines(rect: DOMRect): void {
    if (!connectorLine) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const segments: [number, number, number, number][] = [
      [0, rect.top, rect.left, rect.top],
      [rect.left, 0, rect.left, rect.top],
      [rect.right, rect.top, vw, rect.top],
      [rect.right, 0, rect.right, rect.top],
      [0, rect.bottom, rect.left, rect.bottom],
      [rect.left, rect.bottom, rect.left, vh],
      [rect.right, rect.bottom, vw, rect.bottom],
      [rect.right, rect.bottom, rect.right, vh],
    ];

    segments.forEach(([x1, y1, x2, y2]) => {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', GUIDELINE_COLOR);
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4 4');
      connectorLine!.appendChild(line);
    });
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
    } else if (firstSelected && !secondSelected && hoveredElement) {
      if (secondHighlight)
        positionHighlight(secondHighlight, hoveredElement, false);
      if (secondBadge) positionBadge(secondBadge, hoveredElement);
      if (secondSizeLabel) positionSizeLabel(secondSizeLabel, hoveredElement);
      drawConnector(hoveredElement);
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
