import { DEFAULT_TAB_STATE } from '../scripts/constants';
import Logger from '../scripts/utils/logger';
import type { TabState, TabStateChangeOptions } from '../types/background';

// In-memory cache for tab states. This helps reduce repeated calls to storage.
const cachedTabStates: Record<string, TabState> = {}; // tabId: TabState

/**
 * Retrieves the extension state for the specified tab ID.
 * Checks cache first, then storage. Updates cache from storage.
 *
 * Merges stored state with DEFAULT_TAB_STATE so that any fields added in
 * future versions are always present (migration-safe forward compatibility).
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

    // Always spread DEFAULT_TAB_STATE first so that any fields added in future
    // schema versions are present even when reading old stored data.
    cachedTabStates[tabIdString] = { ...DEFAULT_TAB_STATE, ...(tabState ?? {}) };
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

/**
 * Removes stored state for tabs that are no longer open.
 *
 * Called on browser startup to evict entries left behind by a previous
 * session where the browser (or extension) terminated without firing
 * `chrome.tabs.onRemoved` for every tab.
 */
export async function cleanupOrphanedTabStates(): Promise<void> {
  try {
    const openTabs = await chrome.tabs.query({});
    const openTabIds = new Set(
      openTabs.map(tab => tab.id?.toString()).filter(Boolean),
    );

    const allStorage = await chrome.storage.local.get(null);

    // Tab state keys are purely numeric strings.
    const orphanedKeys = Object.keys(allStorage).filter(
      key => /^\d+$/.test(key) && !openTabIds.has(key),
    );

    if (orphanedKeys.length === 0) return;

    await chrome.storage.local.remove(orphanedKeys);
    orphanedKeys.forEach(key => {
      delete cachedTabStates[key];
    });

    Logger.info(
      `Cleaned up ${orphanedKeys.length} orphaned tab state(s):`,
      orphanedKeys,
    );
  } catch (error) {
    Logger.error('Error cleaning up orphaned tab states:', error);
  }
}
