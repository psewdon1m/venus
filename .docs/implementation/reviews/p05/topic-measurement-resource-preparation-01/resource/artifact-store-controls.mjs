import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,renameSync,existsSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ArtifactStore} from './artifact-store.mjs';
const owned=mkdtempSync(join(tmpdir(),'venus-measurement-resource-review-')),results=[];
function test(name,fn){fn();results.push({name,status:'PASS'});}
test('regular-root-nested-write',()=>{const root=join(owned,'regular'),store=new ArtifactStore(root,{limit:100});store.write('nested/one.txt','inert');assert.equal(readFileSync(join(root,'nested/one.txt'),'utf8'),'inert');assert.equal(store.bytes,5);assert.throws(()=>store.write('nested/one.txt','overwrite'));assert.throws(()=>store.write('../escape.txt','bad'));assert.throws(()=>store.write('large.txt','x'.repeat(96)));assert(!existsSync(join(owned,'escape.txt')));});
test('existing-regular-files-counted',()=>{const root=join(owned,'existing');mkdirSync(root);writeFileSync(join(root,'old'),'123');const store=new ArtifactStore(root,{limit:4});assert.equal(store.bytes,3);store.write('new','x');assert.throws(()=>store.write('overflow','x'));});
const linkType=process.platform==='win32'?'junction':'dir';
test('initial-root-junction-rejected-no-outside-file',()=>{const target=join(owned,'target-root');mkdirSync(target);const root=join(owned,'root-junction');symlinkSync(target,root,linkType);assert.throws(()=>new ArtifactStore(root));assert(!existsSync(join(target,'outside.txt')));});
test('initial-ancestor-junction-rejected',()=>{const target=join(owned,'target-ancestor');mkdirSync(target);const link=join(owned,'ancestor-junction');symlinkSync(target,link,linkType);assert.throws(()=>new ArtifactStore(join(link,'child')));assert(!existsSync(join(target,'child')));});
test('post-init-nested-junction-rejected-before-write',()=>{const root=join(owned,'nested-root'),target=join(owned,'target-nested');mkdirSync(target);const store=new ArtifactStore(root);symlinkSync(target,join(root,'later'),linkType);assert.throws(()=>store.write('later/outside.txt','inert'));assert(!existsSync(join(target,'outside.txt')));});
test('post-init-root-junction-rejected-before-write',()=>{const root=join(owned,'replace-root'),target=join(owned,'target-replace');mkdirSync(target);const store=new ArtifactStore(root);renameSync(root,root+'-original');symlinkSync(target,root,linkType);assert.throws(()=>store.write('outside.txt','inert'));assert(!existsSync(join(target,'outside.txt')));});
test('regular-root-file-rejected',()=>{const file=join(owned,'not-directory');writeFileSync(file,'inert');assert.throws(()=>new ArtifactStore(file));});
const report={status:'NON_GATING_AUTHOR_ACTUAL_FILESYSTEM_RESOURCE_CONTROLS',platform:process.platform,link_type:linkType,owned_test_tree:owned,checks:results,cleanup:'RETAINED_INERT_OWNED_TEMP_TREE_NO_RECURSIVE_DELETE',atomic_hostile_race_proof:false,old61inputs_edited:false};writeFileSync('.artifacts/p05-topic-measurements-next/artifact-store-controls.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
