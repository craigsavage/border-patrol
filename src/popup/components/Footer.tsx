import { Layout, Select, Typography } from 'antd';
import DarkModeToggle from './DarkModeToggle';
import { useLocaleContext } from '../context/LocaleContext';
import { useTranslation } from '../hooks/useTranslation';
import { LocaleCode } from '../../types/translations';

const { Link } = Typography;

const footerStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  width: '100%',
};

// Placeholder for version, will be replaced during build
const version = __BP_APP_VERSION__;

/**
 * Footer component for the popup.
 * Displays the Border Patrol website link and version number.
 */
export default function Footer(): React.ReactElement {
  const { locale, changeLocale } = useLocaleContext();
  const { translate } = useTranslation();

  return (
    <Layout.Footer style={footerStyle}>
      <Select
        defaultValue='en'
        style={{ color: 'var(--bp-gray)', justifySelf: 'start' }}
        size='small'
        value={locale}
        onChange={value => changeLocale(value as LocaleCode)}
        aria-label={translate('selectLanguage')}
        options={[
          { value: 'en', label: 'EN' },
          { value: 'es', label: 'ES' },
        ]}
      />

      <Link
        href='https://craigsavage.github.io/border-patrol/'
        target='_blank'
        aria-label={translate('borderPatrolWebsite')}
        style={{ color: 'var(--bp-gray)', justifySelf: 'center' }}
      >
        <span className='version' aria-label={translate('currentVersion')}>
          v{version}
        </span>
      </Link>

      <div style={{ justifySelf: 'end' }}>
        <DarkModeToggle />
      </div>
    </Layout.Footer>
  );
}
