import ru from './ru.json' with {type: 'json'};
import en from './en.json' with {type: 'json'};
import tr from './tr.json' with {type: 'json'};
import type {Locale} from '@venus/contracts';
export const dictionaries = {ru, en, tr} satisfies Record<Locale, Record<keyof typeof ru, string>>;
export const locales: Locale[] = ['ru', 'en', 'tr'];
export function dictionary(locale: Locale) {return dictionaries[locale];}
