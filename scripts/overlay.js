(function () {
  let isInspectorModeEnabled = false; // Cache the inspector mode state

  init();

  /** Initializes the inspector mode state */
  async function init() {
    await updateInspectorModeState();
  }

  /** Checks if the inspector mode is enabled */
  async function updateInspectorModeState() {
    isInspectorModeEnabled = await getInspectorModeState();
  }

  /**
   * Retrieves the inspector mode state from chrome storage.
   * @returns {boolean} The inspector mode state from chrome storage
   */
  async function getInspectorModeState() {
    try {
      // Check if the chrome storage API is available
      if (!chrome || !chrome.storage) {
        console.error(
          'Chrome storage API is unavailable. Extension context may be invalid.'
        );
        return false;
      }

      // Retrieve the inspector mode state
      const data = await chrome.storage.local.get('isInspectorModeEnabled');
      return data?.isInspectorModeEnabled || false;
    } catch (error) {
      console.error('Error getting inspector mode state:', error);
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
    // Check if the chrome storage API is available
    if (!chrome?.storage) return;

    // Retrieve the inspector mode state
    if (!isInspectorModeEnabled) {
      await updateInspectorModeState();
    }
    if (!isInspectorModeEnabled) return;

    const element = event.target;
    if (!element || element.id === 'inspector-overlay') return;

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    if (!rect || !computedStyle) return;

    let overlayContainer = document.getElementById(
      'inspector-overlay-container'
    );
    if (!overlayContainer) {
      overlayContainer = document.createElement('div');
      overlayContainer.id = 'inspector-overlay-container';
      document.body.appendChild(overlayContainer);
    }

    const bodyRect = document.body.getBoundingClientRect();

    // Set position and size of the overlay container relative to the body
    overlayContainer.style.top = `${bodyRect.top}px`;
    overlayContainer.style.left = `${bodyRect.left}px`;
    overlayContainer.style.width = `${bodyRect.width}px`;
    overlayContainer.style.height = `${bodyRect.height}px`;

    let overlay = document.getElementById('inspector-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'inspector-overlay';
      overlayContainer.appendChild(overlay);
    }

    overlay.innerHTML = `
      <strong>${element.tagName.toLowerCase()}</strong><br>
      ${Math.round(rect.width)} x ${Math.round(rect.height)} px<br>
      ${computedStyle.border ? `Border: ${computedStyle.border}<br>` : ''}
      ${computedStyle.margin ? `Margin: ${computedStyle.margin}<br>` : ''}
      ${computedStyle.padding ? `Padding: ${computedStyle.padding}` : ''}
    `;

    console.log('test');

    // Set display to block before getOverlayPosition
    overlay.style.display = 'block';

    updateOverlayPosition(event);
  }

  /**
   * Updates the position of the overlay
   * @param {*} event - The triggered event
   */
  function updateOverlayPosition(event) {
    const overlay = document.getElementById('inspector-overlay');
    if (overlay) {
      // Calculate position of the overlay
      const { top, left } = getOverlayPosition(event, overlay);

      // Display the overlay
      requestAnimationFrame(() => {
        overlay.style.top = `${top}px`;
        overlay.style.left = `${left}px`;
      });
    }
  }

  /** Hides the overlay on mouseout */
  function mouseOutHandler() {
    const overlay = document.getElementById('inspector-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  /** Removes event listeners */
  function removeEventListeners() {
    document.removeEventListener('mouseover', mouseOverHandler);
    document.removeEventListener('mousemove', mouseOverHandler);
    document.removeEventListener('mouseout', mouseOutHandler);
  }

  // Add event listeners
  document.addEventListener('mouseover', mouseOverHandler);
  document.addEventListener('mousemove', mouseOverHandler);
  document.addEventListener('mouseout', mouseOutHandler);

  // Recieve message to update inspector mode
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'UPDATE_INSPECTOR_MODE') {
      isInspectorModeEnabled = request.isEnabled;
    }
  });

  // Remove event listeners when the connection is closed
  chrome.runtime.onConnect.addListener(connectionPort => {
    connectionPort.onDisconnect.addListener(() => {
      removeEventListeners();
    });
  });
})();
