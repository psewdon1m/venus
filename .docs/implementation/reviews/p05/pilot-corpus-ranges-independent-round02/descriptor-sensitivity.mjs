import assert from 'node:assert/strict';
import {assertBoundDescriptor} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-corpus-ranges02/range-reduce.mjs';
import {caseAt} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-corpus-ranges02/m3/descriptor.mjs';
let checks=0;
for(const section of ['invariants','fairness','gf','inference']){const outer='m3-'+section;assertBoundDescriptor(outer,{section:outer,ordinal:1,result:{descriptor:caseAt(section,1)}});checks++;assert.throws(()=>assertBoundDescriptor(outer,{section:outer,ordinal:1,result:{descriptor:caseAt(section,0)}}),e=>e.message.includes('DESCRIPTOR_OUTER_ORDINAL_MISMATCH'));checks++;}
console.log(JSON.stringify({status:'PASS_ALL_FOUR_SECTION_OUTER_DESCRIPTOR_SENSITIVITIES',checks,actual470cases:0,selectors:0,Docker_RUN:false}));
