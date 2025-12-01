/**
 * Represents the state for a tab (border and inspector modes).
 *
 * @property borderMode - Indicates if border mode is enabled.
 * @property inspectorMode - Indicates if inspector mode is enabled.
 */
export type TabState = {
  borderMode: boolean;
  inspectorMode: boolean;
};

/**
 * Options for handling tab state changes.
 *
 * @property tabId - The ID of the tab.
 * @property states - Partial state object to merge (e.g., { borderMode: true }).
 */
export interface TabStateChangeOptions {
  tabId: number;
  states?: Partial<TabState>;
}
