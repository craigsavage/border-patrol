import { getActiveTab, isRestrictedUrl } from '../scripts/helpers';
import Logger from '../scripts/utils/logger';
import { toggleModeForTab, type ToggleableMode } from './utils/mode-toggle';

const COMMAND_TO_MODE: Record<string, ToggleableMode> = {
  toggle_border_mode: 'borderMode',
  toggle_inspector_mode: 'inspectorMode',
  toggle_measurement_mode: 'measurementMode',
  toggle_ruler_mode: 'rulerMode',
};

/**
 * Registers keyboard shortcut command handlers.
 */
export function setupCommandListener(): void {
  chrome.commands.onCommand.addListener(async (command: string) => {
    Logger.info('Command received:', command);

    const mode = COMMAND_TO_MODE[command];
    if (!mode) {
      Logger.warn('Unknown command received:', command);
      return;
    }

    try {
      const activeTab = await getActiveTab();
      if (!activeTab?.id || !activeTab?.url || isRestrictedUrl(activeTab.url)) {
        Logger.warn('Ignoring command on restricted or invalid tab.');
        return;
      }

      await toggleModeForTab(activeTab.id, mode);
    } catch (error) {
      Logger.error(`Error toggling ${mode} via command:`, error);
    }
  });
}
