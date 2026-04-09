import { RuntimeMessage } from "types/runtime-messages";

export interface IExtensionSettings {
  isRestricted: boolean;
  borderMode: boolean;
  inspectorMode: boolean;
  measurementMode: boolean;
  rulerMode: boolean;
  borderSize: number;
  borderStyle: string;
  shortcuts: Record<string, string>;
  handleToggleBorderMode: (checked: boolean) => void;
  handleToggleInspectorMode: (checked: boolean) => void;
  handleToggleMeasurementMode: (checked: boolean) => void;
  handleToggleRulerMode: (checked: boolean) => void;
  handleUpdateBorderSettings: (size: number, style: string) => void;
}

export type MessageListenerType = (
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => void;

export interface IScreenshotCapture {
  hasDownloadPermission: boolean;
  checkDownloadPermission: () => Promise<boolean>;
  requestDownloadPermission: () => Promise<boolean>;
  handleCaptureScreenshot: () => Promise<boolean>;
  handleCaptureFullScreenshot: () => Promise<boolean>;
}

export interface IDarkMode {
  isDarkMode: boolean;
  handleToggleDarkMode: (checked: boolean) => Promise<void>;
}
