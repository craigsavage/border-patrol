(function () {
  let isInspectorModeEnabled = false; // Cache the inspector mode state
  let throttleTimeout = null;

  // DOM elements
  let overlayContainer = null;
  let overlay = null;
  let highlight = null;

  const THROTTLE_DELAY = 16; // Delay in milliseconds (16ms = 60fps)

  init();

  /** Initializes the inspector mode state and DOM elements */
  async function init() {
    try {
      isInspectorModeEnabled = await getInspectorModeState();
      overlayContainer =
        document.getElementById('bp-inspector-container') ||
        createAndAppend('bp-inspector-container', document.body);
      overlay =
        document.getElementById('bp-inspector-overlay') ||
        createAndAppend('bp-inspector-overlay', overlayContainer);
      highlight =
        document.getElementById('bp-element-highlight') ||
        createAndAppend('bp-element-highlight', document.body);
    } catch (error) {
      // Clean up if initialization fails
      isInspectorModeEnabled = false;
      removeElements();
    }
  }

  /**
   * Creates and appends an element to a parent element
   * @param {string} id - The id of the element
   * @param {Object} parent - The parent element
   * @returns {Object} The created element
   */
  function createAndAppend(id, parent) {
    const element = document.createElement('div');
    element.id = id;
    parent.appendChild(element);
    return element;
  }

  /**
   * Retrieves the inspector mode state from chrome storage.
   * @returns {Promise<boolean>} The inspector mode state from chrome storage
   */
  async function getInspectorModeState() {
    try {
      if (!chrome || !chrome.storage) return false;

      // Retrieve the inspector mode state
      const data = await chrome.storage.local.get('isInspectorModeEnabled');
      return data?.isInspectorModeEnabled || false;
    } catch (error) {
      // Ignore errors
      return false;
    }
  }

  /**
   * Calculates the position of the overlay relative to the cursor
   * and prevents it from going off-screen
   * @param {*} event - The triggered event
   * @param {*} overlay - The overlay dom element
   * @returns {Object} The position of the overlay
   */
  function getOverlayPosition(event, overlay) {
    if (!overlay) return { top: 0, left: 0 }; // Default values

    const overlayMargin = 10; // Margin from cursor
    const overlayRect = overlay.getBoundingClientRect();

    // Calculate position of the overlay relative to the cursor
    let posX = event.clientX + overlayMargin;
    let posY = event.clientY + overlayMargin;

    // Flip left if overlay goes beyond right edge
    if (posX + overlayRect.width > window.innerWidth) {
      posX = event.clientX - overlayRect.width - overlayMargin;
    }

    // Flip up if overlay goes beyond bottom edge
    if (posY + overlayRect.height > window.innerHeight) {
      posY = event.clientY - overlayRect.height - overlayMargin;
    }

    return {
      top: posY + window.scrollY,
      left: posX + window.scrollX,
    };
  }

  /**
   * Displays the overlay on mouseover
   * @param {*} event - The triggered event
   */
  async function mouseOverHandler(event) {
    // Check if the storage API is available and inspector mode is enabled
    if (!chrome?.storage || !isInspectorModeEnabled) return;

    const element = event.target;
    if (!element || element.id === 'bp-inspector-overlay') return;

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    if (!rect || !computedStyle) return;

    const bodyRect = document.body.getBoundingClientRect();

    // Set position and size of the overlay container relative to the body
    overlayContainer.style.top = `${bodyRect.top}px`;
    overlayContainer.style.left = `${bodyRect.left}px`;
    overlayContainer.style.width = `${bodyRect.width}px`;
    overlayContainer.style.height = `${bodyRect.height}px`;

    // Update the overlay content with the element details
    overlay.innerHTML = `
      <strong>${element.tagName.toLowerCase()}</strong><br>
      ${Math.round(rect.width)} x ${Math.round(rect.height)} px<br>
      ${computedStyle.border ? `Border: ${computedStyle.border}<br>` : ''}
      ${computedStyle.margin ? `Margin: ${computedStyle.margin}<br>` : ''}
      ${computedStyle.padding ? `Padding: ${computedStyle.padding}` : ''}
    `;

    // Set display to block before getOverlayPosition
    overlay.style.display = 'block';

    updateOverlayPosition(event);

    // Display the highlight
    requestAnimationFrame(() => {
      // Set position and size of the highlight
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      highlight.style.display = 'block';
    });
  }

  /**
   * Updates the position of the overlay
   * @param {*} event - The triggered event
   */
  function updateOverlayPosition(event) {
    if (!overlay) return;

    // Calculate position of the overlay
    const { top, left } = getOverlayPosition(event, overlay);

    // Display the overlay
    requestAnimationFrame(() => {
      overlay.style.top = `${top}px`;
      overlay.style.left = `${left}px`;
    });
  }

  /**
   * Updates the position of the overlay on mousemove
   * @param {*} event - The triggered event
   */
  function mouseMoveHandler(event) {
    if (!isInspectorModeEnabled) return;

    // Throttle the overlay position update
    if (throttleTimeout === null) {
      throttleTimeout = setTimeout(() => {
        updateOverlayPosition(event);
        throttleTimeout = null;
      }, THROTTLE_DELAY);
    }
  }

  /** Hides the overlay and highlight on mouseout */
  function mouseOutHandler() {
    if (overlay) overlay.style.display = 'none';
    if (highlight) highlight.style.display = 'none';
  }

  /** Removes all elements from the DOM and resets variables to null */
  function removeElements() {
    // Remove all elements
    if (overlayContainer) overlayContainer.remove();
    if (overlay) overlay.remove();
    if (highlight) highlight.remove();

    // Reset variables to null
    overlayContainer = null;
    overlay = null;
    highlight = null;
  }

  /** Removes event listeners */
  function removeEventListeners() {
    document.removeEventListener('mouseover', mouseOverHandler);
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseout', mouseOutHandler);
  }

  // Add event listeners
  document.addEventListener('mouseover', mouseOverHandler);
  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseout', mouseOutHandler);

  // Recieve message to update inspector mode
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'UPDATE_INSPECTOR_MODE') {
      isInspectorModeEnabled = request.isEnabled;
    }
  });

  // Remove event listeners when the connection is closed
  chrome.runtime.onConnect.addListener(connectionPort => {
    if (!connectionPort) return;
    if (connectionPort.name === 'content-connection') {
      connectionPort.onDisconnect.addListener(() => {
        isInspectorModeEnabled = false;
        removeEventListeners();
        removeElements();
      });
    }
  });
})();
