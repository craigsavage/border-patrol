/**
 * Converts a string to sentence case (first letter capitalized, rest lowercase)
 *
 * @param str - The string to convert
 * @returns The string in sentence case
 * @example
 * toSentenceCase('hello world'); // 'Hello world'
 */
export const toSentenceCase = (str: string = ''): string => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
