const borderThickness = document.querySelector('#borderThickness');
const borderStyle = document.querySelector('#borderStyle');
const toggleBorders = document.querySelector('#toggleBorders');

// Load existing border settings from storage
chrome.storage.local.get(['borderThickness', 'borderStyle'], data => {
  borderThickness.value = data.borderThickness || 1;
  borderStyle.value = data.borderStyle || 'solid';
});

// Get active tab and toggle its state
async function toggleExtension() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const tabId = tab.id;
  chrome.storage.local.get(`isEnabled_${tabId}`, async data => {
    const isEnabled = data[`isEnabled_${tabId}`] || false;
    const newState = !isEnabled;

    // Set the new enable state and send a message to update the icon state
    await chrome.storage.local.set({ [`isEnabled_${tabId}`]: newState }, () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_ICON',
        isEnabled: newState,
      });
    });

    // Update UI
    toggleBorders.checked = newState;

    // Apply changes to the active tab
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/border.js'],
    });
  });
}

/** Updates the border settings in storage. */
function updateSettings() {
  chrome.storage.local.set(
    {
      borderThickness: borderThickness.value,
      borderStyle: borderStyle.value,
    },
    () => {
      chrome.runtime.sendMessage({ action: 'APPLY_OUTLINE' });
    }
  );
}

// Event listeners for border settings changes
borderThickness.addEventListener('input', updateSettings);
borderStyle.addEventListener('change', updateSettings);
toggleBorders.addEventListener('click', toggleExtension);
