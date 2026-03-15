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
}

export interface BorderSettingsProps {
  borderSize: number;
  borderStyle: string;
  onUpdateBorderSettings: (size: number, style: string) => void;
  compact?: boolean;
}

export interface ScreenshotSectionProps {
  hasDownloadPermission: boolean;
  onRequestPermission: () => Promise<boolean>;
  onCaptureScreenshot: () => Promise<boolean>;
  onCaptureFullScreenshot: () => Promise<boolean>;
}

/** A type representing a notification message. */
export type NotificationType = {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
};
