import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const root='C:/.projects/venus',out=path.join(root,'.artifacts/p05-ledger-memo-independent01');
fs.mkdirSync(out,{recursive:true});
for(const name of ['security','private-topic-ledger']){
 const source=fs.readFileSync(path.join(root,'apps/api/src',name+'.ts'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 fs.writeFileSync(path.join(out,name+'.js'),compiled);
}
const {Keyring,hash}=await import(pathToFileURL(path.join(out,'security.js')));
const {TopicLedgerCodec,TopicLedgerInspectionMemo}=await import(pathToFileURL(path.join(out,'private-topic-ledger.js')));
const keys={record:Buffer.alloc(32,1).toString('base64'),witness:Buffer.alloc(32,2).toString('base64'),current:Buffer.alloc(32,3).toString('base64')};
const pins={taxonomy:'a'.repeat(64),policy:'b'.repeat(64),vocabulary:['music']},incarnation='11111111-1111-4111-8111-111111111111';
const ring=new Keyring('current',keys),codec=new TopicLedgerCodec(ring,pins),recordCodec=new TopicLedgerCodec(new Keyring('record',keys),pins),witnessCodec=new TopicLedgerCodec(new Keyring('witness',keys),pins);
const chain=recordCodec.initialize(incarnation),witness=witnessCodec.witness({incarnation,sequence:1,digest:hash(chain.toString('base64'))});
const memo=new TopicLedgerInspectionMemo(),owner={};let calls=0;
const read=()=>memo.read(owner,chain,witness,ring,pins,1024,()=>{calls++;return codec.inspect(chain,witness);});
try{
 const first=read();assert.equal(read(),first);assert.equal(calls,1);
 const saved=keys.witness;delete keys.witness;
 assert.throws(read,error=>error.code==='KEY_VERSION_UNAVAILABLE');
 keys.witness=saved;const restored=read();assert.notEqual(restored,first);assert.equal(calls,2);
 keys.witness=keys.record;assert.throws(read);keys.witness=saved;read();assert.equal(calls,4);
 console.log('PASS distinct noncurrent witness key removal/replacement invalidates warm state and forces full revalidation');
 const row=read();assert(Object.isFrozen(row)&&Object.isFrozen(row.entries)&&Object.isFrozen(row.entries[0].body)&&Object.isFrozen(row.entries[0].body.vocabulary));
 assert.throws(()=>row.entries[0].body.vocabulary.push('private-canary'));
 assert.deepEqual(codec.latest(read(),{roomId:incarnation,ownerId:incarnation}).excluded,[]);
 console.log('PASS nested genesis vocabulary cannot poison a later warm scope result');
 const byte=chain[100];chain[100]^=1;assert.throws(read);chain[100]=byte;const count=calls;read();assert.equal(calls,count+1);
 console.log('PASS same raw Buffer mutation is hashed fresh and corruption cannot revive previous memo state');
}finally{memo.clear();}
console.log(JSON.stringify({status:'PASS_INDEPENDENT_REAL_CODEC_NEGATIVES',checks:3,native_actions:0,APP_writes:false}));
