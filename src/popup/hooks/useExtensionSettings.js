import { useState, useEffect } from 'react';
import { getActiveTab, isRestrictedUrl } from '../../scripts/helpers.js';
import Logger from '../../scripts/utils/logger';

/**
 * Custom hook to manage core extension settings and their interactions with Chrome APIs.
 *
 * @returns {{
 * isRestricted: boolean,
 * borderMode: boolean,
 * inspectorMode: boolean,
 * borderSize: number,
 * borderStyle: string,
 * handleToggleBorderMode: (checked: boolean) => void,
 * handleToggleInspectorMode: (checked: boolean) => void,
 * handleUpdateBorderSettings: (size: number, style: string) => void
 * }} An object containing the current settings and functions to update them.
 */
export function useExtensionSettings() {
  const [isRestricted, setIsRestricted] = useState(false);
  const [borderMode, setBorderMode] = useState(false);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [borderSize, setBorderSize] = useState(1);
  const [borderStyle, setBorderStyle] = useState('solid');
  const [tabId, setTabId] = useState(null);
  const [shortcuts, setShortcuts] = useState({});

  /**
   * Toggles the border mode on or off.
   * Sends a message to the background script to handle the state toggle.
   *
   * @param {boolean} checked - The new state of the border mode toggle.
   * @returns {Promise<void>} - Resolves when the state is toggled.
   */
  const handleToggleBorderMode = async checked => {
    setBorderMode(checked);
    if (tabId) {
      chrome.runtime.sendMessage({
        action: 'TOGGLE_BORDER_MODE',
        isEnabled: checked,
        tabId: tabId,
      });
    } else {
      Logger.warn('Cannot toggle border mode: tabId is null.');
    }
  };

  /**
   * Toggles the inspector mode on or off.
   * Sends a message to the background script to handle the state toggle.
   *
   * @param {boolean} checked - The new state of the inspector mode toggle.
   * @returns {Promise<void>} - Resolves when the state is toggled.
   */
  const handleToggleInspectorMode = async checked => {
    setInspectorMode(checked);
    if (tabId) {
      chrome.runtime.sendMessage({
        action: 'TOGGLE_INSPECTOR_MODE',
        isEnabled: checked,
        tabId: tabId,
      });
    } else {
      Logger.warn('Cannot toggle inspector mode: tabId is null.');
    }
  };

  /**
   * Updates the border settings.
   * Sends a message to the background script with the new settings.
   *
   * @param {number} size - The new border size to apply.
   * @param {string} style - The new border style to apply.
   */
  const handleUpdateBorderSettings = async (size, style) => {
    setBorderSize(size);
    setBorderStyle(style);
    chrome.runtime.sendMessage({
      action: 'UPDATE_BORDER_SETTINGS',
      borderSize: size,
      borderStyle: style,
    });
  };

  // --- Initial Data Fetching and Message Listener (useEffect) ---
  useEffect(() => {
    const initializeStates = async () => {
      Logger.info('Initializing extension settings...');
      try {
        const tab = await getActiveTab();

        if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) {
          setIsRestricted(true);
          Logger.info('Restricted page detected. Hiding form controls.');
          return;
        }

        setIsRestricted(false);
        setTabId(tab.id);

        const tabIdString = tab.id.toString();
        const data = await chrome.storage.local.get([
          tabIdString,
          'borderSize',
          'borderStyle',
        ]);

        setBorderMode(data[tabIdString]?.borderMode ?? false);
        setInspectorMode(data[tabIdString]?.inspectorMode ?? false);
        setBorderSize(data.borderSize ?? 1);
        setBorderStyle(data.borderStyle ?? 'solid');

        // Fetch extension commands and shortcuts
        if (window.chrome && chrome.commands) {
          chrome.commands.getAll(commands => {
            const shortcutMap = {};
            commands.forEach(cmd => {
              shortcutMap[cmd.name] = cmd.shortcut || '';
            });
            setShortcuts(shortcutMap);
          });
        }
      } catch (error) {
        Logger.error('Error during extension settings initialization:', error);
        setIsRestricted(true); // Show restricted state on error too
      }
    };

    initializeStates();

    // Listener for background script updates (e.g., if content script toggles state)
    const messageListener = (message, sender, sendResponse) => {
      if (message.action === 'UPDATE_POPUP_STATE') {
        if (typeof message.borderMode !== 'undefined') {
          setBorderMode(message.borderMode);
        }
        if (typeof message.inspectorMode !== 'undefined') {
          setInspectorMode(message.inspectorMode);
        }
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    // Cleanup function to remove the listener
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return {
    isRestricted,
    borderMode,
    inspectorMode,
    borderSize,
    borderStyle,
    shortcuts,
    handleToggleBorderMode,
    handleToggleInspectorMode,
    handleUpdateBorderSettings,
  };
}
