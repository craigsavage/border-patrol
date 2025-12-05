import { MoonFilled, SunFilled } from '@ant-design/icons';
import { DarkModeToggleProps } from '../../types/popup/components';
import { useTranslation } from '../hooks/useTranslation';

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
  const { translate } = useTranslation();

  return (
    <>
      {isDarkMode ? (
        <SunFilled
          style={iconStyle}
          onClick={() => onToggleDarkMode(false)}
          aria-label={translate('switchToLightMode')}
          role='button'
        />
      ) : (
        <MoonFilled
          style={iconStyle}
          onClick={() => onToggleDarkMode(true)}
          aria-label={translate('switchToDarkMode')}
          role='button'
        />
      )}
    </>
  );
}
