/** Verify derived human handoff against final byte freeze; no authoring writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='.docs/implementation/evidence/p04/review470-r3/candidate',e='.docs/implementation/evidence/p04/review470-r3';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const freeze=load(e+'/current-input-freeze.json'),changes=load(e+'/current-changes139.json').changed;
for(const r of [...freeze.card_files,...freeze.author_scripts])assert.equal(sha(fs.readFileSync(r.path)),r.sha256);
assert.equal(sha(fs.readFileSync(freeze.ledger_path)),freeze.ledger_sha256);
const text=fs.readFileSync(e+'/REVIEW_CHANGED139.md','utf8');
assert.equal([...text.matchAll(/^## ((?:Q|TD|YB)-\d+) ·/gm)].length,139);
for(const r of changes){
  const before=load(r.previous_path),after=load(r.candidate_path);
  assert(text.includes(r.before_canonical_sha256));assert(text.includes(r.after_canonical_sha256));
  for(const locale of ['ru','en','tr'])for(const field of Object.keys(after.text[locale])){
    assert(text.includes(before.text[locale][field]));assert(text.includes(after.text[locale][field]));
  }
}
assert.equal([...text.matchAll(/\*\*Повторное решение владельца:\*\* _не заполнено_/g)].length,139);
const source=load(e+'/current-source-index470.json');assert.equal(source.cards.length,470);assert.equal(source.cards.filter(c=>c.changed).length,139);
for(const r of source.cards)assert.equal(sha(fs.readFileSync(r.source_path)),r.raw_sha256);
const paths=[];function walk(p){for(const n of fs.readdirSync(p)){const f=path.join(p,n);if(fs.lstatSync(f).isDirectory())walk(f);else if(f.endsWith('.md'))paths.push(f);}}
walk(root);walk(e);
let links=0;for(const p of paths){
  const t=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(p));
  for(const match of t.matchAll(/!?\[[^\]\n]*\]\(([^)]+)\)/g)){
    const link=match[1].trim().split(' "')[0];if(!link||/^(https?:|mailto:|data:|#)/.test(link))continue;
    const target=decodeURIComponent(link.split('#')[0]);if(!target)continue;
    const resolved=path.resolve(path.dirname(p),target);assert(resolved.startsWith(path.resolve('.')+path.sep));assert(fs.existsSync(resolved),p+' broken '+link);links++;
  }
}
const obligations=load(e+'/global-obligations.json');assert.equal(obligations.semantic_clusters.length,11);
assert.equal(obligations.requirements.find(r=>r.id==='R470-LEGACY-IP-21').card_ids.length,21);
for(const n of ['coverage.json','coverage-private-chat.json']){
  const report=load(e+'/checks/draft-check-round02/'+n);assert.equal(report.neutral20,'PASS');assert.equal(report.private_coverage,'CONTENT_GAP');
}
assert(load(e+'/checks/draft-check-round02/input-index.json').snapshot_directory_unchanged);
console.log(JSON.stringify({status:'DERIVED_HANDOFF_PASS',cards:470,changed_sections:139,unchanged:331,markdown_files:paths.length,local_links:links,semantic_clusters:11,private_coverage:'CONTENT_GAP',human_approval:false}));
