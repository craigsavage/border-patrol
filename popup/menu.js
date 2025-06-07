import { getActiveTab, isRestrictedUrl, Logger } from '../scripts/helpers.js';

// Get DOM elements
const toggleBorders = document.querySelector('#toggleBorders');
const toggleInspector = document.querySelector('#toggleInspector');
const borderSize = document.querySelector('#borderSize');
const borderStyle = document.querySelector('#borderStyle');
const restrictedMessage = document.querySelector('#restricted-message');

/**
 * Toggles the restricted page state in the popup
 *
 * @param {boolean} isRestricted - Whether the page is restricted or not
 */
function toggleRestrictedState(isRestricted) {
  document.body.classList.toggle('restricted', isRestricted);
  restrictedMessage?.style.display = isRestricted ? 'block' : 'none';

  // Toggle form controls
  const formControls = document.querySelectorAll(
    'input, select, button, fieldset'
  );
  formControls.forEach(control => {
    control.disabled = isRestricted;
  });
}

/** Shows the restricted page state in the popup */
function showRestrictedState() {
  toggleRestrictedState(true);
}

/** Hides the restricted page state and enables form controls */
function hideRestrictedState() {
  toggleRestrictedState(false);
}

/** Initializes the toggle switch state and border settings from storage. */
async function initializeStates() {
  Logger.info('Initializing popup state...');

  // Check if DOM elements exist before accessing
  if (!toggleBorders || !toggleInspector || !borderSize || !borderStyle || !restrictedMessage) return;

  try {
    // Get the active tab and check if it's valid
    const tab = await getActiveTab();
    if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) {
      showRestrictedState();
      return;
    }

    // Ensure restricted state is hidden if we're on a valid page
    hideRestrictedState();

    const tabIdString = tab.id.toString();

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
    Logger.error('Error during initialization:', error);
    showRestrictedState();
    return;
  }
}

/** Toggles the border. */
function toggleBorderMode() {
  // Send message to background script to handle the state toggle
  chrome.runtime.sendMessage({ action: 'TOGGLE_BORDER_MODE' });
}

/** Toggles the inspector mode. */
function toggleInspectorMode() {
  // Send message to background script to handle the state toggle
  chrome.runtime.sendMessage({ action: 'TOGGLE_INSPECTOR_MODE' });
}

/** Updates the border settings */
function updateBorderSettings() {
  // Send message to background script to handle the settings update
  chrome.runtime.sendMessage({
    action: 'UPDATE_BORDER_SETTINGS',
    borderSize: borderSize.value,
    borderStyle: borderStyle.value,
  });
}

// Run initialization when popup loads
document.addEventListener('DOMContentLoaded', initializeStates);

// Add event listeners
toggleBorders?.addEventListener('change', toggleBorderMode);
toggleInspector?.addEventListener('change', toggleInspectorMode);
borderSize?.addEventListener('input', updateBorderSettings);
borderStyle?.addEventListener('change', updateBorderSettings);
