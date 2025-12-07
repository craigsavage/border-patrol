import { MoonFilled, SunFilled } from '@ant-design/icons';
import { useTranslation } from '../hooks/useTranslation';
import { useDarkModeContext } from '../context/DarkModeContext';

const iconStyle: React.CSSProperties = {
  color: 'var(--bp-gray)',
  fontSize: '1.1rem',
  cursor: 'pointer',
};

/** DarkModeToggle component for toggling dark mode. */
export default function DarkModeToggle(): React.ReactElement {
  const { translate } = useTranslation();
  const { isDarkMode, handleToggleDarkMode } = useDarkModeContext();

  return (
    <>
      {isDarkMode ? (
        <SunFilled
          style={iconStyle}
          onClick={() => handleToggleDarkMode(false)}
          aria-label={translate('switchToLightMode')}
          role='button'
        />
      ) : (
        <MoonFilled
          style={iconStyle}
          onClick={() => handleToggleDarkMode(true)}
          aria-label={translate('switchToDarkMode')}
          role='button'
        />
      )}
    </>
  );
}
