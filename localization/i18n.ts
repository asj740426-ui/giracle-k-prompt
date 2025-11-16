

import { translations } from './translations';

export type Language = 'ko' | 'en';

// Helper function to navigate nested object with dot notation
const getNestedTranslation = (language: Language, key: string): any => {
  const keys = key.split('.');
  let result: any = translations[language];
  for (const k of keys) {
    if (typeof result === 'object' && result !== null && k in result) {
      result = result[k];
    } else {
      return undefined;
    }
  }
  return result;
};

export const t = (key: string, lang: Language, ...args: any[]): string => {
  let stringOrFunc = getNestedTranslation(lang, key);
  
  // Fallback to English if translation is missing
  if (stringOrFunc === undefined) {
    stringOrFunc = getNestedTranslation('en', key);
  }

  if (stringOrFunc === undefined) {
    console.warn(`Translation not found for key: ${key}`);
    return key; // Return the key itself as a fallback
  }

  if (typeof stringOrFunc === 'function') {
    return String(stringOrFunc(...args));
  }

  if (typeof stringOrFunc === 'string') {
    return stringOrFunc;
  }
  
  console.warn(`Translation for key '${key}' in language '${lang}' is not a string or function.`);
  return key;
};