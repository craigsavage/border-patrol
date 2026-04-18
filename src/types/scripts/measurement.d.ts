/**
 * A 2D point in viewport coordinates.
 */
export type Point = {
  x: number;
  y: number;
};

/**
 * Computed gap distances and nearest edge anchor points between two elements.
 *
 * @property pointA - Anchor point on the first element's nearest edge.
 * @property pointB - Anchor point on the second element's nearest edge.
 * @property xGap - Horizontal gap in pixels (0 if elements overlap horizontally).
 * @property yGap - Vertical gap in pixels (0 if elements overlap vertically).
 */
export type EdgeData = {
  pointA: Point;
  pointB: Point;
  xGap: number;
  yGap: number;
};

/**
 * References to the three distance label DOM elements used by the connector.
 *
 * @property distanceLabel - Label for single-axis distance or right edge gap.
 * @property xDistanceLabel - Label for x-distance, left edge gap, or top edge gap.
 * @property yDistanceLabel - Label for y-distance or bottom edge gap.
 */
export type MeasurementLabelRefs = {
  distanceLabel: HTMLElement;
  xDistanceLabel: HTMLElement;
  yDistanceLabel: HTMLElement;
};
