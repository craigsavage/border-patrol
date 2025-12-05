/** Children only props interface for basic wrapper components. */
export interface IChildrenProps {
  children: React.ReactNode;
}

export interface RestrictedMessageProps {
  isVisible: boolean;
}

export interface FeatureToggleProps {
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  commandName: string;
}

export interface ShortcutInfoProps {
  command: string;
}

export interface BorderSettingsProps {
  borderSize: number;
  borderStyle: string;
  onUpdateBorderSettings: (size: number, style: string) => void;
}

export interface ScreenshotSectionProps {
  hasDownloadPermission: boolean;
  onRequestPermission: () => Promise<boolean>;
  onCaptureScreenshot: () => Promise<boolean>;
}

/** Props for Footer component.
 *
 * @property isDarkMode - Indicates if dark mode is enabled.
 * @property onToggleDarkMode - Callback function when dark mode is toggled.
 */
export interface FooterProps {
  isDarkMode: boolean;
  onToggleDarkMode: (checked: boolean) => void;
}

/**
 * Props for DarkModeToggle component.
 *
 * @property isDarkMode - Indicates if dark mode is enabled.
 * @property onToggleDarkMode - Callback function when the toggle is clicked.
 */
export interface DarkModeToggleProps {
  isDarkMode: boolean;
  onToggleDarkMode: (checked: boolean) => void;
}

/** A type representing a notification message. */
export type NotificationType = {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
};
