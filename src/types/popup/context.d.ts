/**
 * Interface for Dark Mode Context.
 *
 * @property isDarkMode - Indicates if dark mode is enabled.
 * @property handleToggleDarkMode - Function to toggle dark mode.
 */
export interface IDarkModeContext {
  isDarkMode: boolean;
  handleToggleDarkMode: (checked: boolean) => Promise<void>;
}
