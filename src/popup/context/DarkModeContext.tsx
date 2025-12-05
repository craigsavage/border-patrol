import { createContext, useContext } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { IChildrenProps } from 'types/popup/components';

// Create the context for dark mode
const DarkModeContext = createContext({
  isDarkMode: false,
  handleToggleDarkMode: (checked: boolean) => {
    throw new Error('DarkModeContext not initialized');
  },
});

/**
 * Custom hook to access the DarkModeContext
 *
 * @returns The current dark mode context value.
 */
export function useDarkModeContext() {
  const context = useContext(DarkModeContext);

  if (!context) {
    throw new Error(
      'useDarkModeContext must be used within a DarkModeProvider'
    );
  }

  return context;
}

/**
 * Dark mode provider component to wrap the application.
 *
 * @param props - Props containing children components.
 * @returns The DarkModeProvider component.
 */
export function DarkModeProvider({
  children,
}: IChildrenProps): React.ReactElement {
  const { isDarkMode, handleToggleDarkMode } = useDarkMode();

  return (
    <DarkModeContext.Provider value={{ isDarkMode, handleToggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}
