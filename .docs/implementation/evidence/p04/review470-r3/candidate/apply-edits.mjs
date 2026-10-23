/** Rebuild a separate draft revision from pinned immutable470r2; no runtime pointer writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {edits as questions} from './question-edits.mjs';
import {edits as truthDare} from './truth-dare-edits.mjs';
import {edits as yesBut} from './yes-but-edits.mjs';

const root='.docs/implementation/evidence/p04/review470-r3/candidate', evidence='.docs/implementation/evidence/p04/review470-r3';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pins=load(evidence+'/input-pins.json'), actions=load(evidence+'/actions139.json').actions;
const sha=b=>createHash('sha256').update(b).digest('hex');
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
const digest=v=>sha(canonical(v));
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const early=new Set(['Q-1105','Q-1110','Q-1112','YB-1102','YB-1104','YB-1107','YB-1130']);
const responders={
  ru:'{P2} может согласиться, предложить условие или отказаться без объяснений. Новое условие требует свободного согласия {P1}; начать можно только после явного подтверждения обоих. Каждый может передумать.',
  en:'{P2} may agree, suggest a condition, or decline without a reason. A new condition requires a free choice by {P1}; start only after both explicitly confirm. Either person may change their mind.',
  tr:'{P2} kabul edebilir, bir koşul önerebilir veya gerekçe göstermeden reddedebilir. Yeni koşulu {P1} özgürce değerlendirmelidir; ancak ikiniz de açıkça onayladıktan sonra başlayın. Her biriniz vazgeçebilirsiniz.'
};
const edits={...questions,...truthDare,...yesBut};
assert(Object.keys(edits).every(id=>actions.some(a=>a.id===id)));
const changes=[];
for(const pin of pins.cards){
  const raw=fs.readFileSync(pin.source_path);assert.equal(sha(raw),pin.raw_sha256);
  const before=JSON.parse(raw),after=structuredClone(before),action=actions.find(a=>a.id===pin.id);
  assert.equal(digest(before),pin.canonical_sha256);
  if(!action){fs.writeFileSync(root+'/cards/'+pin.id+'.json',raw);continue;}
  assert.equal(action.canonical_sha256,digest(before));
  const strategies=[];
  if(early.has(pin.id)){
    Object.assign(after,{interaction:'pair_public',meeting_contexts:['online','in_person'],relationship_scope:'acquaintance',min_comfort:0,min_progression_stage:1,required_capabilities:[]});
    after.safety_tags=after.safety_tags.filter(t=>!['private','personal'].includes(t));
    if(!after.safety_tags.includes('neutral'))after.safety_tags.unshift('neutral');
    strategies.push('Neutral voluntary public pair: bilateral, stage1, comfort0, acquaintance, online/in_person. No private-content promise.');
  }
  const privacy=action.notes.some(n=>n.startsWith('Для оффлайн-'))&&!early.has(pin.id);
  if(privacy){
    if(!after.required_capabilities.includes('private_text_chat'))after.required_capabilities.push('private_text_chat');
    for(const locale of ['ru','en','tr'])for(const field of Object.keys(after.text[locale])){
      let value=after.text[locale][field];
      if(field==='responder')continue;
      if(locale==='ru')value=value.replaceAll('в вашем личном разговоре только между вами','в личном чате').replaceAll('в вашем личном разговоре','в личном чате').replaceAll('в личном разговоре','в личном чате').replaceAll('только между собой','только в личном чате');
      if(locale==='en')value=value.replaceAll('in your private conversation between yourselves','in private chat').replaceAll('privately between yourselves','in private chat').replaceAll('just between yourselves','only in private chat').replaceAll('privately','in private chat');
      if(locale==='tr')value=value.replaceAll('yalnızca ikinizin özel konuşmasında','özel sohbette').replaceAll('kendi özel konuşmanızda','özel sohbette').replaceAll('özel konuşmanızda','özel sohbette').replaceAll('yalnızca aranızda','yalnızca özel sohbette');
      if(locale==='ru'&&!value.includes('личном чате'))value=value.replace('{P1},','{P1}, в личном чате');
      if(locale==='en'&&!value.includes('private chat'))value=value.replace('{P1},','{P1}, in private chat,');
      if(locale==='tr'&&!value.includes('özel sohbet'))value=value.replace('{P1},','{P1}, özel sohbette');
      after.text[locale][field]=value;
    }
    strategies.push('Require private_text_chat; no going away/contact. Current online-only runtime safely filters this in_person scenario until a real private channel is supported.');
  }
  if(action.notes.some(n=>n.startsWith('Общий ответ типа B'))){
    for(const locale of ['ru','en','tr'])after.text[locale].responder=responders[locale];
    strategies.push('All three choices restored: yes / propose condition / decline; both reconfirm the new condition; either may withdraw.');
  }
  if(action.notes.some(n=>n.startsWith('После `{P1},`'))){
    for(const locale of ['ru','en','tr'])for(const field of Object.keys(after.text[locale]))after.text[locale][field]=after.text[locale][field].replace(/^(\{P1\}, )(\p{Lu})/u,(_,p,c)=>p+c.toLocaleLowerCase(locale));
    strategies.push('Lowercase continuation after player address in RU/EN/TR.');
  }
  const edit=edits[pin.id];
  if(edit){
    for(const [key,value]of Object.entries(edit)){
      if(['ru','en','tr'].includes(key))Object.assign(after.text[key],value);
      else for(const [i,locale]of ['ru','en','tr'].entries())after.text[locale][key]=value[i];
    }
    strategies.push('Targeted original editorial/localization replacement; see exact field diff and full before/after.');
  }
  assert.notEqual(canonical(before.text),canonical(after.text),pin.id+' actual text correction required');
  after.revision=before.revision+1;
  after.authoring={...after.authoring,instruction_revision:after.authoring.instruction_revision+1,reviewed_by:null,reviewed_at:null,rights_status:'needs_review',source_notes:'Root-authored correction of owner review470r2 (2026-10-20), actions139. Stable ID; exact previous bytes in p04-r3/revision-history and hash-bound disposition. Original scenes and RU/EN/TR edits; no external card collection. Remains draft pending independent correction review and human editorial, language, rights and safety acceptance. Not activated.'};
  assert.equal(after.status,'draft');assert.equal(after.consent,before.consent);
  const previous=root+'/revision-history/'+pin.id+'-r'+before.revision+'.json';
  if(fs.existsSync(previous))assert.equal(sha(fs.readFileSync(previous)),pin.raw_sha256);else fs.writeFileSync(previous,raw,{flag:'wx'});
  const nextRaw=JSON.stringify(after,null,2)+'\n';fs.writeFileSync(root+'/cards/'+pin.id+'.json',nextRaw);
  const diff=(a,b,p='')=>a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)?[...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],p+'/'+k)):canonical(a)===canonical(b)?[]:[{path:p,before:a,after:b}];
  changes.push({id:pin.id,priority:action.priority,notes:action.notes,strategies,before_revision:before.revision,after_revision:after.revision,before_raw_sha256:pin.raw_sha256,after_raw_sha256:sha(nextRaw),before_canonical_sha256:pin.canonical_sha256,after_canonical_sha256:digest(after),previous_path:previous,candidate_path:root+'/cards/'+pin.id+'.json',differences:diff(before,after),status:'CORRECTED_DRAFT_PENDING_INDEPENDENT_AND_HUMAN_REVIEW'});
}
assert.equal(changes.length,139);
save(evidence+'/current-changes139.json',{schema_version:1,source_catalog_digest:pins.source_catalog_digest,changed:changes,unchanged_raw:331,early_public_ids:[...early].sort(),privacy_channel_required_ids:changes.filter(r=>r.strategies.some(s=>s.startsWith('Require private_text_chat'))).map(r=>r.id),human_approval:false,runtime_activation:false});
console.log(JSON.stringify({changed:changes.length,unchanged_raw:331,early_public:early.size,privacy_channel_required:changes.filter(r=>r.strategies.some(s=>s.startsWith('Require private_text_chat'))).length}));
