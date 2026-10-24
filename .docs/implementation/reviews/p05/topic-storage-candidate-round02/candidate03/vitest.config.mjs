import {readFileSync} from 'node:fs';
import base from '../../vitest.config.ts';
const replacements=new Map([['/apps/api/src/private-topic-preferences.ts','private-topic-preferences.ts'],['/apps/api/src/private-topic-preferences.test.ts','private-topic-preferences.test.ts']]);
export default {...base,cacheDir:'.artifacts/p05-storage-availability-candidate03/vite-cache',plugins:[{name:'excluded-prospective-source',enforce:'pre',load(id){for(const [suffix,file]of replacements)if(id.replaceAll('\\','/').endsWith(suffix))return readFileSync(new URL(file,new URL('./.artifacts/p05-storage-availability-candidate03/', 'file:///'+process.cwd().replaceAll('\\','/')+'/')),'utf8');}}],test:{...base.test,include:['apps/api/src/private-topic-preferences.test.ts']}};
