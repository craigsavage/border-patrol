import enMessages from '../_locales/en/messages.json';
import esMessages from '../_locales/es/messages.json';
import frMessages from '../_locales/fr/messages.json';
import deMessages from '../_locales/de/messages.json';
import jaMessages from '../_locales/ja/messages.json';
import type { LocaleCode, MessagesType } from '../types/translations';

export const localeMap: Record<LocaleCode, MessagesType> = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  de: deMessages,
  ja: jaMessages,
};
