// Defaults to disabled after installation
chrome.runtime.onInstalled.addListener(details => {
  chrome.storage.local.set({}); // Clears any previous state
  updateExtensionState(false);
});

// Load extension state
chrome.tabs.onActivated.addListener(async activeInfo => {
  const tabId = activeInfo.tabId;
  const data = await getData(tabId);
  const isEnabled = data[`isEnabled_${tabId}`] || false;
  updateExtensionState(isEnabled);
  console.log('Tab clicked:', activeInfo.tabId);
  console.log('State:', isEnabled);
  console.log('Active Info:', activeInfo, 'Action:', chrome.action);
});

// Handle extension icon click
chrome.action.onClicked.addListener(async tab => {
  const tabId = tab.id;
  const data = await getData(tabId);
  const isEnabled = data[`isEnabled_${tabId}`] || false;
  const newState = !isEnabled;
  console.log('Toggling border state for tab:', tab.id, 'to:', newState);

  // Store the new state using tab ID as the key
  chrome.storage.local.set({ [`isEnabled_${tab.id}`]: newState });
  updateExtensionState(newState);

  // Execute script
  await chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      files: ['scripts/border.js'],
    })
    .catch(error => console.error('Error executing script:', error));
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabId') {
    sendResponse({ tabId: sender.tab?.id });
  }
});

function updateExtensionState(isEnabled) {
  chrome.action.setBadgeText({ text: isEnabled ? 'ON' : 'OFF' });
  chrome.action.setIcon({
    path: isEnabled ? 'icons/bp-icon-16.png' : 'icons/bp-icon-disabled-16.png',
  });
  chrome.action.setTitle({
    title: isEnabled ? 'Disable Border Patrol' : 'Enable Border Patrol',
  });
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  console.log('Current tab:', tab);
  return tab;
}

async function getData(tabId) {
  if (!tabId) {
    const tab = await getCurrentTab();
    tabId = tab.id;
  }
  const data = await chrome.storage.local.get(`isEnabled_${tabId}`);
  return data;
}
