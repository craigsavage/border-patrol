import Logger from './utils/logger';
import { getPxValue, getElementClassNames } from './utils/dom-helpers';
import {
  formatDimensions,
  formatColorValue,
  formatBoxModelValues,
  formatBorderInfo,
  formatFontStack,
} from './utils/overlay-formatters';

(function () {
  let isInspectorModeEnabled: boolean = false; // Cache the inspector mode state
  let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

  // Variables for overlay DOM elements
  let overlayContainer: HTMLElement | null = null;
  let overlay: HTMLElement | null = null;
  let marginBox: HTMLElement | null = null;
  let borderBox: HTMLElement | null = null;
  let paddingBox: HTMLElement | null = null;
  let contentBox: HTMLElement | null = null;

  const THROTTLE_DELAY = 16; // Delay in milliseconds (16ms = 60fps)
  const MAX_CLASS_DISPLAY_LENGTH = 50; // Maximum length of class names to display
  const OVERLAY_MARGIN = 10; // Margin from cursor position to overlay position

  // Colors for box model visualization (rgba with transparency)
  const MARGIN_COLOR = 'rgba(255, 165, 0, 0.3)'; // Orange
  const BORDER_COLOR = 'rgba(255, 255, 0, 0.3)'; // Yellow
  const PADDING_COLOR = 'rgba(0, 128, 0, 0.3)'; // Green
  const CONTENT_COLOR = 'rgba(0, 0, 255, 0.3)'; // Blue

  /**
   * Handles the inspector mode update
   * If enabled, it initializes the overlay DOM elements and adds event listeners.
   * If disabled, it removes the event listeners and cleans up the DOM elements.
   *
   * @param isEnabled - The state of the inspector mode
   */
  function handleInspectorModeUpdate(isEnabled: boolean): void {
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
  function initializeOverlayDOM(): void {
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
    if (!overlayContainer) return;

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
  function addEventListeners(): void {
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
   * Options for creating and appending an element
   * @property id - The ID of the element
   * @property parent - The parent element to append to
   * @property tagName - The tag name of the element (default: 'div')
   * @property classNames - The class names to assign to the element
   */
  type CreateAndAppendOptions = {
    id: string;
    parent: HTMLElement;
    tagName?: string;
    classNames?: string;
  };

  /**
   * Creates and appends an element to a parent element
   *
   * @param options - The options object for element creation
   * @returns The created element or null if required params are missing
   */
  function createAndAppend({
    id,
    parent,
    tagName = 'div',
    classNames = '',
  }: CreateAndAppendOptions): HTMLElement | null {
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
   * @param event - The triggered event
   * @param overlayElement - The overlay dom element
   * @returns The position of the overlay
   */
  function getOverlayPosition(
    event: MouseEvent,
    overlayElement: HTMLElement | null
  ): { top: number; left: number } {
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
   * Generates the HTML content for the overlay
   *
   * @param element - The target element
   * @param computedStyle - The computed style of the element
   * @param rect - The bounding client rect of the element
   * @returns The HTML content for the overlay
   */
  function generateOverlayContent(
    element: HTMLElement,
    computedStyle: CSSStyleDeclaration,
    rect: DOMRect
  ): string {
    if (!element || !computedStyle || !rect) return '';

    // Get element details
    const elementId = element.id ? `#${element.id}` : '';
    const elementClasses = getElementClassNames(
      element,
      MAX_CLASS_DISPLAY_LENGTH
    );
    const dimensions = formatDimensions(rect.width, rect.height);
    const margin = formatBoxModelValues(computedStyle, 'margin');
    const padding = formatBoxModelValues(computedStyle, 'padding');
    const border = formatBorderInfo(computedStyle);
    const borderRadius = formatBoxModelValues(computedStyle, 'border-radius');
    const fontFamily = formatFontStack({
      fontFamily: computedStyle.fontFamily,
      maxFonts: 1,
      showFallback: false,
    });
    const backgroundColor = formatColorValue(computedStyle.backgroundColor);

    // Check if the sections have any data to display
    const hasLayoutSection = dimensions || margin || padding || border;
    const hasAppearanceSection = backgroundColor || borderRadius;
    const hasTextSection = element.textContent.trim().length > 0;

    const layoutSection = hasLayoutSection
      ? `
      <section class="bp-element-group">
        <h4 class="bp-element-group-title">Layout</h4>
        <ul>
          <li><span class="bp-element-label">Display:</span> ${
            computedStyle.display
          }</li>
          <li><span class="bp-element-label">Dimensions:</span> ${dimensions}</li>
          ${
            margin &&
            `<li><span class="bp-element-label">Margin:</span> ${margin}</li>`
          }
          ${
            border &&
            `<li><span class="bp-element-label">Border:</span> ${border}</li>`
          }
          ${
            padding &&
            `<li><span class="bp-element-label">Padding:</span> ${padding}</li>`
          }
        </ul>
      </section>`
      : '';

    const appearanceSection = hasAppearanceSection
      ? `
      <section class="bp-element-group">
        <h4 class="bp-element-group-title">Appearance</h4>
        <ul>
          ${
            backgroundColor &&
            `<li><span class="bp-element-label">Background Color:</span>
              <span class="bp-color-element-box" style="background-color: ${backgroundColor}"></span> ${backgroundColor}
            </li>`
          }
          ${
            borderRadius &&
            `<li><span class="bp-element-label">Border Radius:</span> ${borderRadius}</li>`
          }
        </ul>
      </section>`
      : '';

    const textSection = hasTextSection
      ? `
      <section class="bp-element-group">
        <h4 class="bp-element-group-title">Text</h4>
        <ul>
          ${
            fontFamily &&
            `<li><span class="bp-element-label">Font Family:</span> ${fontFamily}</li>`
          }
          ${
            computedStyle.fontSize &&
            `<li><span class="bp-element-label">Font Size:</span> ${computedStyle.fontSize}</li>`
          }
          ${
            computedStyle.fontWeight &&
            `<li><span class="bp-element-label">Font Weight:</span> ${computedStyle.fontWeight}</li>`
          }
          ${
            computedStyle.color &&
            `<li><span class="bp-element-label">Color:</span>
              <span class="bp-color-element-box" style="background-color: ${computedStyle.color}">
              </span> ${computedStyle.color}
            </li>`
          }
          ${
            computedStyle.lineHeight &&
            `<li><span class="bp-element-label">Line Height:</span> ${computedStyle.lineHeight}</li>`
          }
          ${
            computedStyle.textAlign &&
            `<li><span class="bp-element-label">Text Align:</span> ${computedStyle.textAlign}</li>`
          }
        </ul>
      </section>`
      : '';

    // Generate the HTML content for the overlay
    return `
      <section>
        <strong>${element.tagName.toLowerCase()}</strong> <span class="bp-id-value">
          ${elementId}
        </span><br>
        ${
          elementClasses
            ? `<span class="bp-element-label">Classes:</span> ${elementClasses}`
            : ''
        }
      </section>

      ${layoutSection}
      ${appearanceSection}
      ${textSection}

      <footer class="bp-overlay-footer">
        <span class="bp-branding">Border Patrol</span>
      </footer>
    `;
  }

  /**
   * Displays the overlay on mouseover
   *
   * @param event - The triggered event
   */
  function mouseOverHandler(event: MouseEvent): void {
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

    const element = event.target as HTMLElement;
    // Skip if hovered over the overlay
    if (!element || overlayContainer!.contains(element)) {
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

    // Update the overlay content with the element details
    overlay.innerHTML = generateOverlayContent(element, computedStyle, rect);

    // Set display to block before getOverlayPosition
    overlay.style.display = 'block';

    // Update the position of the overlay
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
   * @param event - The triggered event
   */
  function updateOverlayPosition(event: MouseEvent): void {
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
   * @param event - The triggered event
   */
  function mouseMoveHandler(event: MouseEvent): void {
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
  function mouseOutHandler(): void {
    if (overlay) overlay.style.display = 'none';
    if (marginBox) marginBox.style.display = 'none';
    if (borderBox) borderBox.style.display = 'none';
    if (paddingBox) paddingBox.style.display = 'none';
    if (contentBox) contentBox.style.display = 'none';
  }

  /** Removes all overlay elements from the DOM and resets related variables to null */
  function removeElements(): void {
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
  function removeEventListeners(): void {
    try {
      document.removeEventListener('mouseover', mouseOverHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseout', mouseOutHandler);
    } catch (error) {
      Logger.error('Error removing event listeners:', error);
    }
  }

  // Recieve message to update inspector mode
  chrome.runtime.onMessage.addListener(
    (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
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
    }
  );
})();
