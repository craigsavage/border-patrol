import { useState, useEffect } from 'react';
import Logger from '../../scripts/utils/logger.js';

/**
 * Custom hook to manage dark mode functionality.
 *
 * @returns {{
 * isDarkMode: boolean,
 * handleToggleDarkMode: (checked: boolean) => Promise<void>
 * }} An object containing the current dark mode state and a function to toggle it.
 */
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  /**
   * Toggles dark mode on or off.
   *
   * @param {boolean} checked - True if dark mode is enabled, false otherwise.
   */
  const handleToggleDarkMode = async checked => {
    setIsDarkMode(checked);
    // Save the dark mode preference to local storage
    try {
      await chrome.storage.local.set({ darkMode: checked });
      Logger.info(`Dark mode preference saved: ${checked}`);
    } catch (error) {
      Logger.error('Error saving dark mode preference:', error);
    }
  };

  // Loads the dark mode preference from local storage when the component mounts.
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        const { darkMode: savedDarkMode } = await chrome.storage.local.get(
          'darkMode'
        );

        // If a preference is found, set it; otherwise, default to light mode
        if (savedDarkMode !== undefined) {
          handleToggleDarkMode(savedDarkMode);
        } else {
          Logger.warn(
            'No dark mode preference found, defaulting to light mode.'
          );
          handleToggleDarkMode(false);
        }
      } catch (error) {
        Logger.error('Error loading dark mode preference:', error);
      }
    };
    loadDarkModePreference();
  }, []);

  return { isDarkMode, handleToggleDarkMode };
};
