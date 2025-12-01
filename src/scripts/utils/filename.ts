/**
 * Generates a filename for a screenshot with the current timestamp.
 *
 * The filename follows the format 'border_patrol_screenshot_YYYY-MM-DDTHH-MM-SS.png',
 * where the timestamp is in ISO 8601 format with colons replaced by hyphens and milliseconds removed.
 *
 * @param format - The file format for the screenshot (Defaults to 'png').
 * @returns The timestamped filename for the screenshot.
 */
export function getTimestampedScreenshotFilename(
  format: string = 'png'
): string {
  // Ensure the format is lowercase and valid
  const validFormats = ['png', 'jpg', 'jpeg', 'webp'];
  if (!validFormats.includes(format.toLowerCase())) {
    throw new Error(
      `Invalid format: ${format}. Supported formats: ${validFormats.join(', ')}`
    );
  }

  // Generate the timestamped filename
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
  return `border_patrol_screenshot_${timestamp}.${format}`;
}
