import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_LOCALE } from '../../scripts/constants';
import {
  LocaleCode,
  ILocaleContext,
  ILocaleProviderProps,
} from '../../types/translations';

/** Key used to store the user's preferred locale in Chrome storage. */
export const LOCALE_STORAGE_KEY = 'bp_user_locale';

/** List of supported locales for the extension. */
export const SUPPORTED_LOCALES: LocaleCode[] = ['en', 'es'];

// Create the context for locale management
const LocaleContext = createContext<ILocaleContext>({
  locale: 'en',
  changeLocale: (locale: LocaleCode) => {},
});

/**
 * Custom hook to access the LocaleContext
 *
 * @returns The current locale context value.
 */
export function useLocaleContext(): ILocaleContext {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }

  return context;
}

/**
 * Custom hook to manage and provide locale state.
 *
 * @returns The current locale context value.
 */
export function useLocale(): ILocaleContext {
  // Normalize browser language to base code (e.g., 'en-US' -> 'en')
  const browserLang = chrome.i18n.getUILanguage().split('-')[0] as LocaleCode;
  const defaultLocale = SUPPORTED_LOCALES.includes(browserLang)
    ? browserLang
    : DEFAULT_LOCALE;
  const [locale, setLocale] = useState<LocaleCode>(defaultLocale);

  useEffect(() => {
    // Logic to load saved locale from storage can be added here
    const loadLocale = async () => {
      const { [LOCALE_STORAGE_KEY]: savedLocale } =
        await chrome.storage.local.get(LOCALE_STORAGE_KEY);

      // Check if the saved locale is supported before setting it
      if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
        setLocale(savedLocale);
      }
    };
    loadLocale();
  }, []);

  /**
   * Change the current locale.
   *
   * @param newLocale - The new locale code to set.
   */
  function changeLocale(newLocale: LocaleCode): void {
    // Check if the new locale is supported before changing
    if (!SUPPORTED_LOCALES.includes(newLocale)) {
      console.warn(`Unsupported locale: ${newLocale}`);
      return;
    }

    // Save the new locale to storage and update state
    setLocale(newLocale);
    chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: newLocale });
  }

  return { locale, changeLocale };
}

/**
 * LocaleProvider component to provide locale context to its children.
 *
 * @param children - The child components to render within the LocaleProvider.
 * @returns The LocaleProvider component.
 */
export function LocaleProvider({
  children,
}: ILocaleProviderProps): React.ReactElement {
  const { locale, changeLocale } = useLocale();

  return (
    <LocaleContext.Provider value={{ locale, changeLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
