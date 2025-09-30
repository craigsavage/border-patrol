export interface IExtensionSettings {
  isRestricted: boolean;
  borderMode: boolean;
  inspectorMode: boolean;
  borderSize: number;
  borderStyle: string;
  shortcuts: Record<string, string>;
  handleToggleBorderMode: (checked: boolean) => void;
  handleToggleInspectorMode: (checked: boolean) => void;
  handleUpdateBorderSettings: (size: number, style: string) => void;
}

export type MessageListenerType = (
  message: {
    action: string;
    borderMode?: boolean;
    inspectorMode?: boolean;
  },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => void;

export interface IScreenshotCapture {
  hasDownloadPermission: boolean;
  checkDownloadPermission: () => Promise<boolean>;
  requestDownloadPermission: () => Promise<boolean>;
  handleCaptureScreenshot: () => Promise<boolean>;
}
