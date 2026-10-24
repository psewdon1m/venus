import assert from 'node:assert/strict';
import {readFileSync,realpathSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function checkedImagePath(name){assert(typeof name==='string'&&!name.includes('..')&&!name.startsWith('/')&&/^(apps|packages|tests)\//.test(name));const p=resolve('/app',name);assert(p.startsWith('/app/'));assert.equal(realpathSync(p),p,'IMAGE_MODULE_OVERLAY_OR_LINK');return p;}
export function verifyCompiled(pins){assert.equal(Object.keys(pins).length,64);for(const[name,h]of Object.entries(pins))assert.equal(sha(readFileSync(checkedImagePath(name))),h,name);return true;}
export async function imageModule(name,expected){const p=checkedImagePath(name);if(expected)assert.equal(sha(readFileSync(p)),expected);return import(pathToFileURL(p).href);}
export const imageRequire=()=>createRequire('/app/package.json');
export function actualImageMap(binding){verifyCompiled(binding.compiled_files);const files={...binding.compiled_files};for(const dir of ['apps/api/migrations','apps/api/game-migrations','apps/api/catalog-migrations','apps/api/chat-migrations','apps/api/private-topic-migrations','apps/web/dist/assets'])for(const n of readdirSync(join('/app',dir)).sort()){assert(/^[A-Za-z0-9._-]+$/.test(n));files[dir+'/'+n]=sha(readFileSync(checkedImagePath(dir+'/'+n)));}for(const n of ['apps/web/dist/index.html'])files[n]=sha(readFileSync(checkedImagePath(n)));let metadata=null;if(existsSync('/app/build-metadata.json')){metadata=JSON.parse(readFileSync('/app/build-metadata.json','utf8'));assert(typeof metadata.version==='string'&&typeof metadata.source_revision==='string');files['build-metadata.json']=sha(readFileSync('/app/build-metadata.json'));}return{files,metadata,metadata_absent:metadata===null,compiled64:true};}
