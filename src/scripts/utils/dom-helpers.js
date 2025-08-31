/**
 * Retrieves the numeric value of a CSS property in pixels
 *
 * @param {string} prop - The CSS property
 * @param {CSSStyleDeclaration} computedStyle - The computed style of the element
 * @returns {number} The numeric value in pixels, or 0 if not a number
 */
export function getPxValue(prop, computedStyle) {
  return parseFloat(computedStyle.getPropertyValue(prop)) || 0;
}

/**
 * Retrieves and formats the class names of an element.
 * Truncates the list if it exceeds the maximum display length.
 *
 * @param {HTMLElement} element - The DOM element whose class names are to be retrieved.
 * @param {number} [maxLength=50] - The maximum length of the class names string.
 * @returns {string} A formatted string of class names.
 */
export function getElementClassNames(element, maxLength = 50) {
  const classAttribute = element.getAttribute('class');
  // Handle cases where class attribute is null or not a string
  if (!classAttribute || typeof classAttribute !== 'string') return '';

  // Split class names by whitespace and filter out empty strings
  const classNames = classAttribute.split(/\s+/).filter(Boolean);
  let elementClasses = '';
  if (classNames.length > 0) {
    elementClasses = `.${classNames.join(' .')}`;
    if (elementClasses.length > maxLength) {
      elementClasses = elementClasses.substring(0, maxLength - 3) + '...';
    }
  }

  return elementClasses;
}
