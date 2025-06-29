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
    if (!bpInspectorContainer) return false;
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
   * Handles mutations in the DOM to apply or update outlines on elements.
   * This function is triggered whenever there are changes to the DOM, such as
   * added nodes or attribute changes, and applies the appropriate outlines.
   *
   * @param {MutationRecord[]} mutations - Array of mutations observed in the DOM.
   */
  function handleMutations(mutations) {
    if (!isBorderModeEnabled) return; // Skip if border mode is not enabled
    Logger.debug('Handling DOM mutations for border updates.');

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Iterate over newly added nodes
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip Border Patrol Inspector UI elements
            if (isInspectorUIElement(node)) return;

            // Apply outline to the newly added node
            applyOutlineToElement(
              node,
              currentBorderSettings.size,
              currentBorderSettings.style
            );

            // Apply outline to all child elements of the newly added node
            node.querySelectorAll('*').forEach(child => {
              // Skip Border Patrol Inspector UI elements
              if (isInspectorUIElement(child)) return;

              applyOutlineToElement(
                child,
                currentBorderSettings.size,
                currentBorderSettings.style
              );
            });
          }
        });
      } else if (mutation.type === 'attributes') {
        // Handle attribute changes (e.g., class changes)
        if (mutation.target.nodeType === Node.ELEMENT_NODE) {
          if (isInspectorUIElement(mutation.target)) return;
          applyOutlineToElement(
            mutation.target,
            currentBorderSettings.size,
            currentBorderSettings.style
          );

          // Also apply outline to all child elements of the mutated target
          mutation.target.querySelectorAll('*').forEach(child => {
            if (isInspectorUIElement(child)) return;
            applyOutlineToElement(
              child,
              currentBorderSettings.size,
              currentBorderSettings.style
            );
          });
        }
      }
    });
  }

  /**
   * Starts observing the DOM for changes to apply or remove outlines dynamically.
   * This function sets up a MutationObserver to watch for changes in the document body.
   * It listens for child additions/removals and attribute changes to apply outlines
   * to newly added elements or those that change their attributes.
   */
  function startObservingDOM() {
    if (!observer) {
      observer = new MutationObserver(handleMutations);
    }
    // Disconnect any existing observation before starting a new one
    observer.disconnect();

    Logger.info('Starting DOM observation for border updates.');
    // Start observing the document body for childList changes and subtree modifications
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /** Stops observing the DOM for border updates. */
  function stopObservingDOM() {
    if (observer) {
      Logger.info('Stopping DOM observation for border updates.');
      observer.disconnect();
    }
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
      Logger.info('Borders are disabled. Removing outlines from all elements.');
      stopObservingDOM(); // Stop observing the DOM to prevent unnecessary updates
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

    // Start observing for new elements only if borders are enabled
    startObservingDOM();
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
