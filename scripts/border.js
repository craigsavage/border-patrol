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

  applyOutline(isEnabled);
});

/**
 * Applies an outline to all elements on the page.
 *
 * @param {boolean} isEnabled - Determines whether the outline should be applied.
 * If true, an outline is applied to each element; otherwise, no outline is applied.
 * @param {number} size - The width of the outline in pixels.
 */
function applyOutline(isEnabled, size = 1) {
  const defaultColor = 'red'; // Fallback color if tag not found

  // Define element groups and their corresponding tags
  const elementGroups = {
    containers: ['div', 'section', 'article', 'header', 'footer', 'main'],
    tables: ['table', 'tr', 'td', 'th'],
    text: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'],
    media: ['img', 'picture', 'audio', 'video'],
    interactive: ['a', 'form', 'input', 'textarea', 'select', 'button'],
  };

  // Define colors for each element group
  const colors = {
    containers: 'blue',
    tables: 'skyblue',
    text: 'green',
    media: 'purple',
    interactive: 'orange',
  };

  document.querySelectorAll('*').forEach(element => {
    const tag = element.tagName.toLowerCase();
    let color = defaultColor;

    for (const [group, tags] of Object.entries(elementGroups)) {
      if (tags.includes(tag)) {
        color = colors[group];
        break;
      }
    }

    element.style.outline = isEnabled ? `${size}px solid ${color}` : 'none';
  });
}
