import { Point, MeasurementLabelRefs } from 'types/scripts/measurement';
import { EDGE_EPSILON } from './measurement-geometry';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const CONNECTOR_COLOR = '#ef4444';
export const GUIDELINE_COLOR = 'rgba(148, 163, 184, 0.3)';

// ---------------------------------------------------------------------------
// SVG primitive helpers
// ---------------------------------------------------------------------------

/**
 * Appends a dashed connector line between two points to the given SVG element.
 *
 * @param svg - The SVG element to append to.
 * @param x1 - Start x coordinate.
 * @param y1 - Start y coordinate.
 * @param x2 - End x coordinate.
 * @param y2 - End y coordinate.
 */
export function appendConnectorLine(
  svg: SVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  const el = document.createElementNS(SVG_NS, 'line');
  el.setAttribute('x1', String(x1));
  el.setAttribute('y1', String(y1));
  el.setAttribute('x2', String(x2));
  el.setAttribute('y2', String(y2));
  el.setAttribute('stroke', CONNECTOR_COLOR);
  el.setAttribute('stroke-width', '2');
  el.setAttribute('stroke-dasharray', '6 4');
  svg.appendChild(el);
}

/**
 * Appends a filled circle endpoint to the given SVG element.
 *
 * @param svg - The SVG element to append to.
 * @param cx - Centre x coordinate.
 * @param cy - Centre y coordinate.
 * @param r - Radius (default 4).
 * @param opacity - Optional opacity value as a string.
 */
export function appendConnectorDot(
  svg: SVGElement,
  cx: number,
  cy: number,
  r = 4,
  opacity?: string,
): void {
  const el = document.createElementNS(SVG_NS, 'circle');
  el.setAttribute('cx', String(cx));
  el.setAttribute('cy', String(cy));
  el.setAttribute('r', String(r));
  el.setAttribute('fill', CONNECTOR_COLOR);
  if (opacity !== undefined) el.setAttribute('opacity', opacity);
  svg.appendChild(el);
}

// ---------------------------------------------------------------------------
// Connector branch functions — each handles one measurement layout
// ---------------------------------------------------------------------------

/**
 * Draws thin dashed guideline extensions from each corner of the given rect
 * to the viewport edges. Call for both elements so connector lines always
 * originate from a visible guideline.
 *
 * @param svg - The SVG overlay element to draw into.
 * @param rect - The bounding rect of the element to draw guidelines for.
 */
export function drawGuidelines(svg: SVGElement, rect: DOMRect): void {
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
    svg.appendChild(line);
  });
}

/**
 * L-shaped connector for elements offset on both axes.
 *
 * @param svg - The SVG overlay element.
 * @param labels - Distance label DOM references.
 * @param a - Anchor point on the first element.
 * @param b - Anchor point on the second element.
 * @param xGap - Horizontal gap in pixels.
 * @param yGap - Vertical gap in pixels.
 */
export function drawLShaped(
  svg: SVGElement,
  labels: MeasurementLabelRefs,
  a: Point,
  b: Point,
  xGap: number,
  yGap: number,
): void {
  const corner = { x: b.x, y: a.y };
  appendConnectorLine(svg, a.x, a.y, corner.x, corner.y);
  appendConnectorLine(svg, corner.x, corner.y, b.x, b.y);
  appendConnectorDot(svg, a.x, a.y);
  appendConnectorDot(svg, b.x, b.y);
  appendConnectorDot(svg, corner.x, corner.y, 3, '0.5');

  const { xDistanceLabel, yDistanceLabel } = labels;

  xDistanceLabel.textContent = `${Math.round(xGap)}px`;
  xDistanceLabel.style.position = 'fixed';
  xDistanceLabel.style.left = `${(a.x + corner.x) / 2}px`;
  xDistanceLabel.style.top = `${a.y}px`;
  xDistanceLabel.style.display = 'block';

  yDistanceLabel.textContent = `${Math.round(yGap)}px`;
  yDistanceLabel.style.position = 'fixed';
  yDistanceLabel.style.left = `${corner.x}px`;
  yDistanceLabel.style.top = `${(corner.y + b.y) / 2}px`;
  yDistanceLabel.style.display = 'block';
}

