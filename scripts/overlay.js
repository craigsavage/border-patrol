(function () {
  let isInspectorModeEnabled = false; // Cache the inspector mode state

  init();

  /** Initializes the inspector mode state */
  async function init() {
    isInspectorModeEnabled = await getInspectorModeState();
    // console.log('Inspector mode enabled:', isInspectorModeEnabled);
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
   * Calculates the position of the overlay
   * @param {*} event - The triggered event
   * @param {*} overlay - The overlay dom element
   * @returns {Object} The position of the overlay
   */
  function getOverlayPosition(event, overlay) {
    if (!overlay) return { top: 0, left: 0 }; // Return default values
    const overlayMargin = 10; // Overlay margin

    // Calculate position of the overlay relative to the cursor
    let posX = event.clientX + window.scrollX + overlayMargin;
    let posY = event.clientY + window.scrollY + overlayMargin;

    // Prevent tooltip from going off-screen
    const overlayRect = overlay.getBoundingClientRect();

    // Flips the overlay to the left if it exceeds the right edge
    if (posX + overlayRect.width > window.innerWidth) {
      posX = event.clientX - overlayRect.width - overlayMargin;
    }
    // Flips the overlay upward if it exceeds the bottom edge
    if (posY + overlayRect.height > window.innerHeight) {
      posY = event.clientY - overlayRect.height - overlayMargin;
    }

    return { top: posY, left: posX };
  }

  /**
   * Displays the overlay on mouseover
   * @param {*} event - The triggered event
   */
  async function mouseOverHandler(event) {
    // Check if the chrome storage API is available
    if (!chrome || !chrome.storage) return; // Extension context may be invalid

    // Retrieve the inspector mode state
    try {
      if (!isInspectorModeEnabled) {
        isInspectorModeEnabled = await getInspectorModeState(); // Update cache with latest value
      }
    } catch (error) {
      console.error('Error getting inspector mode state:', error);
    }

    if (!isInspectorModeEnabled) return;

    const element = event.target;
    if (!element || element.id === 'inspector-overlay') return;

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    if (!rect || !computedStyle) return;
    // console.log('element:', element);
    // console.log('rect:', rect);
    // console.log('computedStyle:', computedStyle);

    let overlay = document.getElementById('inspector-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'inspector-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
    <strong>${element.tagName.toLowerCase()}</strong><br>
    ${Math.round(rect.width)} x ${Math.round(rect.height)} px<br>
    ${computedStyle.border ? `Border: ${computedStyle.border}<br>` : ''}
    ${computedStyle.margin ? `Margin: ${computedStyle.margin}<br>` : ''}
    ${computedStyle.padding ? `Padding: ${computedStyle.padding}` : ''}
  `;

    // Calculate position of the overlay
    const { top, left } = getOverlayPosition(event, overlay);

    // Display the overlay
    requestAnimationFrame(() => {
      overlay.style.top = `${top}px`;
      overlay.style.left = `${left}px`;
      overlay.style.display = 'block';
    });
  }

  /** Hides the overlay on mouseout */
  function mouseOutHandler() {
    const overlay = document.getElementById('inspector-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  /** Removes event listeners */
  function removeEventListeners() {
    document.removeEventListener('mouseover', mouseOverHandler);
    document.removeEventListener('mouseout', mouseOutHandler);
  }

  // Add event listeners
  document.addEventListener('mouseover', mouseOverHandler);
  document.addEventListener('mouseout', mouseOutHandler);

  // Recieve message to update inspector mode
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'UPDATE_INSPECTOR_MODE') {
      isInspectorModeEnabled = request.isEnabled;
    }
  });

  chrome.runtime.onConnect.addListener(connectionPort => {
    connectionPort.onDisconnect.addListener(() => {
      removeEventListeners();
    });
  });
})();
