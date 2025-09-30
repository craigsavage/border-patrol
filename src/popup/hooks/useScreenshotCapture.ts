import { useState, useEffect } from 'react';
import type { IScreenshotCapture } from '../../types/popup/hooks';
import { hasPermission } from '../../scripts/helpers';
import Logger from '../../scripts/utils/logger';

/**
 * Custom hook to manage screenshot capture permissions and functionality.
 *
 * @param isAppRestricted Indicates if the app is restricted (e.g., on a restricted URL).
 * @returns An object containing functions to check, request, and handle screenshot capture permissions.
 */
export function useScreenshotCapture(
  isAppRestricted: boolean
): IScreenshotCapture {
  const [hasDownloadPermission, setHasDownloadPermission] =
    useState<boolean>(false);

  /**
   * Checks if the extension has the 'downloads' permission.
   *
   * @returns {Promise<boolean>} A promise that resolves to true if the permission is granted, otherwise false.
   */
  const checkDownloadPermission = async () => {
    try {
      const granted = await hasPermission('downloads');
      setHasDownloadPermission(granted);
      Logger.info(`Download permission status: ${granted}`);
      return granted;
    } catch (error) {
      Logger.error('Error checking download permission:', error);
      setHasDownloadPermission(false);
      return false;
    }
  };

  /**
   * Requests download permission from the user.
   * If the permission is granted, it sets `hasDownloadPermission` to true otherwise false.
   * Logs the success or failure of the permission request.
   *
   * @returns {Promise<boolean>} Returns a promise that resolves to true if the permission was granted, otherwise false.
   */
  const requestDownloadPermission = async () => {
    try {
      const granted = await chrome.permissions.request({
        permissions: ['downloads'],
      });
      setHasDownloadPermission(granted);
      if (granted) {
        // You might want a better notification system with Ant Design 'message' component
        // message.success('Download permission granted!');
      } else {
        // message.error('Download permission denied');
      }
      return granted;
    } catch (error) {
      Logger.error('Error requesting download permission:', error);
      // message.error('Failed to request download permission');
      return false;
    }
  };

  /**
   * Handles the process of capturing a screenshot by sending a message to the background script.
   * Logs the success or failure of the capture process.
   *
   * @returns {Promise<boolean>} Returns a promise that resolves to true if the screenshot was captured successfully, otherwise false.
   */
  const handleCaptureScreenshot = async () => {
    try {
      const success = await chrome.runtime.sendMessage({
        action: 'CAPTURE_SCREENSHOT',
      });
      Logger.info('Screenshot capture response:', success);
      return success;
    } catch (error) {
      Logger.error('Error capturing screenshot:', error);
      return false;
    }
  };

  // Check download permission on mount if the app is not restricted
  useEffect(() => {
    if (!isAppRestricted) {
      checkDownloadPermission();
    }
  }, [isAppRestricted]);

  return {
    hasDownloadPermission,
    checkDownloadPermission,
    requestDownloadPermission,
    handleCaptureScreenshot,
  };
}
