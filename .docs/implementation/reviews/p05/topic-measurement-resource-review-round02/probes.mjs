import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
const out=dirname(fileURLToPath(import.meta.url));
const module=resolve('.docs/implementation/reviews/p05/topic-measurement-resource-preparation-02/resource/artifact-store-v2.mjs');
const {ArtifactStore,portableArtifactName}=await import(pathToFileURL(module));
if(process.argv.includes('--no-enumerator')){process.env.PATH='';assert.throws(()=>new ArtifactStore(process.argv.at(-1)));console.log('FAILCLOSED_NO_ENUMERATOR');process.exit(0);}
const owned=fs.mkdtempSync(join(tmpdir(),'venus-independent-store-')),results=[];
function control(name,fn){try{fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',detail:e.message});}}
function reject(fn){assert.throws(fn);}
const junction=(target,link)=>{fs.symlinkSync(target,link,'junction');assert(fs.lstatSync(link).isSymbolicLink());};
try {
control('regular-nested-existing-budget-and-overwrite',()=>{const root=join(owned,'normal');fs.mkdirSync(root);fs.writeFileSync(join(root,'prior'),'123');const s=new ArtifactStore(root,{limit:9});s.write('a/b','123456');assert.equal(s.bytes,9);reject(()=>s.write('a/b','X'));reject(()=>s.write('overflow','X'));assert(!fs.existsSync(join(root,'overflow')));});
control('lexical-absolute-parent-escape',()=>{const s=new ArtifactStore(join(owned,'scope'));for(const n of ['../outside',join(owned,'outside'),'.',''])reject(()=>s.write(n,'x'));});
control('initial-root-junction',()=>{const target=join(owned,'target1'),root=join(owned,'jroot');fs.mkdirSync(target);junction(target,root);reject(()=>new ArtifactStore(root));assert.deepEqual(fs.readdirSync(target),[]);fs.unlinkSync(root);});
control('initial-ancestor-junction',()=>{const target=join(owned,'target2'),root=join(owned,'jparent');fs.mkdirSync(target);junction(target,root);reject(()=>new ArtifactStore(join(root,'child')));assert.deepEqual(fs.readdirSync(target),[]);fs.unlinkSync(root);});
control('post-init-nested-junction',()=>{const target=join(owned,'target3'),root=join(owned,'late');fs.mkdirSync(target);const s=new ArtifactStore(root);junction(target,join(root,'child'));reject(()=>s.write('child/out','x'));assert.deepEqual(fs.readdirSync(target),[]);fs.unlinkSync(join(root,'child'));});
control('post-init-root-junction',()=>{const target=join(owned,'target4'),root=join(owned,'late-root');fs.mkdirSync(target);const s=new ArtifactStore(root);fs.renameSync(root,root+'-old');junction(target,root);reject(()=>s.write('out','x'));assert.deepEqual(fs.readdirSync(target),[]);fs.unlinkSync(root);});
control('regular-directory-identity-replacement',()=>{const root=join(owned,'identity'),s=new ArtifactStore(root);s.write('a/first','a');fs.renameSync(join(root,'a'),join(root,'a-old'));fs.mkdirSync(join(root,'a'));reject(()=>s.write('a/second','x'));assert.deepEqual(fs.readdirSync(join(root,'a')),[]);});
control('existing-and-late-final-file-symlinks',()=>{const root=join(owned,'filelinks'),target=join(owned,'targetfile');fs.writeFileSync(target,'original');const s=new ArtifactStore(root);fs.symlinkSync(target,join(root,'link'),'file');reject(()=>s.write('other','x'));reject(()=>new ArtifactStore(root));assert.equal(fs.readFileSync(target,'utf8'),'original');fs.unlinkSync(join(root,'link'));});
control('regular-file-root-rejected',()=>{const root=join(owned,'file-root');fs.writeFileSync(root,'x');reject(()=>new ArtifactStore(root));});
control('external-file-budget-growth-recounted',()=>{const root=join(owned,'recount'),s=new ArtifactStore(root,{limit:3});fs.writeFileSync(join(root,'external'),'123');reject(()=>s.write('new','x'));assert(!fs.existsSync(join(root,'new')));});
control('windows-ADS-byte-budget',()=>{assert.equal(process.platform,'win32');const root=join(owned,'ads'),s=new ArtifactStore(root,{limit:5});let refused=false;try{s.write('base:secret','12345');s.write('base:other','12345');}catch{refused=true;}const streams=['secret','other'].filter(n=>fs.existsSync(join(root,'base:'+n)));const raw=streams.map(n=>fs.readFileSync(join(root,'base:'+n),'utf8'));assert(refused&&raw.join('').length<=5,'accepted hidden ADS bytes='+raw.join('').length+' regular-count='+s.bytes);});

control('portable-names-before-filesystem',()=>{for(const name of ['a:stream','NUL','con.json','COM1','LPT9.log','a\\b','a/../b','a/./b','/abs','trailing.','trailing ','a//b','//server/share','C:/outside','a\u0000b','é','x'.repeat(129)])reject(()=>portableArtifactName(name));for(const n of ['public/000001.ndjson.gz','a_b-c.123','report.json'])assert.equal(portableArtifactName(n),n);});
control('preexisting-actual-file-ADS-rejected',()=>{const root=join(owned,'initial-ads');fs.mkdirSync(root);fs.writeFileSync(join(root,'base'),'');fs.writeFileSync(join(root,'base:secret'),'12345');assert.equal(fs.statSync(join(root,'base')).size,0);assert.equal(fs.readFileSync(join(root,'base:secret'),'utf8'),'12345');reject(()=>new ArtifactStore(root,{limit:5}));});
control('post-init-actual-file-ADS-rejected-before-write',()=>{const root=join(owned,'late-ads'),s=new ArtifactStore(root,{limit:5});s.write('base','');fs.writeFileSync(join(root,'base:secret'),'12345');reject(()=>s.write('next','x'));assert(!fs.existsSync(join(root,'next')));});
control('preexisting-actual-root-directory-ADS-rejected',()=>{const root=join(owned,'root-ads');fs.mkdirSync(root);fs.writeFileSync(root+':secret','12345');assert.equal(fs.readFileSync(root+':secret','utf8'),'12345');reject(()=>new ArtifactStore(root));});
control('post-init-actual-nested-directory-ADS-rejected',()=>{const root=join(owned,'nested-ads'),s=new ArtifactStore(root);s.write('child/base','');fs.writeFileSync(join(root,'child')+':secret','12345');assert.equal(fs.readFileSync(join(root,'child')+':secret','utf8'),'12345');reject(()=>s.write('next','x'));assert(!fs.existsSync(join(root,'next')));});
control('missing-enumerator-failclosed',()=>{const root=join(owned,'missing-enumerator');fs.mkdirSync(root);const c=spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--no-enumerator',root],{encoding:'utf8',timeout:15000});assert.equal(c.status,0,c.stderr);assert(c.stdout.includes('FAILCLOSED_NO_ENUMERATOR'));assert.deepEqual(fs.readdirSync(root),[]);});
} finally {assert.equal(dirname(resolve(owned)),resolve(tmpdir()));fs.rmSync(owned,{recursive:true});}
const report={scope:'INDEPENDENT_EXACT_WRITER_ONLY',module,platform:process.platform,controls:results,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,statistical_RUN:false,atomic_hostile_race_proof:false,owned_temp_cleanup:true};fs.writeFileSync(join(out,'probes.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
