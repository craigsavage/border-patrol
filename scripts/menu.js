const toggleBorders = document.querySelector('#toggleBorders');
const toggleInspector = document.querySelector('#toggleInspector');
const borderSize = document.querySelector('#borderSize');
const borderStyle = document.querySelector('#borderStyle');

/** Initializes the toggle switch state and border settings from storage. */
async function initializeStates() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const tabId = tab.id;
  const tabIdString = tabId.toString();

  // Get state from storage
  const data = await chrome.storage.local.get([
    tabIdString,
    'borderSize',
    'borderStyle',
  ]);

  // Set the toggle switch state
  toggleBorders.checked = data[tabIdString]?.borderMode ?? false;
  toggleInspector.checked = data[tabIdString]?.inspectorMode ?? false;

  // Set the border settings
  borderSize.value = data.borderSize ?? 1;
  borderStyle.value = data.borderStyle ?? 'solid';

  // Apply changes to the active tab
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['scripts/border.js', 'scripts/overlay.js'],
  });
}

/** Toggles the border mode state and applies changes to the active tab. */
async function toggleBorderMode() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  if (!tab?.url || tab.url.startsWith('chrome://')) return;

  const tabId = tab.id;
  const tabIdString = tabId.toString();

  // Get state from storage
  const storedState = await chrome.storage.local.get(tabIdString);
  const isEnabled = storedState?.[tabIdString]?.borderMode ?? false;
  const newState = !isEnabled;

  // Update UI toggle
  toggleBorders.checked = newState;

  // Update storage with new state for the active tab
  await chrome.storage.local.set({
    [tabIdString]: { ...storedState[tabIdString], borderMode: newState },
  });

  // Send message to update extension state
  chrome.runtime.sendMessage({ action: 'UPDATE_ICON', isEnabled: newState });

  // Send message to update border mode
  chrome.tabs.sendMessage(tab.id, {
    action: 'UPDATE_BORDER_MODE',
    isEnabled: newState,
  });
}

/** Toggles the inspector mode state and applies changes to the active tab. */
async function toggleInspectorMode() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  if (!tab?.url || tab.url.startsWith('chrome://')) return;

  const tabId = tab.id;
  const tabIdString = tabId.toString();

  // Get state from storage
  const storedState = await chrome.storage.local.get(tabIdString);
  const isEnabled = storedState?.[tabIdString]?.inspectorMode ?? false;
  const newState = !isEnabled;

  // Update UI toggle
  toggleInspector.checked = newState;

  // Update storage with new state for the active tab
  await chrome.storage.local.set({
    [tabIdString]: { ...storedState[tabIdString], inspectorMode: newState },
  });

  // Send message to update inspector mode
  chrome.tabs.sendMessage(tab.id, {
    action: 'UPDATE_INSPECTOR_MODE',
    isEnabled: toggleInspector.checked,
  });
}

/** Updates the border settings and applies changes to the active tab. */
async function updateBorderSettings() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const tabId = tab.id;

  await chrome.storage.local.set({
    borderSize: borderSize.value,
    borderStyle: borderStyle.value,
  });

  // Send message to update border settings
  chrome.tabs.sendMessage(tab.id, {
    action: 'UPDATE_BORDER_SETTINGS',
    tabId: tabId,
    borderSize: borderSize.value,
    borderStyle: borderStyle.value,
  });
}

// Run initialization function when the popup loads
document.addEventListener('DOMContentLoaded', initializeStates);

// Event listeners for border settings changes
toggleBorders.addEventListener('click', toggleBorderMode);
toggleInspector.addEventListener('change', toggleInspectorMode);
borderSize.addEventListener('input', updateBorderSettings);
borderStyle.addEventListener('change', updateBorderSettings);
