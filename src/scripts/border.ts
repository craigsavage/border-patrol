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

  // Get the Border Patrol Inspector container
  let bpInspectorContainer: Element | null = document.querySelector(
    '#bp-inspector-container',
  );

  let observer: MutationObserver | null = null; // Declare the MutationObserver instance

  // Pending mutations and rAF handle for debounced mutation processing
  let pendingMutations: MutationRecord[] = [];
  let rafHandle: number | null = null;

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
   * Determines if the given element is part of the Border Patrol Inspector UI.
   *
   * @param element - The element to be checked.
   * @returns True if the element is part of the Inspector UI, otherwise false.
   */
  function isInspectorUIElement(element: Element): boolean {
    if (!bpInspectorContainer || !element) return false;
    return bpInspectorContainer.contains(element);
  }

  /**
   * Applies an outline to a given element based on its group and specified size and style.
   *
   * @param element - The DOM element to apply the outline to.
   * @param outlineSize - The size of the outline in pixels.
   * @param outlineStyle - The style of the outline (e.g., 'solid', 'dashed', etc.).
   */
  function applyOutlineToElement(
    element: Element,
    outlineSize: number,
    outlineStyle: string,
  ): void {
    // Ensure the element is a valid DOM element
    if (!(element instanceof Element)) {
      return; // Skip if not an element instance
    }

    // Exclude applying outlines to Border Patrol elements
    if (isInspectorUIElement(element)) return;

    const elementTag = element.tagName.toLowerCase();
    let outlineColor: string = defaultColor;

    // Determine element's group and apply corresponding color
    for (const { tags, color: groupColor } of Object.values(elementGroups)) {
      if (tags.includes(elementTag)) {
        outlineColor = groupColor;
        break; // Stop searching once a match is found
      }
    }

    // Apply the outline style to the element
    (element as HTMLElement).style.outline =
      `${outlineSize}px ${outlineStyle} ${outlineColor}`;
  }

  /**
   * Applies outlines to all elements in the provided list in chunks, yielding
   * between frames via requestAnimationFrame to keep the page responsive.
   *
   * @param elements - The list of elements to process.
   * @param size - The outline size in pixels.
   * @param style - The outline style (e.g., 'solid', 'dashed').
   * @param chunkSize - Number of elements to process per frame (default 200).
   */
  function applyOutlinesToAll(
    elements: Element[],
    size: number,
    style: string,
    chunkSize = 200,
  ): void {
    let index = 0;
    function processChunk() {
      const end = Math.min(index + chunkSize, elements.length);
      for (; index < end; index++) {
        applyOutlineToElement(elements[index], size, style);
      }
      if (index < elements.length) {
        requestAnimationFrame(processChunk);
      }
    }
    requestAnimationFrame(processChunk);
  }

  /**
   * Processes a batch of accumulated MutationRecords to apply outlines to
   * newly added nodes and their children.
   *
   * @param mutations - The mutations to process.
   */
  function processMutations(mutations: MutationRecord[]): void {
    const { size: outlineSize, style: outlineStyle } = currentBorderSettings;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Iterate over newly added nodes
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return; // Skip non-element nodes

          // Apply outline to the newly added node
          applyOutlineToElement(node as Element, outlineSize, outlineStyle);

          // Apply outline to all child elements of the newly added node
          (node as Element).querySelectorAll('*').forEach(child => {
            applyOutlineToElement(child, outlineSize, outlineStyle);
          });
        });
      }
    });
  }

  /**
   * Accumulates mutations and flushes them once per animation frame to
   * coalesce bursts of DOM changes on animation-heavy pages.
   *
   * @param mutationsList - Array of mutations observed in the DOM.
   */
  function handleMutations(mutationsList: MutationRecord[]): void {
    if (!isBorderModeEnabled) return; // Skip if border mode is not enabled
    pendingMutations.push(...mutationsList);
    if (rafHandle === null) {
      rafHandle = requestAnimationFrame(() => {
        processMutations(pendingMutations.splice(0));
        rafHandle = null;
      });
    }
  }

  /**
   * Starts observing the DOM for changes to apply or remove outlines dynamically.
   * Watches only for childList changes to avoid re-entrant callbacks from our
   * own style writes.
   */
  function startObservingDOM(): void {
    if (!observer) {
      observer = new MutationObserver(handleMutations);
    }
    // Disconnect any existing observation before starting a new one
    observer.disconnect();

    Logger.info('Starting DOM observation for border updates.');

    const config: MutationObserverInit = {
      childList: true,
      subtree: true,
    };

    observer.observe(document.body, config);
  }

  /** Stops observing the DOM for changes. */
  function stopObservingDOM(): void {
    if (!observer) return;

    try {
      observer.disconnect();
    } catch (err) {
      Logger.debug('Failed to disconnect the observer:', err);
    }

    observer = null; // Clear the observer reference to prevent memory leaks

    // Cancel any pending rAF flush and discard accumulated mutations
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
    pendingMutations = [];
  }

  /**
   * Manages applying or removing extension-specific outlines to elements.
   *
   * @param isEnabled - Determines whether the outline should be applied.
   * @param size - The size of the outline in pixels.
   * @param style - The style of the outline (e.g., 'solid', 'dashed', etc.).
   */
  async function manageElementOutlines(
    isEnabled: boolean,
    size: number,
    style: string,
  ): Promise<void> {
    Logger.info(
      `Managing element outlines: isEnabled=${isEnabled}, size=${size}, style=${style}`,
    );

    // Remove outline if extension is disabled
    if (!isEnabled) {
      Logger.info('Borders are disabled. Removing outlines from all elements.');
      stopObservingDOM(); // Stop observing the DOM to prevent unnecessary updates
      document.querySelectorAll('*').forEach(element => {
        // Skip Border Patrol Inspector UI elements
        if (isInspectorUIElement(element)) return;

        // Remove outline from all elements
        (element as HTMLElement).style.outline = 'none';
      });
      return;
    }

    // Update the Border Patrol Inspector container reference
    bpInspectorContainer = document.querySelector('#bp-inspector-container');

    // Disconnect observer before the bulk write to avoid re-entrant callbacks,
    // then restart it immediately so new nodes during chunking are also captured.
    if (observer) observer.disconnect();
    startObservingDOM();

    // Apply outlines in chunks to avoid blocking the main thread
    applyOutlinesToAll(Array.from(document.querySelectorAll('*')), size, style);
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

      void (async () => {
        // Receive message to update border mode
        if (request.action === RUNTIME_MESSAGES.UPDATE_BORDER_MODE) {
          // Get new border mode from request
          isBorderModeEnabled = request.payload.isEnabled;
          // Apply/remove outline based on the new mode and current settings
          await manageElementOutlines(
            isBorderModeEnabled,
            currentBorderSettings.size,
            currentBorderSettings.style,
          );
        }
        // Receive message to update border settings
        if (request.action === RUNTIME_MESSAGES.UPDATE_BORDER_SETTINGS) {
          // Get new border settings from request
          currentBorderSettings.size = request.payload.size;
          currentBorderSettings.style = request.payload.style;
          // Apply/remove outline based on the current mode and new settings
          await manageElementOutlines(
            isBorderModeEnabled,
            currentBorderSettings.size,
            currentBorderSettings.style,
          );
        }
      })().catch(error => {
        Logger.error('Error handling border message:', error);
      });

      return false;
    },
  );
})();
