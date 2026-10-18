import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function checkLocales(root = process.cwd()) {
  const dictionaries = ['ru','en','tr'].map(locale => JSON.parse(readFileSync(resolve(root, `packages/i18n/src/${locale}.json`), 'utf8')));
  const keys = Object.keys(dictionaries[0]).sort().join(',');
  if (dictionaries.some(d => Object.keys(d).sort().join(',') !== keys || Object.values(d).some(v => typeof v !== 'string' || !v.trim()))) throw new Error('Locale keys/values are incomplete');
  console.log('PASS: RU/EN/TR locale keys and nonempty strings');
}
checkLocales(process.argv[2]);
