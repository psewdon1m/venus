/** Small fake sealed archive only: no consumer/selector/server execution. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {durableSink} from '../p05-pilot-corpus-ranges03/raw/durable-sink.mjs';
import {loadInputs,rangeRecords} from '../p05-pilot-corpus-ranges03/replay-input.mjs';
import {validateRange} from '../p05-pilot-corpus-ranges03/range-plan.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),owner='a'.repeat(32),range=validateRange('c2-canary',0,336),root=fs.mkdtempSync(path.join(os.tmpdir(),'venus-range-footer-independent-'));
try{
 const binding={source_identity:'1'.repeat(64),image:'sha256:'+'2'.repeat(64),pack_digest:'pack',map_pins:{}},bindingRaw=Buffer.from(JSON.stringify(binding)),preregRaw=Buffer.from('{}'),review='3'.repeat(64),sink=durableSink(path.join(root,'raw'),{owner,guard(){},payloadLimit:1024**2});
 for(let ordinal=0;ordinal<336;ordinal++)sink.append('corpus-case',{section:range.section,ordinal,result:{fake:true},elapsed_ms:0},{group:range.section,cell:String(ordinal)});
 const summary={status:'RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE',range,completed:336,typed_refusals:0,elapsed_ms:1,owner,source_identity:binding.source_identity,image:binding.image,binding_sha256:hash(bindingRaw),prereg_sha256:hash(preregRaw),method_review_sha256:review,approval_scope:'OWNER_PROVISIONAL_LOCAL_PILOT',pack_digest:'pack',map_pins:{},full_section_PASS:false,full_P05_PASS:false};
 const terminal={...summary,source_identity:'WRONG_SOURCE',image:'WRONG_IMAGE',binding_sha256:'WRONG_BINDING',method_review_sha256:'WRONG_REVIEW',pack_digest:'WRONG_PACK'};
 const sealed=await sink.finish(terminal);summary.raw=sealed;const bytes=Buffer.from(JSON.stringify(summary));fs.writeFileSync(path.join(root,'summary.json'),bytes);
 const input={root,owner,range,index_sha256:sealed.index_sha256,summary_sha256:hash(bytes)},manifest={schema:1,section:range.section,binding_sha256:hash(bindingRaw),prereg_sha256:hash(preregRaw),method_review_sha256:review,inputs:[input]};
 loadInputs(manifest,bindingRaw,preregRaw);assert.throws(()=>[...rangeRecords(input)],error=>error.code==='ERR_ASSERTION'&&error.message.includes('SEALED_TERMINAL_SUMMARY_MISMATCH'));
 console.log(JSON.stringify({status:'PASS_INDEPENDENT_COUNTEREXAMPLE_NOW_REJECTED',finding:'P05-RANGE-REPLAY-002',fake_cases:336,actual470_cases:0,selector_or_Docker_DB_calls:0}));
}finally{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('venus-range-footer-independent-'));fs.rmSync(root,{recursive:true,force:true});}
