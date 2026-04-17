import { LocaleCode } from 'types/translations';

jest.mock('popup/context/LocaleContext', () => ({
  useLocaleContext: jest.fn(),
}));

import { useLocaleContext } from 'popup/context/LocaleContext';
import { useTranslation } from 'popup/hooks/useTranslation';

const mockLocale = (locale: LocaleCode) => {
  (useLocaleContext as jest.Mock).mockReturnValue({ locale, changeLocale: jest.fn() });
};

describe('useTranslation', () => {
  it('returns English translations when locale is en', () => {
    mockLocale('en');
    const { translate } = useTranslation();
    expect(translate('enabled')).toBe('On');
    expect(translate('disabled')).toBe('Off');
  });

  it('returns Japanese translations when locale is ja', () => {
    mockLocale('ja');
    const { translate } = useTranslation();
    expect(translate('enabled')).toBe('オン');
    expect(translate('disabled')).toBe('オフ');
  });

  it('returns German translations when locale is de', () => {
    mockLocale('de');
    const { translate } = useTranslation();
    expect(translate('enabled')).toBe('Ein');
    expect(translate('disabled')).toBe('Aus');
  });

  it('returns Spanish translations when locale is es', () => {
    mockLocale('es');
    const { translate } = useTranslation();
    expect(translate('enabled')).toBe('Activado');
    expect(translate('disabled')).toBe('Desactivado');
  });

  it('returns French translations when locale is fr', () => {
    mockLocale('fr');
    const { translate } = useTranslation();
    expect(translate('enabled')).toBe('Activé');
    expect(translate('disabled')).toBe('Désactivé');
  });

  it('falls back to the key name for unknown keys', () => {
    mockLocale('en');
    const { translate } = useTranslation();
    expect(translate('nonExistentKey')).toBe('nonExistentKey');
  });

  it('interpolates variables into the message', () => {
    mockLocale('en');
    const { translate } = useTranslation();
    const result = translate('currentVersion', { version: '2.0.0' });
    expect(result).toContain('2.0.0');
  });
});
