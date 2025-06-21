/**
 * Converts a string to sentence case (first letter capitalized, rest lowercase)
 *
 * @param {string} str - The string to convert
 * @returns {string} The string in sentence case
 * @example
 * toSentenceCase('hello world'); // 'Hello world'
 */
export const toSentenceCase = (str = '') => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
