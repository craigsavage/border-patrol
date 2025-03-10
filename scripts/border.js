// Get the tab ID first
chrome.runtime.sendMessage({ action: 'getTabId' }, async response => {
  if (chrome.runtime.lastError) {
    console.error('Error getting tab ID:', chrome.runtime.lastError);
    return;
  }

  const tabId = response.tabId;
  console.log('Tab ID:', tabId);

  // Get the extension state
  const data = await chrome.storage.local.get(`isEnabled_${tabId}`);
  const isEnabled = data[`isEnabled_${tabId}`];

  // Apply the outline to all elements if the extension is enabled
  document.querySelectorAll('*').forEach(element => {
    element.style.outline = isEnabled ? '1px solid red' : 'none';
  });
});
