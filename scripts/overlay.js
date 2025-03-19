console.log('Injecting overlay script');

// Show overlay on mouseover
document.addEventListener('mouseover', event => {
  const element = event.target;
  if (!element || element.id === 'inspector-overlay') return;

  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  if (!rect || !computedStyle) return;
  console.log(
    'element:',
    element,
    '\nrect:',
    rect,
    '\ncomputedStyle:',
    computedStyle
  );

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
  let posX = event.clientX + 10;
  let posY = event.clientY + 10;
  console.log('posX:', posX, 'posY:', posY);

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

  overlay.style.top = `${posY}px`;
  overlay.style.left = `${posX}px`;
  overlay.style.display = 'block';
});

// Hide overlay on mouseout
document.addEventListener('mouseout', () => {
  const overlay = document.getElementById('inspector-overlay');
  if (overlay) overlay.style.display = 'none';
});
