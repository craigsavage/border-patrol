const toggleBorders = document.querySelector('#toggleBorders');
const toggleInspector = document.querySelector('#toggleInspector');
const borderSize = document.querySelector('#borderSize');
const borderStyle = document.querySelector('#borderStyle');

/** Initializes the toggle switch state and border settings from storage. */
async function initializeStates() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const tabId = tab.id;
  const data = await chrome.storage.local.get([
    `isEnabled_${tabId}`,
    'isInspectorModeEnabled',
    'borderSize',
    'borderStyle',
  ]);

  // Set the toggle switch state
  toggleBorders.checked = data[`isEnabled_${tabId}`] || false;
  toggleInspector.checked = data.isInspectorModeEnabled || false;

  // Set the border settings
  borderSize.value = data.borderSize || 1;
  borderStyle.value = data.borderStyle || 'solid';

  // Apply changes to the active tab
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['scripts/border.js', 'scripts/overlay.js'],
  });
}

/** Toggles the extension state and applies changes to the active tab. */
async function toggleExtension() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const tabId = tab.id;
  const data = await chrome.storage.local.get(`isEnabled_${tabId}`);
  const isEnabled = data[`isEnabled_${tabId}`] || false;
  const newState = !isEnabled;

  // Update storage with new state for the active tab
  await chrome.storage.local.set({ [`isEnabled_${tabId}`]: newState });

  // Update UI toggle
  toggleBorders.checked = newState;

  // Send message to update extension icon
  chrome.runtime.sendMessage({ action: 'UPDATE_ICON', isEnabled: newState });

  // Apply changes to the active tab
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['scripts/border.js'],
  });
}

/** Toggles the inspector mode state and applies changes to the active tab. */
async function toggleInspectorMode() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (!tab?.url || tab.url.startsWith('chrome://')) return;

  // Update storage with new state for the active tab
  await chrome.storage.local.set({
    isInspectorModeEnabled: toggleInspector.checked,
  });

  // Send message to update inspector mode
  chrome.tabs.sendMessage(tab.id, {
    action: 'UPDATE_INSPECTOR_MODE',
    isEnabled: toggleInspector.checked,
  });
}

/** Updates the border settings in storage. */
async function updateSettings() {
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
toggleBorders.addEventListener('click', toggleExtension);
toggleInspector.addEventListener('change', toggleInspectorMode);
borderSize.addEventListener('input', updateSettings);
borderStyle.addEventListener('change', updateSettings);