/**
 * Horizontal edge-misalignment layout: elements are vertically separated with
 * horizontal overlap but misaligned left/right edges. Renders the y-gap line
 * plus horizontal segments for each edge difference exceeding EDGE_EPSILON.
 *
 * @param svg - The SVG overlay element.
 * @param labels - Distance label DOM references.
 * @param rectA - Bounding rect of the first element.
 * @param rectB - Bounding rect of the second element.
 * @param a - Anchor point on the first element.
 * @param b - Anchor point on the second element.
 * @param yGap - Vertical gap in pixels.
 */
export function drawHEdgeMisalign(
  svg: SVGElement,
  labels: MeasurementLabelRefs,
  rectA: DOMRect,
  rectB: DOMRect,
  a: Point,
  b: Point,
  yGap: number,
): void {
  const leftEdgeDiff = Math.abs(rectA.left - rectB.left);
  const rightEdgeDiff = Math.abs(rectA.right - rectB.right);
  const yBetween = (a.y + b.y) / 2;
  const rectACenterY = rectA.top + rectA.height / 2;
  const rectBCenterY = rectB.top + rectB.height / 2;
  const leftGapY = rectA.left > rectB.left ? rectACenterY : rectBCenterY;
  const rightGapY = rectA.right < rectB.right ? rectACenterY : rectBCenterY;

  const { distanceLabel, xDistanceLabel, yDistanceLabel } = labels;

  appendConnectorLine(svg, a.x, a.y, a.x, b.y);
  appendConnectorDot(svg, a.x, a.y);
  appendConnectorDot(svg, a.x, b.y);

  yDistanceLabel.textContent = `${Math.round(yGap)}px`;
  yDistanceLabel.style.position = 'fixed';
  yDistanceLabel.style.left = `${a.x}px`;
  yDistanceLabel.style.top = `${yBetween}px`;
  yDistanceLabel.style.display = 'block';

  if (leftEdgeDiff > EDGE_EPSILON) {
    const leftFrom = Math.min(rectA.left, rectB.left);
    const leftTo = Math.max(rectA.left, rectB.left);
    appendConnectorLine(svg, leftFrom, leftGapY, leftTo, leftGapY);
    appendConnectorDot(svg, leftFrom, leftGapY);
    appendConnectorDot(svg, leftTo, leftGapY);
    xDistanceLabel.textContent = `${Math.round(leftEdgeDiff)}px`;
    xDistanceLabel.style.position = 'fixed';
    xDistanceLabel.style.left = `${(leftFrom + leftTo) / 2}px`;
    xDistanceLabel.style.top = `${leftGapY}px`;
    xDistanceLabel.style.display = 'block';
  }

  if (rightEdgeDiff > EDGE_EPSILON) {
    const rightFrom = Math.min(rectA.right, rectB.right);
    const rightTo = Math.max(rectA.right, rectB.right);
    appendConnectorLine(svg, rightFrom, rightGapY, rightTo, rightGapY);
    appendConnectorDot(svg, rightFrom, rightGapY);
    appendConnectorDot(svg, rightTo, rightGapY);
    distanceLabel.textContent = `${Math.round(rightEdgeDiff)}px`;
    distanceLabel.style.position = 'fixed';
    distanceLabel.style.left = `${(rightFrom + rightTo) / 2}px`;
    distanceLabel.style.top = `${rightGapY}px`;
    distanceLabel.style.display = 'block';
  }
}

/**
 * Vertical edge-misalignment layout: elements are horizontally separated with
 * vertical overlap but misaligned top/bottom edges. Renders the x-gap line
 * plus vertical segments for each edge difference exceeding EDGE_EPSILON.
 *
 * @param svg - The SVG overlay element.
 * @param labels - Distance label DOM references.
 * @param rectA - Bounding rect of the first element.
 * @param rectB - Bounding rect of the second element.
 * @param a - Anchor point on the first element.
 * @param b - Anchor point on the second element.
 * @param xGap - Horizontal gap in pixels.
 */
