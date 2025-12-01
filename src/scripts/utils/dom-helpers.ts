/**
 * Retrieves the numeric value of a CSS property in pixels
 *
 * @param prop - The CSS property
 * @param computedStyle - The computed style of the element
 * @returns The numeric value in pixels, or 0 if not a number
 */
export function getPxValue(
  prop: string,
  computedStyle: CSSStyleDeclaration
): number {
  return parseFloat(computedStyle.getPropertyValue(prop)) || 0;
}

/**
 * Retrieves and formats the class names of an element.
 * Truncates the list if it exceeds the maximum display length.
 *
 * @param element - The DOM element whose class names are to be retrieved.
 * @param maxLength - The maximum length of the class names string.
 * @returns A formatted string of class names.
 */
export function getElementClassNames(
  element: HTMLElement,
  maxLength: number = 50
): string {
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
