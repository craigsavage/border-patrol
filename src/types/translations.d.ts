/** Locale codes supported by the extension. */
export type LocaleCode = 'en' | 'es';

/** Type definition for translation messages. */
export type MessagesType = {
  [key: string]: {
    message: string;
    description: string;
  };
};
