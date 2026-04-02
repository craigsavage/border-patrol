import type { TabState } from '../../types/background';
import { handleTabStateChange } from '../extension-ui';
import { getTabState } from '../tab-state';

export type ToggleableMode =
  | 'borderMode'
  | 'inspectorMode'
  | 'measurementMode'
  | 'rulerMode';

/**
 * Toggles a mode for the given tab and applies the state update pipeline.
 *
 * @param tabId - The tab to update.
 * @param mode - The mode field to toggle.
 */
export async function toggleModeForTab(
  tabId: number,
  mode: ToggleableMode,
): Promise<void> {
  const currentState = await getTabState(tabId);
  const states: Partial<TabState> = {
    [mode]: !currentState[mode],
  };

  await handleTabStateChange({ tabId, states });
}
