import {readFileSync} from 'node:fs';
import base from '../../vitest.config.ts';
const replacements=new Map([['/apps/api/src/private-topic-preferences.ts','private-topic-preferences.ts'],['/apps/api/src/private-topic-preferences.test.ts','private-topic-preferences.test.ts']]);
export default {...base,plugins:[{name:'excluded-prospective-source',enforce:'pre',load(id){for(const [suffix,file]of replacements)if(id.replaceAll('\\','/').endsWith(suffix))return readFileSync(new URL(file,import.meta.url),'utf8');}}],test:{...base.test,include:['apps/api/src/private-topic-preferences.test.ts']}};
