import { toSentenceCase } from './string-utils';

/**
 * Formats box model values for display
 *
 * @param {CSSStyleDeclaration} computedStyle - The computed style of the element
 * @param {string} property - The CSS property to format (e.g., 'margin', 'padding')
 * @returns {string} The formatted box model values
 */
export function formatBoxModelValues(computedStyle, property) {
  const elementValue = computedStyle.getPropertyValue(property);

  if (!elementValue || elementValue === '0px') return '';

  return elementValue;
}

/**
 * Gets the formatted border information from the computed style
 *
 * @param {CSSStyleDeclaration} computedStyle - The computed style of the element
 * @returns {string} The formatted border information (width style color) or an empty string if no border is present
 */
export function formatBorderInfo(computedStyle) {
  const borders = {
    top: {
      width: computedStyle.borderTopWidth,
      style: computedStyle.borderTopStyle,
      color: computedStyle.borderTopColor,
    },
    right: {
      width: computedStyle.borderRightWidth,
      style: computedStyle.borderRightStyle,
      color: computedStyle.borderRightColor,
    },
    bottom: {
      width: computedStyle.borderBottomWidth,
      style: computedStyle.borderBottomStyle,
      color: computedStyle.borderBottomColor,
    },
    left: {
      width: computedStyle.borderLeftWidth,
      style: computedStyle.borderLeftStyle,
      color: computedStyle.borderLeftColor,
    },
  };

  // Check if all borders are zero width, none style, or transparent color
  const allBordersZero = Object.values(borders).every(border => {
    return (
      border.width === '0px' ||
      border.style === 'none' ||
      border.color === 'transparent'
    );
  });

  if (allBordersZero) return '';

  // Check if all borders have the same width, style, and color
  const allBordersSame = Object.values(borders).every(border => {
    return (
      border.width === borders.top.width &&
      border.style === borders.top.style &&
      border.color === borders.top.color
    );
  });

  // Return the top border information if all borders are the same
  if (allBordersSame) {
    return `${borders.top.width} ${borders.top.style} ${borders.top.color}`;
  }
  // If borders are not the same, return a formatted string for each border
  return (
    '<br>' +
    Object.entries(borders)
      .map(([side, border]) => {
        // Skip if border is zero width, none style, or transparent color
        if (
          border.width === '0px' ||
          border.style === 'none' ||
          border.color === 'transparent'
        ) {
          return '';
        }
        // Format the border information for each side
        return `${toSentenceCase(side)}: ${border.width} ${border.style} ${
          border.color
        }`;
      })
      .filter(info => info) // Filter out empty strings
      .join('<br>')
  );
}
