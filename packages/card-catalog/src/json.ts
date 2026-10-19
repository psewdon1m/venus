/** Strict bounded JSON for untrusted authoring/review files. JSON.parse alone silently
 * accepts duplicate object keys. This lexical pass rejects them at every nesting level. */
import {requireCatalog} from './catalog.js';
export function strictJson(text:string,maxBytes=4*1024*1024):unknown {
  requireCatalog(Buffer.byteLength(text)<=maxBytes&&!text.startsWith('\ufeff'),'CATALOG_JSON_SIZE_OR_BOM');
  let at=0,depth=0;
  const whitespace=()=>{while(/[\x20\t\r\n]/.test(text[at]??'x')) at++;};
  const string=():string=>{
    requireCatalog(text[at]==='"','CATALOG_JSON_STRING');const start=at++;
    while(at<text.length) {const c=text[at++];if(c==='\\') at++;else if(c==='"') {
      const parsed=JSON.parse(text.slice(start,at)) as string;
      requireCatalog(parsed===parsed.normalize('NFC')&&!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(parsed),'CATALOG_JSON_INVALID_UNICODE');return parsed;
    }}
    throw new Error('CATALOG_JSON_UNTERMINATED');
  };
  const value=():void=>{
    whitespace();requireCatalog(++depth<=64,'CATALOG_JSON_DEPTH');const c=text[at];
    if(c==='{') {
      at++;whitespace();const keys=new Set<string>();
      if(text[at]!=='}') while(true) {whitespace();const key=string();requireCatalog(!keys.has(key),'CATALOG_JSON_DUPLICATE_KEY');keys.add(key);whitespace();requireCatalog(text[at++]===':','CATALOG_JSON_COLON');value();whitespace();if(text[at]!==',') break;at++;}
      requireCatalog(text[at++]==='}','CATALOG_JSON_OBJECT');
    } else if(c==='[') {
      at++;whitespace();if(text[at]!==']') while(true) {value();whitespace();if(text[at]!==',') break;at++;}
      requireCatalog(text[at++]===']','CATALOG_JSON_ARRAY');
    } else if(c==='"') string();
    else {const start=at;while(at<text.length&&!/[\s,\]}]/.test(text[at]!)) at++;requireCatalog(at>start,'CATALOG_JSON_VALUE');const parsed:unknown=JSON.parse(text.slice(start,at));requireCatalog(typeof parsed!=='number'||Number.isFinite(parsed),'CATALOG_JSON_NONFINITE');}
    depth--;
  };
  value();whitespace();requireCatalog(at===text.length,'CATALOG_JSON_TRAILING');return JSON.parse(text) as unknown;
}
