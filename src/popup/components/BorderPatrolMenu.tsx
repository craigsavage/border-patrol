import React, { useState, useEffect } from 'react';
import {
  getActiveTab,
  isRestrictedUrl,
  hasPermission,
} from '../../scripts/helpers';
import Logger from '../../scripts/utils/logger';

interface BorderSettings {
  size: number;
  style: string;
}

const BorderPatrolMenu: React.FC = () => {
  const [hasDownloadPermission, setHasDownloadPermission] = useState(false);
  const [borderSettings, setBorderSettings] = useState<BorderSettings>({
    size: 1,
    style: 'solid',
  });
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    checkDownloadPermission();
    initializeStates();
  }, []);

  const initializeStates = async () => {
    try {
      const tab = await getActiveTab();
      if (tab) {
        const isRestrictedUrl = await isRestrictedUrl(tab.url);
        setIsRestricted(isRestrictedUrl);
      }
    } catch (error) {
      Logger.error('Error initializing states:', error);
    }
  };

  const checkDownloadPermission = async () => {
    try {
      const hasPermission = await hasPermission('downloads');
      setHasDownloadPermission(hasPermission);
      Logger.info(`Download permission status: ${hasPermission}`);
    } catch (error) {
      Logger.error('Error checking download permission:', error);
    }
  };

  const requestDownloadPermission = async () => {
    try {
      const granted = await chrome.permissions.request({
        permissions: ['downloads'],
      });

      if (granted) {
        setHasDownloadPermission(true);
        showNotification('Download permission granted!', 'success');
      } else {
        setHasDownloadPermission(false);
        showNotification('Download permission denied', 'error');
      }
    } catch (error) {
      Logger.error('Error requesting download permission:', error);
      showNotification('Failed to request download permission', 'error');
    }
  };

  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    Logger.info(`Notification: ${message} (Type: ${type})`);
    // Notification logic will be implemented based on your UI requirements
  };

  const toggleBorderMode = async () => {
    try {
      const newState = !await chrome.storage.local.get('borderMode');
      await chrome.storage.local.set({ borderMode: newState });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleBorderMode' });
        }
      });
    } catch (error) {
      Logger.error('Error toggling border mode:', error);
    }
  };

  const toggleInspectorMode = async () => {
    try {
      const newState = !await chrome.storage.local.get('inspectorMode');
      await chrome.storage.local.set({ inspectorMode: newState });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleInspectorMode' });
        }
      });
    } catch (error) {
      Logger.error('Error toggling inspector mode:', error);
    }
  };

  const updateBorderSettings = async (settings: Partial<BorderSettings>) => {
    try {
      const currentSettings = await chrome.storage.local.get('borderSettings');
      const updatedSettings = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ borderSettings: updatedSettings });
      setBorderSettings(updatedSettings);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'updateBorderSettings', settings: updatedSettings });
        }
      });
    } catch (error) {
      Logger.error('Error updating border settings:', error);
    }
  };

  const handleScreenshotRequest = async () => {
    try {
      const tab = await getActiveTab();
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { action: 'takeScreenshot' });
      }
    } catch (error) {
      Logger.error('Error handling screenshot request:', error);
      showNotification('Failed to take screenshot', 'error');
    }
  };

  return (
    <div className="popup-container">
      {/* Toggle Borders */}
      <div className="form-group">
        <label htmlFor="toggle-borders" className="label">Toggle Borders</label>
        <label className="switch">
          <input
            type="checkbox"
            id="toggle-borders"
            aria-label="Enable or disable borders"
            onChange={toggleBorderMode}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Toggle Inspector Mode */}
      <div className="form-group">
        <label htmlFor="toggle-inspector" className="label">
          Toggle Inspector Mode
        </label>
        <label className="switch">
          <input
            type="checkbox"
            id="toggle-inspector"
            aria-label="Enable or disable inspector mode"
            onChange={toggleInspectorMode}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Border Settings */}
      <fieldset>
        <legend aria-label="Border settings">Border Settings</legend>
        <div>
          <label htmlFor="border-size" className="label">Size:</label>
          <input
            type="range"
            id="border-size"
            min="1"
            max="10"
            value={borderSettings.size}
            onChange={(e) => updateBorderSettings({ size: parseInt(e.target.value) })}
          />
          <span>{borderSettings.size}</span>
        </div>
        <div>
          <label htmlFor="border-style" className="label">Style:</label>
          <select
            id="border-style"
            value={borderSettings.style}
            onChange={(e) => updateBorderSettings({ style: e.target.value })}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
          </select>
        </div>
      </fieldset>

      {/* Screenshot Section */}
      <div className="screenshot-section">
        {hasDownloadPermission ? (
          <button onClick={handleScreenshotRequest}>Take Screenshot</button>
        ) : (
          <div>
            <div id="screenshot-permission-warning">
              Download permission is required to take screenshots
            </div>
            <button onClick={requestDownloadPermission}>Grant Permission</button>
          </div>
        )}
      </div>

      {/* Restricted State */}
      {isRestricted && (
        <div id="restricted-message">
          This feature is not available on restricted URLs
        </div>
      )}
    </div>
  );
};

export default BorderPatrolMenu;
