/**
 * Applies (or removes) an outline to all elements on the page.
 *
 * @param {boolean} isEnabled - Determines whether the outline should be applied.
 * If true, an outline is applied to each element; otherwise, no outline is applied.
 */
async function applyOutline(isEnabled) {
  // Remove outline if extension is disabled
  if (!isEnabled) {
    document.querySelectorAll('*').forEach(element => {
      element.style.outline = 'none';
    });
    return;
  }

  const defaultColor = 'red'; // Fallback color if tag not found
  const data = await chrome.storage.local.get([
    'borderThickness',
    'borderStyle',
  ]);
  const size = data.borderThickness || 1;
  const style = data.borderStyle || 'solid';

  // Define element groups with their tags and colors
  const elementGroups = {
    containers: {
      tags: ['div', 'section', 'article', 'header', 'footer', 'main'],
      color: 'blue',
    },
    tables: {
      tags: ['table', 'tr', 'td', 'th'],
      color: 'skyblue',
    },
    text: {
      tags: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'],
      color: 'green',
    },
    media: {
      tags: ['img', 'picture', 'audio', 'video'],
      color: 'purple',
    },
    interactive: {
      tags: ['a', 'form', 'input', 'textarea', 'select', 'button'],
      color: 'orange',
    },
  };

  // Apply outline to all elements
  document.querySelectorAll('*').forEach(element => {
    const tag = element.tagName.toLowerCase();
    let color = defaultColor;

    // Determine element's group and apply corresponding color
    for (const { tags, color: groupColor } of Object.values(elementGroups)) {
      if (tags.includes(tag)) {
        color = groupColor;
        break; // Stop searching once a match is found
      }
    }

    element.style.outline = `${size}px ${style} ${color}`;
  });
}

/**
 * Retrieves the tab ID and applies an outline to all elements on the page
 * if the extension is enabled, otherwise removes the outline.
 */
chrome.runtime.sendMessage({ action: 'GET_TAB_ID' }, async response => {
  if (chrome.runtime.lastError) {
    console.error('Error getting tab ID:', chrome.runtime.lastError);
    return;
  }

  const tabId = response.tabId;
  const data = await chrome.storage.local.get(`isEnabled_${tabId}`);
  const isEnabled = data[`isEnabled_${tabId}`];
  applyOutline(isEnabled);
});

// Receive message to apply outline to all elements
chrome.runtime.onMessage.addListener(async request => {
  if (request.action === 'APPLY_OUTLINE') {
    chrome.runtime.sendMessage({ action: 'GET_TAB_ID' }, async response => {
      if (chrome.runtime.lastError) {
        console.error('Error getting tab ID:', chrome.runtime.lastError);
        return;
      }

      const tabId = response.tabId;
      const data = await chrome.storage.local.get(`isEnabled_${tabId}`);
      const isEnabled = data[`isEnabled_${tabId}`];
      applyOutline(isEnabled);
    });
  }
});