export function drawVEdgeMisalign(
  svg: SVGElement,
  labels: MeasurementLabelRefs,
  rectA: DOMRect,
  rectB: DOMRect,
  a: Point,
  b: Point,
  xGap: number,
): void {
  const topEdgeDiff = Math.abs(rectA.top - rectB.top);
  const bottomEdgeDiff = Math.abs(rectA.bottom - rectB.bottom);
  const xBetween = (a.x + b.x) / 2;
  const rectACenterX = rectA.left + rectA.width / 2;
  const rectBCenterX = rectB.left + rectB.width / 2;
  const topGapX = rectA.top > rectB.top ? rectACenterX : rectBCenterX;
  const bottomGapX = rectA.bottom < rectB.bottom ? rectACenterX : rectBCenterX;

  const { distanceLabel, xDistanceLabel, yDistanceLabel } = labels;

  appendConnectorLine(svg, a.x, a.y, b.x, b.y);
  appendConnectorDot(svg, a.x, a.y);
  appendConnectorDot(svg, b.x, b.y);

  distanceLabel.textContent = `${Math.round(xGap)}px`;
  distanceLabel.style.position = 'fixed';
  distanceLabel.style.left = `${xBetween}px`;
  distanceLabel.style.top = `${a.y}px`;
  distanceLabel.style.display = 'block';

  if (topEdgeDiff > EDGE_EPSILON) {
    const topFrom = Math.min(rectA.top, rectB.top);
    const topTo = Math.max(rectA.top, rectB.top);
    appendConnectorLine(svg, topGapX, topFrom, topGapX, topTo);
    appendConnectorDot(svg, topGapX, topFrom);
    appendConnectorDot(svg, topGapX, topTo);
    xDistanceLabel.textContent = `${Math.round(topEdgeDiff)}px`;
    xDistanceLabel.style.position = 'fixed';
    xDistanceLabel.style.left = `${topGapX}px`;
    xDistanceLabel.style.top = `${(topFrom + topTo) / 2}px`;
    xDistanceLabel.style.display = 'block';
  }

  if (bottomEdgeDiff > EDGE_EPSILON) {
    const bottomFrom = Math.min(rectA.bottom, rectB.bottom);
    const bottomTo = Math.max(rectA.bottom, rectB.bottom);
    appendConnectorLine(svg, bottomGapX, bottomFrom, bottomGapX, bottomTo);
    appendConnectorDot(svg, bottomGapX, bottomFrom);
    appendConnectorDot(svg, bottomGapX, bottomTo);
    yDistanceLabel.textContent = `${Math.round(bottomEdgeDiff)}px`;
    yDistanceLabel.style.position = 'fixed';
    yDistanceLabel.style.left = `${bottomGapX}px`;
    yDistanceLabel.style.top = `${(bottomFrom + bottomTo) / 2}px`;
    yDistanceLabel.style.display = 'block';
  }
}

/**
 * Single dashed line with one distance label for pure x or y separation.
 *
 * @param svg - The SVG overlay element.
 * @param labels - Distance label DOM references.
 * @param a - Anchor point on the first element.
 * @param b - Anchor point on the second element.
 * @param xGap - Horizontal gap in pixels.
 * @param yGap - Vertical gap in pixels.
 */
export function drawSingleAxis(
  svg: SVGElement,
  labels: MeasurementLabelRefs,
  a: Point,
  b: Point,
  xGap: number,
  yGap: number,
): void {
  appendConnectorLine(svg, a.x, a.y, b.x, b.y);
  appendConnectorDot(svg, a.x, a.y);
  appendConnectorDot(svg, b.x, b.y);
  const dist = xGap > 0 ? Math.round(xGap) : Math.round(yGap);
  labels.distanceLabel.textContent = `${dist}px`;
  labels.distanceLabel.style.position = 'fixed';
  labels.distanceLabel.style.left = `${(a.x + b.x) / 2}px`;
  labels.distanceLabel.style.top = `${(a.y + b.y) / 2}px`;
  labels.distanceLabel.style.display = 'block';
}
