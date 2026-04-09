import Logger from './utils/logger';
import { BorderSettings, ElementGroup } from '../types/scripts/border';
import { RUNTIME_MESSAGES, RuntimeMessage } from 'types/runtime-messages';

(function () {
  // Cache the border mode state and border settings
  let isBorderModeEnabled: boolean = false;
  let currentBorderSettings: BorderSettings = {
    size: 1,
    style: 'solid',
  };

  const STYLE_ELEMENT_ID = 'bp-border-styles';

  // Exclude the Border Patrol Inspector UI from all border rules
  const exclusion =
    ':not(#bp-inspector-container):not(#bp-inspector-container *)';

  // Define element groups with their tags and colors
  const elementGroups: Record<string, ElementGroup> = {
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
  const defaultColor: string = 'red';

  /**
   * Builds a CSS string that applies color-coded outlines to each element group.
   * Tag-specific rules have specificity (0,2,1) and the catch-all `*` rule has (0,2,0),
   * so group colors always win when both `!important` declarations conflict.
   *
   * @param size - The outline size in pixels.
   * @param style - The outline style (e.g., 'solid', 'dashed').
   * @returns A CSS string ready to inject into a style element.
   */
  function buildBorderStyles(size: number, style: string): string {
    const lines: string[] = [];

    for (const { tags, color } of Object.values(elementGroups)) {
      const selectors = tags.map(tag => `${tag}${exclusion}`).join(',');
      lines.push(`${selectors}{outline:${size}px ${style} ${color} !important}`);
    }

    // Catch-all for any element not covered by a group rule
    lines.push(`*${exclusion}{outline:${size}px ${style} ${defaultColor} !important}`);

    return lines.join('');
  }

  /**
   * Injects or updates the border stylesheet in the document head.
   * Using a stylesheet with `!important` ensures outlines survive host-page
   * style mutations without needing a MutationObserver. New elements added
   * dynamically are styled automatically by the browser.
   *
   * @param size - The outline size in pixels.
   * @param style - The outline style.
   */
  function injectBorderStyles(size: number, style: string): void {
    let styleEl = document.getElementById(
      STYLE_ELEMENT_ID,
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildBorderStyles(size, style);
  }

  /**
   * Removes the border stylesheet from the document, clearing all outlines instantly.
   */
  function removeBorderStyles(): void {
    document.getElementById(STYLE_ELEMENT_ID)?.remove();
  }

  /**
   * Applies or removes the border stylesheet based on the enabled state.
   *
   * @param isEnabled - Whether border mode should be active.
   * @param size - The outline size in pixels.
   * @param style - The outline style.
   */
  function manageElementOutlines(
    isEnabled: boolean,
    size: number,
    style: string,
  ): void {
    Logger.info(
      `Managing element outlines: isEnabled=${isEnabled}, size=${size}, style=${style}`,
    );

    if (!isEnabled) {
      Logger.info('Borders are disabled. Removing border stylesheet.');
      removeBorderStyles();
      return;
    }

    injectBorderStyles(size, style);
  }

  // Receive message to apply outline to all elements
  chrome.runtime.onMessage.addListener(
    (
      request: RuntimeMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      Logger.info('Received message to apply outline:', request);

      if (request.action === RUNTIME_MESSAGES.PING) {
        sendResponse({ status: RUNTIME_MESSAGES.PONG });
        return false;
      }

      // Receive message to update border mode
      if (request.action === RUNTIME_MESSAGES.UPDATE_BORDER_MODE) {
        isBorderModeEnabled = request.payload.isEnabled;
        manageElementOutlines(
          isBorderModeEnabled,
          currentBorderSettings.size,
          currentBorderSettings.style,
        );
      }

      // Receive message to update border settings
      if (request.action === RUNTIME_MESSAGES.UPDATE_BORDER_SETTINGS) {
        currentBorderSettings.size = request.payload.size;
        currentBorderSettings.style = request.payload.style;
        manageElementOutlines(
          isBorderModeEnabled,
          currentBorderSettings.size,
          currentBorderSettings.style,
        );
      }

      return false;
    },
  );
})();
