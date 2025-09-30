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

export interface FooterProps {
  isDarkMode: boolean;
  onToggleDarkMode: (checked: boolean) => void;
}

/** A type representing a notification message. */
export type NotificationType = {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
};
