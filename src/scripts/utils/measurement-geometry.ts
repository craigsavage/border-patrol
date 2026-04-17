import { EdgeData } from 'types/scripts/measurement';

/**
 * Minimum pixel difference required before an edge misalignment is rendered.
 * Used to suppress noise from sub-pixel layout differences.
 */
export const EDGE_EPSILON = 1;

/**
 * Returns the nearest edge anchor points between two DOMRects along with
 * the individual horizontal and vertical gap distances between them.
 *
 * @param a - The first element's bounding rect.
 * @param b - The second element's bounding rect.
 * @returns Edge anchor points on each rect and the x/y gap values.
 */
export function getEdgeData(a: DOMRect, b: DOMRect): EdgeData {
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
