import { getElementClassNames } from './helpers';
import Logger from './utils/logger';
import { toSentenceCase } from './utils/string-utils';

(function () {
  let isInspectorModeEnabled = false; // Cache the inspector mode state
  let throttleTimeout = null;

  // Variables for overlay DOM elements
  let overlayContainer = null;
  let overlay = null;
  let marginBox = null;
  let borderBox = null;
  let paddingBox = null;
  let contentBox = null;

  const THROTTLE_DELAY = 16; // Delay in milliseconds (16ms = 60fps)
  const MAX_CLASS_DISPLAY_LENGTH = 50; // Maximum length of class names to display
  const OVERLAY_MARGIN = 10; // Margin from cursor position to overlay position

  // Colors for box model visualization
  const MARGIN_COLOR = 'rgba(255, 165, 0, 0.3)'; // Orange with transparency
  const BORDER_COLOR = 'rgba(255, 255, 0, 0.3)'; // Yellow with transparency
  const PADDING_COLOR = 'rgba(0, 128, 0, 0.3)'; // Green with transparency
  const CONTENT_COLOR = 'rgba(0, 0, 255, 0.3)'; // Blue with transparency

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
      marginBox = document.getElementById('bp-margin-box');
      borderBox = document.getElementById('bp-border-box');
      paddingBox = document.getElementById('bp-padding-box');
      contentBox = document.getElementById('bp-content-box');
      return;
    }

    // Initialize DOM elements
    overlayContainer = createAndAppend({
      id: 'bp-inspector-container',
      parent: document.body,
    });
    overlay = createAndAppend({
      id: 'bp-inspector-overlay',
      parent: overlayContainer,
    });

    // Create box model elements
    marginBox = createAndAppend({
      id: 'bp-margin-box',
      parent: overlayContainer,
    });
    borderBox = createAndAppend({
      id: 'bp-border-box',
      parent: overlayContainer,
    });
    paddingBox = createAndAppend({
      id: 'bp-padding-box',
      parent: overlayContainer,
    });
    contentBox = createAndAppend({
      id: 'bp-content-box',
      parent: overlayContainer,
    });

    // Ensure all elements are hidden initially
    [overlay, marginBox, borderBox, paddingBox, contentBox].forEach(element => {
      if (element) element.style.display = 'none';
    });
  }

  /** Adds event listeners */
  function addEventListeners() {
    // Check if overlay is already initialized
    if (
      !overlayContainer ||
      !overlay ||
      !marginBox ||
      !borderBox ||
      !paddingBox ||
      !contentBox
    ) {
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
   * @param {Object} options - The options object
   * @param {string} options.id - The id of the element
   * @param {HTMLElement} options.parent - The parent element to append to
   * @param {string} [options.tagName='div'] - The tag name of the element
   * @param {string} [options.classNames=''] - The class names of the element
   * @returns {HTMLElement|null} The created element or null if required params are missing
   */
  function createAndAppend({ id, parent, tagName = 'div', classNames = '' }) {
    if (!id || !parent || !tagName) return null;
    const element = document.createElement(tagName);
    element.id = id;
    element.className = classNames;
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
    const borders = {
      top: {
        width: computedStyle.borderTopWidth,
        style: computedStyle.borderTopStyle,
        color: computedStyle.borderTopColor,
      },
      right: {
        width: computedStyle.borderRightWidth,
        style: computedStyle.borderRightStyle,
        color: computedStyle.borderRightColor,
      },
      bottom: {
        width: computedStyle.borderBottomWidth,
        style: computedStyle.borderBottomStyle,
        color: computedStyle.borderBottomColor,
      },
      left: {
        width: computedStyle.borderLeftWidth,
        style: computedStyle.borderLeftStyle,
        color: computedStyle.borderLeftColor,
      },
    };

    // Check if all borders are zero width, none style, or transparent color
    const allBordersZero = Object.values(borders).every(border => {
      return (
        border.width === '0px' ||
        border.style === 'none' ||
        border.color === 'transparent'
      );
    });

    if (allBordersZero) return '';

    // Check if all borders have the same width, style, and color
    const allBordersSame = Object.values(borders).every(border => {
      return (
        border.width === borders.top.width &&
        border.style === borders.top.style &&
        border.color === borders.top.color
      );
    });

    // Return the top border information if all borders are the same
    if (allBordersSame) {
      return `${borders.top.width} ${borders.top.style} ${borders.top.color}`;
    }
    // If borders are not the same, return a formatted string for each border
    return (
      '<br>' +
      Object.entries(borders)
        .map(([side, border]) => {
          // Skip if border is zero width, none style, or transparent color
          if (
            border.width === '0px' ||
            border.style === 'none' ||
            border.color === 'transparent'
          ) {
            return '';
          }
          // Format the border information for each side
          return `${toSentenceCase(side)}: ${border.width} ${border.style} ${
            border.color
          }`;
        })
        .filter(info => info) // Filter out empty strings
        .join('<br>')
    );
  }

  /**
   * Retrieves the numeric value of a CSS property in pixels
   *
   * @param {string} prop - The CSS property
   * @param {CSSStyleDeclaration} computedStyle - The computed style of the element
   * @returns {number} The numeric value in pixels, or 0 if not a number
   */
  function getPxValue(prop, computedStyle) {
    return parseFloat(computedStyle.getPropertyValue(prop)) || 0;
  }

  /**
   * Displays the overlay on mouseover
   *
   * @param {Event} event - The triggered event
   */
  function mouseOverHandler(event) {
    // Check if inspector mode is enabled
    if (
      !isInspectorModeEnabled ||
      !overlay ||
      !marginBox ||
      !borderBox ||
      !paddingBox ||
      !contentBox ||
      !overlayContainer
    ) {
      return;
    }

    const element = event.target;
    // Skip if hovered over the overlay
    if (!element || overlayContainer.contains(element)) {
      mouseOutHandler();
      return;
    }

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    if (!rect || !computedStyle) {
      mouseOutHandler();
      return;
    }

    // Parse all box model values
    const marginTop = getPxValue('margin-top', computedStyle);
    const marginRight = getPxValue('margin-right', computedStyle);
    const marginBottom = getPxValue('margin-bottom', computedStyle);
    const marginLeft = getPxValue('margin-left', computedStyle);

    const borderTopWidth = getPxValue('border-top-width', computedStyle);
    const borderRightWidth = getPxValue('border-right-width', computedStyle);
    const borderBottomWidth = getPxValue('border-bottom-width', computedStyle);
    const borderLeftWidth = getPxValue('border-left-width', computedStyle);

    const paddingTop = getPxValue('padding-top', computedStyle);
    const paddingRight = getPxValue('padding-right', computedStyle);
    const paddingBottom = getPxValue('padding-bottom', computedStyle);
    const paddingLeft = getPxValue('padding-left', computedStyle);

    // Get the formatted border information
    const borderInfo = getFormattedBorderInfo(computedStyle);

    // Get element ID and classes
    const elementId = element.id ? `#${element.id}` : '';
    const elementClasses = getElementClassNames(
      element,
      MAX_CLASS_DISPLAY_LENGTH
    );

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

    updateOverlayPosition(event);

    // Render the box model overlay elements
    requestAnimationFrame(() => {
      // The elements may have been removed or not initialized
      if (!overlay || !marginBox || !borderBox || !paddingBox || !contentBox) {
        Logger.error('Overlay elements not initialized.');
        return;
      }

      try {
        // Margin Box
        marginBox.style.top = `${rect.top - marginTop}px`;
        marginBox.style.left = `${rect.left - marginLeft}px`;
        marginBox.style.width = `${rect.width + marginLeft + marginRight}px`;
        marginBox.style.height = `${rect.height + marginTop + marginBottom}px`;
        marginBox.style.backgroundColor = MARGIN_COLOR;
        marginBox.style.display = 'block';

        // Border Box (element's getBoundingClientRect() directly represents this)
        borderBox.style.top = `${rect.top}px`;
        borderBox.style.left = `${rect.left}px`;
        borderBox.style.width = `${rect.width}px`;
        borderBox.style.height = `${rect.height}px`;
        borderBox.style.backgroundColor = BORDER_COLOR;
        borderBox.style.display = 'block';

        // Padding Box
        paddingBox.style.top = `${rect.top + borderTopWidth}px`;
        paddingBox.style.left = `${rect.left + borderLeftWidth}px`;
        paddingBox.style.width = `${
          rect.width - borderLeftWidth - borderRightWidth
        }px`;
        paddingBox.style.height = `${
          rect.height - borderTopWidth - borderBottomWidth
        }px`;
        paddingBox.style.backgroundColor = PADDING_COLOR;
        paddingBox.style.display = 'block';

        // Content Box
        contentBox.style.top = `${rect.top + borderTopWidth + paddingTop}px`;
        contentBox.style.left = `${
          rect.left + borderLeftWidth + paddingLeft
        }px`;
        contentBox.style.width = `${
          rect.width -
          borderLeftWidth -
          borderRightWidth -
          paddingLeft -
          paddingRight
        }px`;
        contentBox.style.height = `${
          rect.height -
          borderTopWidth -
          borderBottomWidth -
          paddingTop -
          paddingBottom
        }px`;
        contentBox.style.backgroundColor = CONTENT_COLOR;
        contentBox.style.display = 'block';
      } catch (error) {
        Logger.error('Error rendering box model:', error);
      }
    });
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

  /** Hides the overlay and box model elements on mouseout */
  function mouseOutHandler() {
    if (overlay) overlay.style.display = 'none';
    if (marginBox) marginBox.style.display = 'none';
    if (borderBox) borderBox.style.display = 'none';
    if (paddingBox) paddingBox.style.display = 'none';
    if (contentBox) contentBox.style.display = 'none';
  }

  /** Removes all overlay elements from the DOM and resets related variables to null */
  function removeElements() {
    // Remove the overlay container from the DOM if it exists
    overlayContainer?.remove();

    // Reset DOM element variables to null
    overlayContainer = null;
    overlay = null;
    marginBox = null;
    borderBox = null;
    paddingBox = null;
    contentBox = null;
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
