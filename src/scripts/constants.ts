/** Default locale for the extension. */
export const DEFAULT_LOCALE = 'en';

/**
 * Storage schema version. Increment this whenever TabState shape changes
 * so that migration logic can transform old stored data to the new shape.
 */
export const STORAGE_VERSION = 1;

export const DEFAULT_BORDER_SIZE = 1;
export const DEFAULT_BORDER_STYLE = 'solid';
export const DEFAULT_TAB_STATE = {
  borderMode: false,
  inspectorMode: false,
  measurementMode: false,
  rulerMode: false,
};
export const ICON_PATHS = {
  icon16: 'assets/icons/bp-icon-16.png',
  iconDisabled: 'assets/icons/bp-icon-16-disabled.png',
};
export const SHORTCUTS_PAGE = 'chrome://extensions/shortcuts';
