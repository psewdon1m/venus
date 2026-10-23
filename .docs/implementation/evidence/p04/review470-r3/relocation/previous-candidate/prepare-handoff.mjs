/** Derive review documents from exact frozen cards; never modifies cards or ledgers. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='.docs/content/p04-r3',e='.docs/implementation/evidence/p04/review470-r3';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const freeze=load(e+'/final-input-freeze.json');
for(const f of [...freeze.card_files,...freeze.author_scripts])assert.equal(sha(fs.readFileSync(f.path)),f.sha256);
assert.equal(sha(fs.readFileSync(freeze.ledger_path)),freeze.ledger_sha256);
const changes=load(e+'/changes139.json').changed;
const analysis=load(e+'/checks/draft-check-round02/analysis.json');
assert.equal(analysis.catalog_digest,'97bf4bb876640ec11612ae9fdd9e3baceb2cd88075e7f8d0ad59d80e4f49f6db');
const rows=['# Venus · 139 исправлений · новая редакция r3','',
  'Дата: 20 октября 2026. Все139 замечаний внесены в отдельный draft; это форма для повторной человеческой проверки, без созданного одобрения.',
  '',`Canonical catalog digest: \`${analysis.catalog_digest}\`. Полный каталог470; изменены139, прежние331 JSON сохранены побайтно.`,
  '', 'Предыдущие тексты ниже относятся к исходному470r2. Каждому изменённому ID присвоены новая последовательная ревизия и SHA. Общий HOLD не снят.',
  '', 'Применимость:7нейтральных сценариев стали ранними публичными парами с двусторонним согласием. Остальные48 отмеченных очных приватных сценариев требуют private_text_chat; текущий runtime отфильтрует их, поскольку предоставляет этот канал только онлайн.',
  '', 'Все языковые поля показаны полностью.'];
const fields=['interaction','meeting_contexts','relationship_scope','min_comfort','min_progression_stage','required_capabilities','consent','requires_physical_contact','requires_going_away'];
for(const r of changes){
  const before=load(r.previous_path),after=load(r.candidate_path);
  rows.push('',`## ${r.id} · ${r.priority} · r${r.before_revision} → r${r.after_revision}`,'',`Было canonical SHA256: \`${r.before_canonical_sha256}\`.`,`Стало canonical SHA256: \`${r.after_canonical_sha256}\`.`,
    '',...r.notes.map(n=>'- '+n),'','Применимость:','', '| Поле | Было | Стало |','|---|---|---|',...fields.map(f=>`| ${f} | \`${JSON.stringify(before[f])}\` | \`${JSON.stringify(after[f])}\` |`));
  for(const locale of ['ru','en','tr']){
    rows.push('',`### ${locale.toUpperCase()}`,'');
    for(const [field,text]of Object.entries(after.text[locale]))rows.push(`**${field} — было:** ${before.text[locale][field]}`,'',`**${field} — стало:** ${text}`,'');
  }
  rows.push('**Повторное решение владельца:** _не заполнено_.','**Замечания:** _не заполнено_.');
}
fs.writeFileSync(e+'/REVIEW_CHANGED139.md',rows.join('\n')+'\n',{flag:'wx'});
const cards=freeze.card_files.map(f=>load(f.path));
const legacy=cards.filter(c=>c.interaction==='pair_private'&&c.meeting_contexts.includes('in_person')&&!c.required_capabilities.includes('private_text_chat')).map(c=>c.id);
assert.equal(legacy.length,21);
const delta=fs.readFileSync(e+'/inputs/Venus_P04_REVIEW_470_R2_DELTA365_2026-10-20.md','utf8');
const clusters=delta.split('\n').filter(line=>/^\|/.test(line)&&line.includes('`')&&line.split('|').length===6&&line.includes(' | ')).filter(line=>{
  const section=delta.slice(0,delta.indexOf(line));return section.lastIndexOf('## 6.')>section.lastIndexOf('## 7.');
}).map(line=>{const [name,ids,repetition,action]=line.split('|').slice(1,-1).map(s=>s.trim());return {name,card_ids:[...ids.matchAll(/`((?:Q|TD|YB)-\d+)`/g)].map(m=>m[1]),repetition,required_action:action,status:'SELECTION_OR_SESSION_UX_VERIFICATION_PENDING_NOT_CARD_APPROVAL'};});
assert.equal(clusters.length,11);
save(e+'/global-obligations.json',{schema_version:1,status:'SEPARATE_FROM_LOCAL139_CORRECTIONS',source_review_section:'DELTA365 §4 and §6',legacy_review450_HOLD_preserved:true,legacy_excluded77_and_moved_UX_unchanged:true,requirements:[
  {id:'R470-CTX-01',status:'LOCAL54_METADATA_CORRECTED_RUNTIME_IP48_WITHHELD',ids_requiring_private_channel:load(e+'/changes139.json').privacy_channel_required_ids,early_public_ids:load(e+'/changes139.json').early_public_ids},
  {id:'R470-LEGACY-IP-21',status:'OUTSIDE139_UNCHANGED_REQUIRES_SEPARATE_APPLICABILITY_REVIEW_BEFORE_INTEGRATION',card_ids:legacy},
  {id:'R470-YB-CHOICES',status:'ALL150_TEXT_UNIFIED_RUNTIME_CONDITION_FLOW_SEPARATE_P05_VERIFICATION',choices:['agree','propose_condition','decline'],new_condition_both_explicit_confirmation:true,withdrawal:true},
  {id:'R470-QUIET-PUBLIC',status:'P05_RUNTIME_GATE_SEPARATE',requirement:'Quiet bilateral opt-in before publishing player pair/text; refusal reasons remain private; all122 public pair cards require bilateral consent.'},
  {id:'R470-RELATIONSHIPS',status:'P05_RUNTIME_GATE_SEPARATE',requirement:'Global player comfort and both independent directed relationship values; neither proximity nor progression implies consent; do not publish values.'},
  {id:'R470-PROGRESSION',status:'P05_RUNTIME_GATE_SEPARATE',requirement:'Stage is a minimum threshold; early eligible content remains usable at stage2; no forced personal disclosure.'},
  {id:'R470-UI-RULES',status:'ACCESSIBLE_UX_VERIFICATION_SEPARATE',requirement:'Accessible common skip/withdrawal/condition negotiation instructions; do not remove actual enforcement while shortening card text.'},
  {id:'R470-PRIVATE-CAPACITY',status:'CONTENT_GAP_NOT_ACCEPTED',requirement:'Recompute private coverage and semantic capacity on new exact digest/metadata before integration; old470r2 proofs and TopicMap are not reusable as new evidence.'},
  {id:'R470-TD1170',status:'LOCAL_MECHANIC_DIVERSIFIED_SESSION_SEPARATION_STILL_PENDING',card_ids:['TD-1170','Q-1172','YB-1175'],requirement:'TD1170 diary branches replaced by sensory choice/replay mutation; still separate related reflection tasks across sessions.'}
],semantic_clusters:clusters,human_approval:false,runtime_source_modified:false});
save(e+'/source-index470.json',{schema_version:1,status:'DRAFT_R3_NOT_APPROVED_REGISTRY_OR_TOPICMAP',catalog_digest:analysis.catalog_digest,cards:cards.map((c,i)=>({id:c.id,revision:c.revision,source_path:freeze.card_files[i].path,raw_sha256:freeze.card_files[i].sha256,canonical_sha256:analysis.manifest.cards.find(r=>r.id===c.id).sha256,changed:changes.some(r=>r.id===c.id),human_approved:false})),runtime_activation:false});
console.log(JSON.stringify({review_sections:changes.length,source_cards:cards.length,semantic_clusters:clusters.length,legacy_private21:legacy.length}));
