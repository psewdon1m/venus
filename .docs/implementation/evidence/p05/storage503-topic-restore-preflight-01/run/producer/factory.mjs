/** AUTHOR excluded fixture derivative. Synthetic source only; actual production classes. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,symlinkSync,lstatSync,rmSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const harnessPin='06fb5638c7af93e6fbf62ca1d842e80ecc3fddb629455f14f4d524f9b57ea4fd';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function checkedPrivateConfig(path){
 assert.equal(process.platform,'linux');assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');
 const file=resolve(path),stat=lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink());assert.equal(stat.mode&0o077,0);assert.equal(stat.uid,process.getuid());
 const config=JSON.parse(readFileSync(file,'utf8'));assert(/^\/tmp\/venus-topic-restore-private-[a-f0-9]+$/.test(config.privateRoot));assert.equal(dirname(file),config.privateRoot);assert.equal(config.directory,join(config.privateRoot,'authority'));assert.equal(config.keyringFile,join(config.privateRoot,'keyring.json'));assert.equal(config.stateFile,join(config.privateRoot,'state.json'));assert([1,2,3].includes(config.phase));assert(Number.isSafeInteger(config.now)&&config.now>=1000000);
 const key=lstatSync(config.keyringFile);assert(key.isFile()&&!key.isSymbolicLink());assert.equal(key.mode&0o077,0);assert.equal(key.uid,process.getuid());return config;
}
export function derivative(original){
 assert.equal(sha(original),harnessPin,'Refuse changed included harness');
 const replacements=[
  ['export function harness(){','export function harness(config){'],
  ["mkdtempSync(join(tmpdir(),'venus-topic-lifecycle-'))",'config.directory'],
  ["new Keyring('test',{test:randomBytes(32).toString('base64')})",'Keyring.fromFile(config.keyringFile)'],
  ['mkdirSync(p,0o700);return[n,p];',"assert(existsSync(p),'Existing controller-provisioned root required');return[n,p];"],
  ['let now=1000000,app,origin,queryHook=null;','let now=config.now,app,origin,queryHook=null;'],
  ["async function cleanup(){await app?.close();await pool.end();const path=resolve(directory);assert(path.startsWith(resolve(tmpdir())+sep)&&path.includes('venus-topic-lifecycle-'));rmSync(path,{recursive:true,force:true});}",'async function close(){await app?.close();await pool.end();}'],
  ['withFault,cleanup,loadObject:','withFault,close,loadObject:'],
 ];
 let text=original.toString('utf8');for(const [before,after]of replacements){assert.equal(text.split(before).length,2,'Each pinned fixture replacement must match exactly once');text=text.replace(before,after);}return {text,proof:{original_sha256:sha(original),derivative_sha256:sha(text),semantic_replacements:replacements.map(([before,after])=>({before,after})),synthetic_content_only:true,production_or_harness_writes:false,auth_or_grant_substitution:false,child_close_preserves_authority:true}};
}
export async function component(configPath,artifactDirectory){
 const config=checkedPrivateConfig(configPath),original=readFileSync('tests/p05-topic-lifecycle/harness.mjs'),{text,proof}=derivative(original),moduleRoot=join(config.privateRoot,'modules-'+config.phase),modulePath=join(moduleRoot,'tests/p05-topic-lifecycle/harness.mjs');
 mkdirSync(dirname(modulePath),{recursive:true,mode:0o700});writeFileSync(modulePath,text,{mode:0o600});for(const name of ['apps','packages','node_modules'])symlinkSync(resolve(name),join(moduleRoot,name),'dir');symlinkSync(resolve('tests/p05-topic-games'),join(moduleRoot,'tests/p05-topic-games'),'dir');
 writeFileSync(join(artifactDirectory,'fixture-proof-phase'+config.phase+'.json'),JSON.stringify(proof,null,2)+'\n');writeFileSync(join(artifactDirectory,'harness-original.mjs'),original);writeFileSync(join(artifactDirectory,'harness-derivative.mjs'),text);
 const m=await import(pathToFileURL(modulePath).href),h=m.harness(config);let closed=false;
 return {config,h,async migrate(){await m.migrate(h.pool);await m.migrateGames(h.pool);await m.migrateChat(h.pool);await m.migratePrivateTopics(h.pool);await m.privateTopicSchemaProbe(h.pool);},async close(){if(closed)return;closed=true;try{await h.close();}finally{assert.equal(dirname(moduleRoot),config.privateRoot);rmSync(moduleRoot,{recursive:true,force:true});}}};
}
