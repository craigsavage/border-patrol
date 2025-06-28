import Logger from './utils/logger';

(function () {
  // Cache the border mode state and border settings
  let isBorderModeEnabled = false;
  let currentBorderSettings = { size: 1, style: 'solid' };

  // Get the Border Patrol Inspector container
  let bpInspectorContainer = document.querySelector('#bp-inspector-container');

  let observer = null; // Declare the MutationObserver instance

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

  // Default color for elements not in any group
  const defaultColor = 'red';

  /**
   * Checks if an element is part of the Border Patrol Inspector UI.
   *
   * @param {Element} element - The element to check.
   * @returns {boolean} - True if the element is part of the Inspector UI, false otherwise.
   */
  function isInspectorUIElement(element) {
    return bpInspectorContainer?.contains(element);
  }

  /**
   * Applies an outline to a given element based on its group and specified size and style.
   *
   * @param {Element} element - The DOM element to apply the outline to.
   * @param {number} size - The size of the outline in pixels.
   * @param {string} style - The style of the outline (e.g., 'solid', 'dashed', etc.).
   */
  function applyOutlineToElement(element, size, style) {
    // Exclude applying outlines to Border Patrol elements
    if (isInspectorUIElement(element)) return;

    const tag = element.tagName.toLowerCase();
    let color = defaultColor;

    // Determine element's group and apply corresponding color
    for (const { tags, color: groupColor } of Object.values(elementGroups)) {
      if (tags.includes(tag)) {
        color = groupColor;
        break; // Stop searching once a match is found
      }
    }

    // Apply the outline style to the element
    element.style.outline = `${size}px ${style} ${color}`;
  }

  /**
   * Manages applying or removing extension-specific outlines to elements.
   *
   * @param {boolean} isEnabled - Determines whether the outline should be applied.
   * @param {number} size - The size of the outline in pixels.
   * @param {string} style - The style of the outline (e.g., 'solid', 'dashed', etc.).
   */
  async function manageElementOutlines(isEnabled, size, style) {
    Logger.info(
      `Managing element outlines: isEnabled=${isEnabled}, size=${size}, style=${style}`
    );

    // Remove outline if extension is disabled
    if (!isEnabled) {
      document.querySelectorAll('*').forEach(element => {
        // Skip Border Patrol Inspector UI elements
        if (isInspectorUIElement(element)) return;

        // Remove outline from all elements
        element.style.outline = 'none';
      });
      return;
    }

    // Update the Border Patrol Inspector container reference
    bpInspectorContainer = document.querySelector('#bp-inspector-container');

    // Apply outline to all elements in the document
    document.querySelectorAll('*').forEach(element => {
      applyOutlineToElement(element, size, style);
    });
  }

  // Receive message to apply outline to all elements
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      Logger.info('Received message to apply outline:', request);

      // Receive message to update border mode
      if (request.action === 'UPDATE_BORDER_MODE') {
        // Get new border mode from request
        isBorderModeEnabled = request.isEnabled;
        // Apply/remove outline based on the new mode and current settings
        manageElementOutlines(
          isBorderModeEnabled,
          currentBorderSettings.size,
          currentBorderSettings.style
        );
      }
      // Receive message to update border settings
      if (request.action === 'UPDATE_BORDER_SETTINGS') {
        // Get new border settings from request
        currentBorderSettings.size = request.borderSize;
        currentBorderSettings.style = request.borderStyle;
        // Apply/remove outline based on the current mode and new settings
        manageElementOutlines(
          isBorderModeEnabled,
          currentBorderSettings.size,
          currentBorderSettings.style
        );
      }
      // Respond to PING message if needed (used by background to check injection)
      if (request.action === 'PING') {
        sendResponse({ status: 'PONG' });
        return true; // Indicate async response
      }
    }
  );
})();
