import { DEFAULT_TAB_STATE } from '../scripts/constants';
import Logger from '../scripts/utils/logger';
import type { TabState, TabStateChangeOptions } from '../types/background';

// In-memory cache for tab states. This helps reduce repeated calls to storage.
const cachedTabStates: Record<string, TabState> = {}; // tabId: TabState

/**
 * Retrieves the extension state for the specified tab ID.
 * Checks cache first, then storage. Updates cache from storage.
 *
 * @param tabId - The ID of the tab to retrieve the state for.
 * @returns The state of the extension for the specified tab ID.
 */
export async function getTabState(tabId: number): Promise<TabState> {
  const tabIdString = tabId.toString();

  if (cachedTabStates?.[tabIdString]) {
    return cachedTabStates[tabIdString];
  }

  try {
    const storedData = await chrome.storage.local.get(tabIdString);
    const tabState = storedData?.[tabIdString];

    cachedTabStates[tabIdString] = tabState ?? { ...DEFAULT_TAB_STATE };
    return cachedTabStates[tabIdString];
  } catch (error) {
    Logger.error(
      `Error retrieving tab state for tab ${tabId} from storage:`,
      error,
    );
    return { ...DEFAULT_TAB_STATE };
  }
}

/**
 * Updates and stores the extension states for a specified tab.
 * Updates the cache and storage.
 *
 * @param options - Options to set the tab states.
 */
export async function setTabState({
  tabId,
  states,
}: TabStateChangeOptions): Promise<void> {
  const tabIdString = tabId.toString();
  const currentState = await getTabState(tabId);

  cachedTabStates[tabIdString] = { ...currentState, ...states };

  try {
    await chrome.storage.local.set({
      [tabIdString]: cachedTabStates[tabIdString],
    });
    Logger.info(
      `Updated tab state for tab ${tabId} in storage:`,
      cachedTabStates[tabIdString],
    );
  } catch (error) {
    Logger.error(`Error setting tab state for tab ${tabId} in storage:`, error);
  }
}

/**
 * Clears a tab's in-memory state entry.
 *
 * @param tabId - The ID of the tab to clear.
 */
export function clearTabStateCache(tabId: number): void {
  delete cachedTabStates[tabId.toString()];
}
