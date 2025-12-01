/**
 * Defines the options for border settings
 *
 * @property size - The size of the border
 * @property style - The style of the border
 */
export type BorderSettings = { size: number; style: string };

/**
 * Defines a grouping of elements for border application
 *
 * @property tags - Array of tag names for the group
 * @property color - The outline color for the group
 */
export type ElementGroup = {
  tags: string[];
  color: string;
};
