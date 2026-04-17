import { localeMap } from 'popup/locales';

const locales = Object.keys(localeMap) as (keyof typeof localeMap)[];
const enKeys = Object.keys(localeMap.en);

describe('localeMap', () => {
  it('includes English', () => {
    expect(localeMap).toHaveProperty('en');
  });

  it('contains all expected locales', () => {
    expect(locales).toEqual(expect.arrayContaining(['en', 'es', 'fr', 'de', 'ja']));
  });

  locales.forEach(locale => {
    describe(`locale: ${locale}`, () => {
      it('has all English translation keys', () => {
        const localeKeys = Object.keys(localeMap[locale]);
        enKeys.forEach(key => {
          expect(localeKeys).toContain(key);
        });
      });

      it('has no empty message values', () => {
        Object.entries(localeMap[locale]).forEach(([, entry]) => {
          expect(entry.message.trim()).not.toBe('');
        });
      });
    });
  });
});
