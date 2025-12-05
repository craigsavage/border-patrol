import enMessages from '../../_locales/en/messages.json';
import esMessages from '../../_locales/es/messages.json';
import { useLocaleContext } from '../context/LocaleContext';
import { LocaleCode, MessagesType } from '../../types/translations';

// Map of locale codes to their respective message objects
const localeMap: Record<LocaleCode, MessagesType> = {
  en: enMessages,
  es: esMessages,
};

/**
 * Custom hook to provide translation functionality based on the current locale.
 *
 * @returns An object containing the translate function.
 */
export function useTranslation() {
  const { locale } = useLocaleContext();
  const messages = localeMap[locale] || enMessages;

  /**
   * Translate a given key to the current locale.
   *
   * @param key - The message key to translate.
   * @param variables - Optional variables to interpolate into the message.
   * @returns The translated message string.
   */
  function translate(key: string, variables?: Record<string, string>): string {
    let msg = messages[key]?.message || key;

    // Replace variables in the message if provided
    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        const placeholder = `{${varKey}}`;
        msg = msg.replace(new RegExp(placeholder, 'g'), varValue);
      });
    }

    return msg;
  }

  return { translate };
}
