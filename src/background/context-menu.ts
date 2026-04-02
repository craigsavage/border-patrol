import Logger from '../scripts/utils/logger';
import { isRestrictedUrl } from '../scripts/helpers';
import { toggleModeForTab, type ToggleableMode } from './utils/mode-toggle';

const MENU_ITEM_TO_MODE: Record<string, ToggleableMode> = {
  'bp-toggle-border-mode': 'borderMode',
  'bp-toggle-inspector-mode': 'inspectorMode',
  'bp-toggle-measurement-mode': 'measurementMode',
  'bp-toggle-ruler-mode': 'rulerMode',
};

/**
 * Creates the "Border Patrol" context menu with sub-items to toggle each mode.
 * Removes any existing items first to avoid duplicates on reinstall.
 */
export function setupContextMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'bp-parent',
      title: chrome.i18n.getMessage('extensionName'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-border-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleBorderModeCommand'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-inspector-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleInspectorModeCommand'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-measurement-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleMeasurementModeCommand'),
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: 'bp-toggle-ruler-mode',
      parentId: 'bp-parent',
      title: chrome.i18n.getMessage('toggleRulerModeCommand'),
      contexts: ['all'],
    });

    Logger.info('Context menu created.');
  });
}

/**
 * Registers right-click context-menu click handlers for mode toggles.
 */
export function setupContextMenuClickListener(): void {
  chrome.contextMenus.onClicked.addListener(
    async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
      Logger.info('Context menu clicked:', info.menuItemId, tab);

      if (!tab?.id || !tab?.url || isRestrictedUrl(tab.url)) {
        Logger.warn('Context menu clicked on restricted or invalid tab.');
        return;
      }

      const mode = MENU_ITEM_TO_MODE[info.menuItemId as string];
      if (!mode) return;

      try {
        await toggleModeForTab(tab.id, mode);
      } catch (error) {
        Logger.error(
          `Error handling context menu click "${info.menuItemId}" for tab ${tab.id}:`,
          error,
        );
      }
    },
  );
}
