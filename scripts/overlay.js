let isInspectorModeEnabled = false;

/**
 * Retrieves the inspector mode state from storage
 * @returns {boolean} - The inspector mode state
 */
async function getInspectorModeState() {
  try {
    if (!chrome || !chrome.storage) {
      console.error(
        'Chrome storage API is unavailable. Extension context may be invalid.'
      );
      return false;
    }

    const data = await chrome.storage.local.get('isInspectorModeEnabled');
    isInspectorModeEnabled = data.isInspectorModeEnabled || false;
    // return isInspectorModeEnabled;
  } catch (error) {
    console.error('Error getting inspector mode state:', error);
    return false;
  }
}

/**
 * Calculates the position of the overlay
 * @param {*} event - The triggered event
 * @param {*} overlay - The overlay dom element
 * @returns {Object} - The position of the overlay
 */
function getOverlayPosition(event, overlay) {
  // const overlay = document.getElementById('inspector-overlay');
  if (!overlay) return;

  // Calculate position of the overlay
  let posX = event.clientX + 10;
  let posY = event.clientY + 10;

  // Prevent tooltip from going off-screen
  const overlayRect = overlay.getBoundingClientRect();
  // Flips the overlay to the left if it exceeds the right edge
  if (posX + overlayRect.width > window.innerWidth) {
    posX = event.clientX - overlayRect.width - 10;
  }
  // Flips the overlay upward if it exceeds the bottom edge
  if (posY + overlayRect.height > window.innerHeight) {
    posY = event.clientY - overlayRect.height - 10;
  }

  return {
    top: `${posY}px`,
    left: `${posX}px`,
  };
}

// Show overlay on mouseover
document.addEventListener('mouseover', async event => {
  await getInspectorModeState();
  if (!isInspectorModeEnabled) return;
  console.log('Inspector mode enabled:', isInspectorModeEnabled);

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
    ${computedStyle.border ? `Border: ${computedStyle.border}` : ''}
  `;

  // Calculate position of the overlay
  const { top, left } = getOverlayPosition(event, overlay);

  overlay.style.top = `${top}px`;
  overlay.style.left = `${left}px`;
  overlay.style.display = 'block';
});

// Hide overlay on mouseout
document.addEventListener('mouseout', () => {
  const overlay = document.getElementById('inspector-overlay');
  console.log('Mouseout event triggered. Removing overlay');
  if (overlay) overlay.style.display = 'none';
});

// Recieve message to update inspector mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message (overlay):', request);
  if (request.action === 'UPDATE_INSPECTOR_MODE') {
    isInspectorModeEnabled = request.isEnabled;
  }
});
