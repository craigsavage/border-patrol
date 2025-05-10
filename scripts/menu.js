const toggleBorders = document.querySelector('#toggleBorders');
const toggleInspector = document.querySelector('#toggleInspector');
const borderSize = document.querySelector('#borderSize');
const borderStyle = document.querySelector('#borderStyle');

console.log('menu.js loaded.'); // Log when the script starts

/**
 * Gets the active tab.
 *
 * @returns {Promise<chrome.tabs.Tab>} The active tab object.
 */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/** Initializes the toggle switch state and border settings from storage. */
async function initializeStates() {
  console.log('Initializing popup state...');

  // Check if DOM elements exist before accessing
  if (!toggleBorders || !toggleInspector || !borderSize || !borderStyle) return;

  try {
    // Get the active tab
    const activeTab = await getActiveTab();
    if (!activeTab?.id) {
      console.error('No active tab found.');
      return;
    }
    console.log('Active tab:', activeTab);
    // TODO:Check if the active tab is a restricted URL

    const tabIdString = activeTab.id?.toString();

    // Get state from storage
    const data = await chrome.storage.local.get([
      tabIdString,
      'borderSize',
      'borderStyle',
    ]);

    // Set the toggle switch states
    toggleBorders.checked = data[tabIdString]?.borderMode ?? false;
    toggleInspector.checked = data[tabIdString]?.inspectorMode ?? false;

    // Set the border settings values
    borderSize.value = data.borderSize ?? 1;
    borderStyle.value = data.borderStyle ?? 'solid';
  } catch (error) {
    console.error('Error during initialization:', error);
  }
}

/** Toggles the border mode state and applies changes to the active tab. */
async function toggleBorderMode() {
  console.log('Toggling border mode from popup...');
  try {
    // Send message to background script to handle the state toggle
    const newState = await chrome.runtime.sendMessage({
      action: 'TOGGLE_BORDER_MODE',
    });
    console.log('Received response for TOGGLE_BORDER_MODE:', newState);
    // Update UI based on the confirmed state from background
    toggleBorders.checked = newState;
  } catch (error) {
    console.error('Error toggling border mode:', error);
  }
}

/** Toggles the inspector mode state and applies changes to the active tab. */
async function toggleInspectorMode() {
  console.log('Toggling inspector mode from popup...');
  try {
    // Send message to background script to handle the state toggle
    const newState = await chrome.runtime.sendMessage({
      action: 'TOGGLE_INSPECTOR_MODE',
    });
    console.log('Received response for TOGGLE_INSPECTOR_MODE:', newState);
    // Update UI based on the confirmed state from background
    toggleInspector.checked = newState;
    console.log(`toggleInspector.checked is now: ${toggleInspector.checked}`);
  } catch (error) {
    console.error('Error toggling inspector mode:', error);
  }
}

/** Updates the border settings and applies changes to the active tab. */
async function updateBorderSettings() {
  console.log('Updating border settings from popup...');
  try {
    // Send message to background script to handle the settings update
    const response = await chrome.runtime.sendMessage({
      action: 'UPDATE_BORDER_SETTINGS',
      borderSize: borderSize.value,
      borderStyle: borderStyle.value,
    });
  } catch (error) {
    console.error('Error updating border settings:', error);
  }
}

// Run initialization when popup loads
document.addEventListener('DOMContentLoaded', initializeStates);

// Add event listeners
toggleBorders?.addEventListener('change', toggleBorderMode);
toggleInspector?.addEventListener('change', toggleInspectorMode);
borderSize?.addEventListener('input', updateBorderSettings);
borderStyle?.addEventListener('change', updateBorderSettings);
