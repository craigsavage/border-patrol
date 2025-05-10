const toggleBorders = document.querySelector('#toggleBorders');
const toggleInspector = document.querySelector('#toggleInspector');
const borderSize = document.querySelector('#borderSize');
const borderStyle = document.querySelector('#borderStyle');

/** Initializes the toggle switch state and border settings from storage. */
async function initializeStates() {
  console.log('Initializing popup state...');

  // Check if DOM elements exist before accessing
  if (!toggleBorders || !toggleInspector || !borderSize || !borderStyle) return;

  try {
    // Request initial state and settings from background script
    const response = await chrome.runtime.sendMessage({
      action: 'GET_INITIAL_POPUP_STATE',
    });
    console.log('Received initial state:', response);

    // Set the toggle switch states based on the response
    toggleBorders.checked = response.tabState?.borderMode ?? false;
    toggleInspector.checked = response.tabState?.inspectorMode ?? false;

    // Set the border settings based on the response
    borderSize.value = response.borderSettings?.borderSize ?? 1;
    borderStyle.value = response.borderSettings?.borderStyle ?? 'solid';
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
