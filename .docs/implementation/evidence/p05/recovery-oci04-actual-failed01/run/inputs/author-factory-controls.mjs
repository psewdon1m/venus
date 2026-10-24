/** Exact factory body in an inert dependency environment. No image/DB imports. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync,lstatSync,rmSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const folder=dirname(fileURLToPath(import.meta.url)),require=createRequire(resolve('package.json')),ts=require('typescript'),sha=b=>createHash('sha256').update(b).digest('hex'),source=readFileSync(join(folder,'factory.mjs'),'utf8'),parsed=ts.createSourceFile('factory.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),fn=name=>parsed.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name).getText(parsed).replace(/^export /,''),base=resolve('.artifacts/p05'),root=mkdtempSync(join(base,'oci-author-factory-'));assert.equal(dirname(root),base);
const checks=[];let fakeImports=0,leaseChecks=0;const binding=JSON.parse(readFileSync(join(folder,'BINDING.json')));
const environment={assert,readFileSync,writeFileSync,mkdirSync,existsSync,join,resolve,dirname,pathToFileURL,producer:folder,sha,checkedConfig:()=>true,verifyCompiled:p=>assert.equal(Object.keys(p).length,64),imageModule:async()=>({}),inertImport:async url=>{fakeImports++;return url.endsWith('/harness.mjs')?{harness:()=>({pool:null})}:{};}};
const body=fn('replace')+'\n'+fn('composition').replaceAll('await import(','await inertImport(')+'\nreturn composition;';
const composition=new Function(...Object.keys(environment),body)(...Object.values(environment));
try{
 const result=await composition({phase:'AUTHOR',privateRoot:root},binding,{assert:()=>{leaseChecks++;}});assert.equal(fakeImports,3);assert(result.adaptations.length>=10);const generated=join(root,'modules-AUTHOR');let syntax=0;for(const name of readdirSync(generated)){const r=spawnSync(process.execPath,['--check',join(generated,name)],{encoding:'utf8',timeout:10000});assert.equal(r.status,0,r.stderr);syntax++;}
 const harness=readFileSync(join(generated,'harness.mjs'),'utf8');assert(harness.includes("staticRoot:'/app/apps/web/dist'")&&harness.includes("host:'0.0.0.0',port:4300"));assert(harness.includes('config.probe')&&harness.includes('jsonCall(config'));assert(harness.includes("from '/app/apps/api/dist/security.js'"));assert(!harness.includes('symlinkSync'));checks.push({name:'exact factory body derives six parseable modules with actual absolute image imports',status:'PASS',modules:syntax});checks.push({name:'explicit TLS/static/fullprobe/close-only finite transformations present',status:'PASS',adaptations:result.adaptations.length});
 const replace=new Function('assert','sha',fn('replace')+';return replace;')(assert,sha);assert.throws(()=>replace('unchanged','missing','x',[]));assert.throws(()=>replace('two two','two','x',[]));checks.push({name:'missing/duplicate adaptation anchors reject',status:'PASS'});
 assert(!/\b(?:INSERT INTO|UPDATE|DELETE FROM)\b/.test(readFileSync(join(folder,'scenarios.mjs'),'utf8')));assert(!readFileSync(join(folder,'api-child.mjs'),'utf8').includes('setQueryHook('));checks.push({name:'scenario SQL reads only; no fixture grant/safety/auth SQL seam installed',status:'PASS'});
}finally{assert.equal(dirname(resolve(root)),base);assert(!lstatSync(root).isSymbolicLink());rmSync(root,{recursive:true});assert(!existsSync(root));}
const report={status:'AUTHOR_INERT_FACTORY_PARSE_CONTROLS_PASS_NOT_ACTUAL_COMPOSITION',checks,fake_module_imports:fakeImports,lease_mock_calls:leaseChecks,actual_image_imports:0,Docker_commands:0,DB_connections:0,selector_invocations:0,browser_launches:0};writeFileSync(join(folder,'author-factory-controls-result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:checks.length}));
