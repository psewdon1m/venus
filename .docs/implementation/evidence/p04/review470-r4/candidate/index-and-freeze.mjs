/** Freeze only owned r4 metadata/history; no runtime or source-stage manifest. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {digest} from '../../../../../../packages/relationship-engine/dist/index.js';
const e='.docs/implementation/evidence/p04/review470-r4',sha=b=>createHash('sha256').update(b).digest('hex'),cards=fs.readdirSync(e+'/candidate/cards').filter(n=>n.endsWith('.json')).sort().map(n=>{const p=e+'/candidate/cards/'+n,raw=fs.readFileSync(p),c=JSON.parse(raw);return{id:c.id,revision:c.revision,mode:c.mode,path:p,raw_sha256:sha(raw),canonical_sha256:digest(c),text_sha256:digest(c.text),provenance_sha256:digest(c.authoring),metadata_changed:c.interaction==='pair_private',human_approved:false};});
const catalog_digest=digest(cards.map(c=>({id:c.id,revision:c.revision,sha256:c.canonical_sha256})));assert.equal(catalog_digest,'dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270');
const scripts=fs.readdirSync(e+'/candidate').filter(n=>n.endsWith('.mjs')).sort().map(n=>({path:e+'/candidate/'+n,sha256:sha(fs.readFileSync(e+'/candidate/'+n))}));
for(const[n,v]of [['source-index470.json',{schema_version:1,status:'DRAFT_R4_METADATA_ONLY_NOT_APPROVED',catalog_digest,cards,runtime_activation:false}],['current-input-freeze.json',{schema_version:1,status:'AUTHOR_READY_METADATA_REQUIRES_INDEPENDENT_REVIEW',catalog_digest,card_files:cards.map(c=>({path:c.path,sha256:c.raw_sha256})),author_scripts:scripts,ledger_path:e+'/authoring/candidate.sqlite',ledger_sha256:sha(fs.readFileSync(e+'/authoring/candidate.sqlite')),changed:143,raw_unchanged:327,text_changes:0,final_new_source_Docker_C2:'PENDING_ROOT',human_approval:false}]])fs.writeFileSync(e+'/'+n,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cards:cards.length,catalog_digest,scripts:scripts.length}));
