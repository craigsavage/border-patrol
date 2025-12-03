import { MoonFilled, SunFilled } from '@ant-design/icons';
import { DarkModeToggleProps } from '../../types/popup/components';

const iconStyle: React.CSSProperties = {
  color: 'var(--bp-gray)',
  fontSize: '1.1rem',
  cursor: 'pointer',
};

/** DarkModeToggle component for toggling dark mode. */
export default function DarkModeToggle({
  isDarkMode,
  onToggleDarkMode,
}: DarkModeToggleProps): React.ReactElement {
  return (
    <>
      {isDarkMode ? (
        <SunFilled
          style={iconStyle}
          onClick={() => onToggleDarkMode(false)}
          aria-label='Switch to light mode'
          role='button'
        />
      ) : (
        <MoonFilled
          style={iconStyle}
          onClick={() => onToggleDarkMode(true)}
          aria-label='Switch to dark mode'
          role='button'
        />
      )}
    </>
  );
}
