import { Logger } from './helpers';

(function () {
  let isInspectorModeEnabled = false; // Cache the inspector mode state
  let throttleTimeout = null;

  // DOM elements
  let overlayContainer = null;
  let overlay = null;
  let highlight = null;

  const THROTTLE_DELAY = 16; // Delay in milliseconds (16ms = 60fps)
  const MAX_CLASS_DISPLAY_LENGTH = 50; // Maximum length of class names to display
  const OVERLAY_MARGIN = 10; // Margin from cursor position to overlay position

  /**
   * Handles the inspector mode update
   * If enabled, it initializes the overlay DOM elements and adds event listeners.
   * If disabled, it removes the event listeners and cleans up the DOM elements.
   *
   * @param {boolean} isEnabled - The state of the inspector mode
   */
  function handleInspectorModeUpdate(isEnabled) {
    Logger.info('Overlay received UPDATE_INSPECTOR_MODE:', isEnabled);

    isInspectorModeEnabled = isEnabled; // Update the inspector mode state cache

    if (isInspectorModeEnabled) {
      // Initialize the overlay DOM elements and add event listeners
      initializeOverlayDOM();
      addEventListeners();
    } else {
      // Remove event listeners and clean up the DOM elements when disabled
      removeEventListeners();
      removeElements();
    }
  }

  /** Initializes the DOM elements if they are not already initialized */
  function initializeOverlayDOM() {
    // Check if overlay is already initialized
    if (document.getElementById('bp-inspector-container')) {
      overlayContainer = document.getElementById('bp-inspector-container');
      overlay = document.getElementById('bp-inspector-overlay');
      highlight = document.getElementById('bp-element-highlight');
      return;
    }

    // Initialize DOM elements
    overlayContainer = createAndAppend('bp-inspector-container', document.body);
    overlay = createAndAppend('bp-inspector-overlay', overlayContainer);
    highlight = createAndAppend('bp-element-highlight', overlayContainer);

    // Ensure they are hidden initially
    if (overlay) overlay.style.display = 'none';
    if (highlight) highlight.style.display = 'none';
  }

  /** Adds event listeners */
  function addEventListeners() {
    // Check if overlay is already initialized
    if (!overlayContainer || !overlay || !highlight) {
      Logger.error('Overlay elements not initialized.');
      return;
    }

    // Add event listeners to the document
    document.addEventListener('mouseover', mouseOverHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseout', mouseOutHandler);
  }

  /**
   * Creates and appends an element to a parent element
   *
   * @param {string} id - The id of the element
   * @param {Object} parent - The parent element
   * @returns {Object} The created element
   */
  function createAndAppend(id, parent) {
    if (!id || !parent) return null;
    const element = document.createElement('div');
    element.id = id;
    parent.appendChild(element);
    return element;
  }

  /**
   * Calculates the position of the overlay relative to the cursor and prevents it from going off-screen
   *
   * @param {Event} event - The triggered event
   * @param {HTMLElement} overlayElement - The overlay dom element
   * @returns {Object} The position of the overlay
   */
  function getOverlayPosition(event, overlayElement) {
    if (!overlayElement) return { top: 0, left: 0 }; // Default values

    const overlayRect = overlayElement.getBoundingClientRect();

    // Calculate position of the overlay relative to the cursor
    let posX = event.clientX + OVERLAY_MARGIN;
    let posY = event.clientY + OVERLAY_MARGIN;

    // Flip left if overlay goes beyond right edge
    if (posX + overlayRect.width > window.innerWidth) {
      posX = event.clientX - overlayRect.width - OVERLAY_MARGIN;
    }

    // Flip up if overlay goes beyond bottom edge
    if (posY + overlayRect.height > window.innerHeight) {
      posY = event.clientY - overlayRect.height - OVERLAY_MARGIN;
    }

    return {
      top: posY,
      left: posX,
    };
  }

  /**
   * Gets the formatted border information from the computed style
   *
   * @param {CSSStyleDeclaration} computedStyle - The computed style of the element
   * @returns {string} The formatted border information (width style color) or an empty string if no border is present
   */
  function getFormattedBorderInfo(computedStyle) {
    // Extract border information from computed style
    const borderWidth = computedStyle.borderWidth || '0px';
    const borderStyle = computedStyle.borderStyle || 'none';
    const borderColor = computedStyle.borderColor || 'transparent';

    // Return empty string if any of the border properties indicate no border
    if (
      borderWidth === '0px' ||
      borderStyle === 'none' ||
      borderColor === 'transparent'
    ) {
      return '';
    }

    // Format the border information
    return `${borderWidth} ${borderStyle} ${borderColor}`;
  }

  /**
   * Displays the overlay on mouseover
   *
   * @param {Event} event - The triggered event
   */
  function mouseOverHandler(event) {
    // Check if inspector mode is enabled
    if (!isInspectorModeEnabled || !overlay || !highlight || !overlayContainer)
      return;

    const element = event.target;
    // Avoid targeting the overlay or highlight elements
    if (
      !element ||
      element === overlay ||
      element === highlight ||
      overlayContainer.contains(element)
    ) {
      // Hide overlay/highlight if hovered over our own elements
      mouseOutHandler();
      return;
    }

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    if (!rect || !computedStyle) return;

    // Get the formatted border information
    const borderInfo = getFormattedBorderInfo(computedStyle);

    // Get element ID and classes
    const elementId = element.id ? `#${element.id}` : '';
    const elementClasses = getElementClassNames(element);

    // Update the overlay content with the element details
    overlay.innerHTML = `
      <div class="bp-element-info">
        <strong>${element.tagName.toLowerCase()}</strong> <span class="bp-id-value">
          ${elementId}
        </span><br>
        ${
          elementClasses
            ? `<span class="bp-info-label">Classes:</span> ${elementClasses}<br>`
            : ''
        }
        <span class="bp-info-label">Dimensions:</span> ${Math.round(
          rect.width
        )} x ${Math.round(rect.height)} px<br>
        <span class="bp-info-label">Display:</span> ${computedStyle.display}<br>
        ${
          borderInfo
            ? `<span class="bp-info-label">Border:</span> ${borderInfo}<br>`
            : ''
        }
        ${
          computedStyle.margin
            ? `<span class="bp-info-label">Margin:</span> ${computedStyle.margin}<br>`
            : ''
        }
        ${
          computedStyle.padding
            ? `<span class="bp-info-label">Padding:</span> ${computedStyle.padding}`
            : ''
        }
      </div>
      <footer class="bp-branding-info">
        <span class="bp-branding">Border Patrol</span>
      </footer>
    `;

    // Set display to block before getOverlayPosition
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'none'; // Ensure overlay doesn't block clicks

    updateOverlayPosition(event);

    // Display the highlight
    requestAnimationFrame(() => {
      if (!highlight) return; // Highlight may have been removed

      try {
        // Set position and size of the highlight
        highlight.style.top = `${rect.top}px`;
        highlight.style.left = `${rect.left}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;

        highlight.style.display = 'block';
        highlight.style.pointerEvents = 'none'; // Ensure highlight doesn't block clicks
      } catch (error) {
        Logger.error('Error displaying highlight:', error);
      }
    });
  }

  /**
   * Retrieves and formats the class names of an element.
   * Truncates the list if it exceeds the maximum display length.
   *
   * @param {HTMLElement} element - The DOM element whose class names are to be retrieved.
   * @returns {string} A formatted string of class names.
   */
  function getElementClassNames(element) {
    const classAttribute = element.getAttribute('class');
    // Handle cases where class attribute is null or not a string
    if (!classAttribute || typeof classAttribute !== 'string') return '';

    // Split class names by whitespace and filter out empty strings
    const classNames = classAttribute.split(/\s+/).filter(Boolean);
    let elementClasses = '';
    if (classNames.length > 0) {
      elementClasses = `.${classNames.join(' .')}`;
      if (elementClasses.length > MAX_CLASS_DISPLAY_LENGTH) {
        elementClasses =
          elementClasses.substring(0, MAX_CLASS_DISPLAY_LENGTH - 3) + '...';
      }
    }
    return elementClasses;
  }

  /**
   * Updates the position of the overlay
   *
   * @param {Event} event - The triggered event
   */
  function updateOverlayPosition(event) {
    if (!overlay || !isInspectorModeEnabled) return;

    // Calculate position of the overlay
    const { top, left } = getOverlayPosition(event, overlay);

    // Display the overlay
    requestAnimationFrame(() => {
      if (!overlay) return; // Overlay may have been removed

      try {
        // Set position of the overlay
        overlay.style.top = `${top}px`;
        overlay.style.left = `${left}px`;
      } catch (error) {
        Logger.error('Error updating overlay position:', error);
      }
    });
  }

  /**
   * Updates the position of the overlay on mousemove
   *
   * @param {Event} event - The triggered event
   */
  function mouseMoveHandler(event) {
    if (!isInspectorModeEnabled) return;

    try {
      // Throttle the overlay position update
      if (throttleTimeout === null) {
        throttleTimeout = setTimeout(() => {
          updateOverlayPosition(event);
          throttleTimeout = null;
        }, THROTTLE_DELAY);
      }
    } catch (error) {
      Logger.error('Error updating overlay position:', error);
    }
  }

  /** Hides the overlay and highlight when the mouse leaves the element */
  function mouseOutHandler() {
    if (overlay) overlay.style.display = 'none';
    if (highlight) highlight.style.display = 'none';
  }

  /** Removes all overlay elements from the DOM and resets related variables to null */
  function removeElements() {
    // Remove the overlay container from the DOM if it exists
    overlayContainer?.remove();

    // Reset DOM element variables to null
    overlayContainer = null;
    overlay = null;
    highlight = null;
  }

  /** Removes event listeners */
  function removeEventListeners() {
    try {
      document.removeEventListener('mouseover', mouseOverHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseout', mouseOutHandler);
    } catch (error) {
      Logger.error('Error removing event listeners:', error);
    }
  }

  // Recieve message to update inspector mode
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    Logger.info('Received message:', request);

    try {
      // Check if the message is to update inspector mode
      if (request.action === 'UPDATE_INSPECTOR_MODE') {
        handleInspectorModeUpdate(request.isEnabled);
      }
      // Respond to PING message if needed (used by background to check injection)
      else if (request.action === 'PING') {
        sendResponse({ status: 'PONG' });
        return true; // Indicate async response
      } else {
        // Ignore any other messages
        return false;
      }
    } catch (error) {
      Logger.error(`Error handling message:`, error);
      return false; // An error occurred
    }
  });
})();
