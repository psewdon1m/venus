/** Only pinned synthetic source/clock composition differs from ordinary startup. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {sha,verifyCompiled,imageModule} from './image-modules.mjs';
const producer=dirname(fileURLToPath(import.meta.url));
function replace(text,before,after,proof){assert.equal(text.split(before).length,2,'EXACT_SINGLE_ADAPTATION_REQUIRED');proof.push({before_sha256:sha(before),after_sha256:sha(after)});return text.replace(before,after);}
export function checkedConfig(c){assert.equal(process.platform,'linux');assert(/^[a-f0-9]{32}$/.test(c.owner));assert(['A1','B2','A3'].includes(c.phase));assert.equal(c.privateRoot,'/private');assert.equal(c.directory,'/authority');assert.equal(c.keyringFile,'/private/keyring.json');assert.equal(c.stateFile,'/private/state.json');assert.equal(c.guardFile,'/control/bound-profile.json');assert.equal(c.origin,'https://localhost:8443');assert.equal(c.now,{A1:1000000,B2:1001000,A3:1002000}[c.phase]);for(const p of ['/private','/authority','/evidence','/control']){assert.equal(resolve(p),p);assert(lstatSync(p).isDirectory()&&!lstatSync(p).isSymbolicLink());}for(const p of [c.keyringFile]){const s=lstatSync(p);assert(s.isFile()&&!s.isSymbolicLink()&&s.uid===1000&&(s.mode&0o077)===0);}return c;}
export async function composition(config,binding,lease){checkedConfig(config);const compiled=binding.per_image_compiled[config.phase==='B2'?'B':'A'];verifyCompiled(compiled);const pins=JSON.parse(readFileSync(join(producer,'dependency-pins.json'))),raw=name=>{const row=pins.find(r=>r.source===name);assert(row);const b=readFileSync(join(producer,row.copy));assert.equal(sha(b),row.sha256);return b.toString('utf8');},generated=join(config.privateRoot,'modules-'+config.phase),proof=[];assert(!existsSync(generated));lease.assert(1048576);mkdirSync(generated,{mode:0o700});
 const put=(name,text)=>{const path=join(generated,name);assert(!existsSync(path));lease.assert(Buffer.byteLength(text));writeFileSync(path,text,{flag:'wx',mode:0o600});return path;};
 const absolute=text=>text.replaceAll("'../../apps/api/dist/","'/app/apps/api/dist/").replaceAll("'../../packages/relationship-engine/dist/","'/app/packages/relationship-engine/dist/");
 const p03=put('p03-fixtures.mjs',raw('tests/p03/fixtures.mjs'));
 const context=put('context-fixture.mjs',replace(raw('tests/p05-topic-games/context-fixture.mjs'),"'../p03/fixtures.mjs'",JSON.stringify(p03),proof));
 const fixture=put('fixtures.mjs',replace(absolute(raw('tests/p05-topic-games/fixtures.mjs')),"'./context-fixture.mjs'",JSON.stringify(context),proof));
 const observation=put('observations.mjs',absolute(raw('.artifacts/p05-topic-restore/observations.mjs')));
 const replay=put('replay-observations.mjs',replace(absolute(raw('.artifacts/p05-topic-restore/replay-observations.mjs')),"'./observations.mjs'",JSON.stringify(observation),proof));
 let text=absolute(raw('tests/p05-topic-lifecycle/harness.mjs'));
 text=replace(text,"import pg from 'pg';","import pg from '/app/node_modules/pg/lib/index.js';",proof);
 text=replace(text,"'../p05-topic-games/fixtures.mjs'",JSON.stringify(fixture),proof);
 text=replace(text,'export function harness(){','export function harness(config){',proof);
 text=replace(text,"mkdtempSync(join(tmpdir(),'venus-topic-lifecycle-'))",'config.directory',proof);
 text=replace(text,"new Keyring('test',{test:randomBytes(32).toString('base64')})",'Keyring.fromFile(config.keyringFile)',proof);
 text=replace(text,'mkdirSync(p,0o700);return[n,p];',"assert(existsSync(p),'Preprovisioned protected root required');return[n,p];",proof);
 text=replace(text,'let now=1000000,app,origin,queryHook=null;','let now=config.now,app,origin=config.origin,queryHook=null;',proof);
 text=replace(text,"origin:'http://unbound.invalid'",'origin:config.origin',proof);
 const listen=text.split('\n').find(l=>l.includes('async function listen(){'));assert(listen);
 text=replace(text,listen," async function listen(){app=await createApp({rooms,games:legacy,topicGames:topics,privateTopics:preferences,roomCreationProtocol:2,logger:false,probe:config.probe,version:config.version,staticRoot:'/app/apps/web/dist'});await app.listen({host:'0.0.0.0',port:4300});rooms.options.origin=config.origin;}",proof);
 const call=text.split('\n').find(l=>l.includes('async function call(actor,path,method='));assert(call);
 text=replace(text,call," async function call(actor,path,method='GET',body){return jsonCall(config,actor,path,method,body,headers(actor,method!=='GET'));}",proof);
 text="import {jsonCall} from "+JSON.stringify(join(producer,'http-client.mjs'))+";\n"+text;
 const cleanup=text.split('\n').find(l=>l.includes('async function cleanup(){'));assert(cleanup);
 text=replace(text,cleanup,' async function close(){await app?.close();await pool.end();}',proof);
 text=replace(text,'withFault,cleanup,loadObject:','withFault,close,loadObject:',proof);
 const module=await import(pathToFileURL(put('harness.mjs',text)).href),h=module.harness(config),obs=await import(pathToFileURL(observation).href),effects=await import(pathToFileURL(replay).href);
 const migration=await Promise.all(['migrations','game-migrations','catalog-migrations','chat-migrations','private-topic-migrations'].map(n=>imageModule('apps/api/dist/'+n+'.js',compiled['apps/api/dist/'+n+'.js'])));
 config.probe=async()=>{await migration[0].schemaProbe(h.pool);await migration[1].engineSchemaProbe(h.pool);await migration[2].catalogSchemaProbe(h.pool);await migration[3].chatSchemaProbe(h.pool);await migration[4].privateTopicSchemaProbe(h.pool);};
 return{h,obs,effects,adaptations:proof,generated_source_sha256:sha(text),async migrate(){for(const[m,name]of migration.map((m,i)=>[m,['migrate','migrateGames','migrateCatalog','migrateChat','migratePrivateTopics'][i]]))await m[name](h.pool);await config.probe();},async close(){await h.close();}};
}
