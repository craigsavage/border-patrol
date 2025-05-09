(function () {
  let isInspectorModeEnabled = false; // Cache the inspector mode state
  let throttleTimeout = null;

  // DOM elements
  let overlayContainer = null;
  let overlay = null;
  let highlight = null;

  const THROTTLE_DELAY = 16; // Delay in milliseconds (16ms = 60fps)

  /** Initializes the inspector mode state and DOM elements */
  async function handleInspectorModeUpdate(isEnabled) {
    console.log('Overlay received UPDATE_INSPECTOR_MODE:', isEnabled);

    if (isInspectorModeEnabled) {
      console.log('Inspector mode enabled. Initializing overlay.');
      initializeOverlayDOM();
      addEventListeners();
      // Send initial state to background? Not needed usually, background manages state.
    } else {
      console.log('Inspector mode disabled. Cleaning up overlay.');
      removeEventListeners();
      removeElements(); // Clean up DOM elements when disabled
    }
  }

  /** Initializes the DOM elements if they are not already initialized */
  function initializeOverlayDOM() {
    // Check if overlay is already initialized
    if (document.getElementById('bp-inspector-container')) {
      console.log('Overlay already initialized.');
      overlayContainer = document.getElementById('bp-inspector-container');
      overlay = document.getElementById('bp-inspector-overlay');
      highlight = document.getElementById('bp-element-highlight');
      return;
    }

    // Initialize DOM elements
    overlayContainer = createAndAppend('bp-inspector-container', document.body);
    overlay = createAndAppend('bp-inspector-overlay', overlayContainer);
    highlight = createAndAppend('bp-element-highlight', document.body);

    // Ensure they are hidden initially
    if (overlay) overlay.style.display = 'none';
    if (highlight) highlight.style.display = 'none';
    console.log('Overlay initialized.');
  }

  /** Adds event listeners */
  function addEventListeners() {
    // Check if overlay is already initialized
    if (!overlayContainer || !overlay || !highlight) {
      console.error('Overlay elements not initialized.');
      return;
    }

    // Add event listeners to the document
    document.addEventListener('mouseover', mouseOverHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseout', mouseOutHandler);
    console.log('Overlay event listeners added.');
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
   * Retrieves the inspector mode state from chrome storage.
   *
   * @returns {Promise<boolean>} The inspector mode state from chrome storage
   */
  async function getInspectorModeState() {
    try {
      if (!chrome || !chrome.storage) return false;

      // Retrieve the inspector mode state
      await chrome.runtime.sendMessage(
        { action: 'GET_INSPECTOR_MODE' },
        response => {
          isInspectorModeEnabled = response;
        }
      );

      console.log(
        'IS INSPECTOR MODE ENABLED:',
        isEnisInspectorModeEnabledabled
      );
      return isEnabled;
    } catch (error) {
      // Ignore errors
      return false;
    }
  }

  /**
   * Calculates the position of the overlay relative to the cursor and prevents it from going off-screen
   *
   * @param {*} event - The triggered event
   * @param {*} overlayElement - The overlay dom element
   * @returns {Object} The position of the overlay
   */
  function getOverlayPosition(event, overlayElement) {
    if (!overlayElement) return { top: 0, left: 0 }; // Default values

    const overlayMargin = 10; // Margin from cursor
    const overlayRect = overlayElement.getBoundingClientRect();

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
   *
   * @param {Event} event - The triggered event
   */
  async function mouseOverHandler(event) {
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
    )
      return;

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
      <div class="bp-element-info">
        <strong>${element.tagName.toLowerCase()}</strong><br>
        ${Math.round(rect.width)} x ${Math.round(rect.height)} px<br>
        ${computedStyle.border ? `Border: ${computedStyle.border}<br>` : ''}
        ${computedStyle.margin ? `Margin: ${computedStyle.margin}<br>` : ''}
        ${computedStyle.padding ? `Padding: ${computedStyle.padding}` : ''}
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
      // Set position and size of the highlight
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      highlight.style.display = 'block';
      highlight.style.pointerEvents = 'none'; // Ensure highlight doesn't block clicks
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
      overlay.style.top = `${top}px`;
      overlay.style.left = `${left}px`;
    });
  }

  /**
   * Updates the position of the overlay on mousemove
   *
   * @param {Event} event - The triggered event
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

  // Recieve message to update inspector mode
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    // Check if the message is to update inspector mode
    if (request.action === 'UPDATE_INSPECTOR_MODE') {
      console.log('Overlay received UPDATE_INSPECTOR_MODE:', request.isEnabled);
      handleInspectorModeUpdate(request.isEnabled);
    }
    // Respond to PING message if needed (used by background to check injection)
    if (request.action === 'PING') {
      sendResponse({ status: 'PONG' });
      return true; // Indicate async response
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
