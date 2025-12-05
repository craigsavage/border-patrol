/** Locale codes supported by the extension. */
export type LocaleCode = 'en' | 'es';

/** Type definition for translation messages. */
export type MessagesType = {
  [key: string]: {
    message: string;
    description: string;
  };
};

/**
 * Interface for the LocaleContext value.
 *
 * @property locale - The current locale code.
 * @property changeLocale - Function to change the current locale.
 */
export interface ILocaleContext {
  locale: LocaleCode;
  changeLocale: (locale: LocaleCode) => void;
}

/**
 * Interface for the LocaleProvider props.
 *
 * @property children - The child components to render within the LocaleProvider.
 */
export interface ILocaleProviderProps {
  children: React.ReactNode;
}
