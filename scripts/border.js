/**
 * Applies (or removes) an outline to all elements on the page.
 *
 * @param {boolean} isEnabled - Determines whether the outline should be applied.
 * If true, an outline is applied to each element; otherwise, no outline is applied.
 * @param {number} size - The size of the outline in pixels.
 * @param {string} style - The style of the outline (e.g., 'solid', 'dashed', etc.).
 */
async function applyOutline(isEnabled, size, style) {
  // Remove outline if extension is disabled
  if (!isEnabled) {
    document.querySelectorAll('*').forEach(element => {
      element.style.outline = 'none';
    });
    return;
  }

  // Get border size and style from storage if not provided
  if (!size || !style) {
    const data = await chrome.storage.local.get(['borderSize', 'borderStyle']);
    size = data.borderSize || 1;
    style = data.borderStyle || 'solid';
  }
  const defaultColor = 'red'; // Fallback color if tag not found

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
    // Ignore errors
    return;
  }

  const tabId = response.tabId;
  const data = await chrome.storage.local.get([
    `isBorderEnabled_${tabId}`,
    'borderSize',
    'borderStyle',
  ]);
  const { borderSize, borderStyle } = data;
  const isEnabled = data[`isBorderEnabled_${tabId}`];

  applyOutline(isEnabled, borderSize, borderStyle);
});

// Receive message to apply outline to all elements
chrome.runtime.onMessage.addListener(async request => {
  if (request.action === 'UPDATE_BORDER_SETTINGS') {
    let { borderSize, borderStyle, tabId } = request;
    const data = await chrome.storage.local.get(`isBorderEnabled_${tabId}`);
    const isEnabled = data[`isBorderEnabled_${tabId}`];

    applyOutline(isEnabled, borderSize, borderStyle);
  }
});
