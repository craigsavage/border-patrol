const borderThickness = document.querySelector('#borderThickness');
const borderStyle = document.querySelector('#borderStyle');
const toggleBorders = document.querySelector('#toggleBorders');

/** Initializes the toggle switch state and border settings from storage. */
async function initializeStates() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const tabId = tab.id;
  const data = await chrome.storage.local.get([
    `isEnabled_${tabId}`,
    'borderThickness',
    'borderStyle',
  ]);
  const isEnabled = data[`isEnabled_${tabId}`] || false;

  // Set the toggle switch state
  toggleBorders.checked = isEnabled;

  // Set the border settings
  borderThickness.value = data.borderThickness || 1;
  borderStyle.value = data.borderStyle || 'solid';
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

/** Updates the border settings in storage. */
async function updateSettings() {
  await chrome.storage.local.set({
    borderThickness: borderThickness.value,
    borderStyle: borderStyle.value,
  });

  chrome.runtime.sendMessage({ action: 'APPLY_OUTLINE' });
}

// Run initialization function when the popup loads
document.addEventListener('DOMContentLoaded', initializeStates);

// Event listeners for border settings changes
borderThickness.addEventListener('input', updateSettings);
borderStyle.addEventListener('change', updateSettings);
toggleBorders.addEventListener('click', toggleExtension);
