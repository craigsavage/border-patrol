import { DEFAULT_TAB_STATE } from 'scripts/constants';
import {
  getTabState,
  setTabState,
  clearTabStateCache,
  cleanupOrphanedTabStates,
} from 'background/tab-state';

// ---------------------------------------------------------------------------
// Chrome API stub
// ---------------------------------------------------------------------------

const storageData: Record<string, unknown> = {};

const chromeMock = {
  storage: {
    local: {
      get: jest.fn(async (keys: string | string[] | null) => {
        if (keys === null) return { ...storageData };
        const keyList = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(
          keyList
            .filter(k => k in storageData)
            .map(k => [k, storageData[k]]),
        );
      }),
      set: jest.fn(async (items: Record<string, unknown>) => {
        Object.assign(storageData, items);
      }),
      remove: jest.fn(async (keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach(k => {
          delete storageData[k];
        });
      }),
    },
  },
  tabs: {
    query: jest.fn(async () => [] as chrome.tabs.Tab[]),
  },
};

(global as Record<string, unknown>).chrome = chromeMock;

// ---------------------------------------------------------------------------
// Reset storage and mocks before each test.
// Each test uses a unique tab ID so the module-level cache never collides.
// ---------------------------------------------------------------------------

beforeEach(() => {
  Object.keys(storageData).forEach(k => delete storageData[k]);
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getTabState — migration-safe defaults
// ---------------------------------------------------------------------------

describe('getTabState', () => {
  it('returns DEFAULT_TAB_STATE when no stored data exists', async () => {
    const state = await getTabState(1);
    expect(state).toEqual(DEFAULT_TAB_STATE);
  });

  it('returns stored values when they exist', async () => {
    storageData['42'] = { ...DEFAULT_TAB_STATE, borderMode: true };
    const state = await getTabState(42);
    expect(state.borderMode).toBe(true);
  });

  it('fills missing fields with defaults (forward-compatibility migration)', async () => {
    // Simulate old stored data missing a field added in a later schema version.
    storageData['7'] = { borderMode: true, inspectorMode: false };
    const state = await getTabState(7);
    expect(state.borderMode).toBe(true);
    expect(state.measurementMode).toBe(DEFAULT_TAB_STATE.measurementMode);
    expect(state.rulerMode).toBe(DEFAULT_TAB_STATE.rulerMode);
  });

  it('returns from cache on second call without hitting storage again', async () => {
    storageData['3'] = { ...DEFAULT_TAB_STATE, borderMode: true };
    await getTabState(3);
    await getTabState(3);
    expect(chromeMock.storage.local.get).toHaveBeenCalledTimes(1);
  });

  it('cache is cleared by clearTabStateCache, forcing a fresh storage read', async () => {
    storageData['5'] = { ...DEFAULT_TAB_STATE, borderMode: true };
    await getTabState(5);
    clearTabStateCache(5);
    // Update stored value — must be reflected after cache eviction
    storageData['5'] = { ...DEFAULT_TAB_STATE, borderMode: false };
    const state = await getTabState(5);
    expect(state.borderMode).toBe(false);
    expect(chromeMock.storage.local.get).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// setTabState
// ---------------------------------------------------------------------------

describe('setTabState', () => {
  it('merges partial state with existing state', async () => {
    storageData['10'] = { ...DEFAULT_TAB_STATE, borderMode: true };
    await setTabState({ tabId: 10, states: { inspectorMode: true } });
    const state = await getTabState(10);
    expect(state.borderMode).toBe(true);
    expect(state.inspectorMode).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// cleanupOrphanedTabStates
// ---------------------------------------------------------------------------

describe('cleanupOrphanedTabStates', () => {
  it('removes stored tab keys that are not in the open-tab list', async () => {
    storageData['100'] = { ...DEFAULT_TAB_STATE };
    storageData['101'] = { ...DEFAULT_TAB_STATE, borderMode: true };
    storageData['borderSize'] = 2; // global setting — must NOT be removed

    // Only tab 101 is open
    chromeMock.tabs.query.mockResolvedValueOnce([{ id: 101 }]);
    await cleanupOrphanedTabStates();

    expect(chromeMock.storage.local.remove).toHaveBeenCalledWith(['100']);
    expect(storageData['borderSize']).toBe(2); // global setting preserved
    expect(storageData['101']).toBeDefined();   // open-tab state preserved
  });

  it('does not call remove when there are no orphaned entries', async () => {
    storageData['200'] = { ...DEFAULT_TAB_STATE };
    chromeMock.tabs.query.mockResolvedValueOnce([{ id: 200 }]);

    await cleanupOrphanedTabStates();

    expect(chromeMock.storage.local.remove).not.toHaveBeenCalled();
  });

  it('clears orphaned keys from the in-memory cache', async () => {
    storageData['300'] = { ...DEFAULT_TAB_STATE, borderMode: true };
    await getTabState(300); // warm the cache

    chromeMock.tabs.query.mockResolvedValueOnce([]); // tab 300 no longer open
    await cleanupOrphanedTabStates();

    jest.clearAllMocks();
    storageData['300'] = { ...DEFAULT_TAB_STATE, borderMode: false };
    const state = await getTabState(300);
    // If cache was cleared, storage must have been read again
    expect(chromeMock.storage.local.get).toHaveBeenCalledTimes(1);
    expect(state.borderMode).toBe(false);
  });

  it('ignores non-numeric storage keys (global settings)', async () => {
    storageData['storageVersion'] = 1;
    storageData['borderStyle'] = 'dashed';
    chromeMock.tabs.query.mockResolvedValueOnce([]);

    await cleanupOrphanedTabStates();

    expect(chromeMock.storage.local.remove).not.toHaveBeenCalled();
  });
});
