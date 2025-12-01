// overlay-formatters utils types

/**
 * Options for formatting a font stack
 *
 * @param fontFamily - The font family string
 * @param maxFonts - Maximum number of fonts to display
 * @param showFallback - Whether to show fallback fonts
 */
export type FormatFontStackOptions = {
  fontFamily: string;
  maxFonts?: number;
  showFallback?: boolean;
};
