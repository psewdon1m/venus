import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {archiveCache} from '../../tools/delivery-cache.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
function fixture(t){const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'venus-delivery-cache-'));t.after(()=>fs.rmSync(workspace,{recursive:true,force:true}));const root=path.join(workspace,'.artifacts','prior'),sources=path.join(root,'sources');fs.mkdirSync(sources,{recursive:true});const bytes=Buffer.from('verified source bytes'),sha=digest(bytes),url='https://registry.npmjs.org/example/-/example-1.0.0.tgz',file=path.join(sources,sha+'.source'),index=path.join(root,'SOURCE-INDEX.json');fs.writeFileSync(file,bytes);fs.writeFileSync(index,JSON.stringify({format:'VENUS-DISTRIBUTION-SOURCES-1',entries:[{url,bytes:bytes.length,sha256:sha,file:'sources/'+sha+'.source'}]}));return {workspace,bytes,url,file,index};}
test('archive reuse requires exact URL and verified bytes/size/hash',t=>{const x=fixture(t),cache=archiveCache(x.index,x.workspace);assert.equal(cache.read(x.url+'?different',100),null);assert.deepEqual(cache.read(x.url,100),x.bytes);assert.equal(cache.stats.hits,1);fs.writeFileSync(x.file,Buffer.alloc(x.bytes.length,1));assert.equal(cache.read(x.url,100),null);assert.equal(cache.stats.rejected,1);});
test('archive reuse rejects outside-owned indexes and traversal entries',t=>{const x=fixture(t);assert.throws(()=>archiveCache(path.join(x.workspace,'SOURCE-INDEX.json'),x.workspace),/DELIVERY_CACHE_OWNED_PATH/);const data=JSON.parse(fs.readFileSync(x.index));data.entries[0].file='../outside';fs.writeFileSync(x.index,JSON.stringify(data));assert.throws(()=>archiveCache(x.index,x.workspace),/DELIVERY_CACHE_ENTRY/);});
test('archive reuse never follows source symlinks',t=>{const x=fixture(t);fs.unlinkSync(x.file);try{fs.symlinkSync(x.index,x.file,'file');}catch(e){if(e.code==='EPERM'){t.skip('Windows host lacks symlink privilege; Unix CI covers this');return;}throw e;}assert.equal(archiveCache(x.index,x.workspace).read(x.url,100000),null);});
