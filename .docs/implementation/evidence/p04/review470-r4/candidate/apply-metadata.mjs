/** Owner-authorized metadata-only derivative. Original r3 source is read-only. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {canonical,digest} from '../../../../../../packages/relationship-engine/dist/index.js';
const e='.docs/implementation/evidence/p04/review470-r4',source='.docs/implementation/evidence/p04/review470-r3/candidate/cards',dest=e+'/candidate/cards',pins=JSON.parse(fs.readFileSync(e+'/input-pins.json','utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const names=fs.readdirSync(source).filter(n=>n.endsWith('.json')).sort(),changes=[],review=[];assert.equal(names.length,470);assert.equal(fs.readdirSync(dest).length,0,'NO_OVERWRITE');
const special={
 'TD-1107':'Imagined sounds are compared using words; no actual instrument, microphone or co-presence is required.',
 'TD-1109':'An imagined musical beginning/end is suggested using words only; the device channel is identical in both contexts.',
 'TD-1158':'A fairy-tale parade is described from a fictional window; no real event, camera or leaving the room.',
 'TD-1160':'Imagined cake layers are described; the text explicitly says no eating is needed.',
 'YB-1117':'Gallery opening is roleplay inside the private chat, not a public performance or actual gathering.',
 'YB-1142':'The secret passage connects imaginary places; no actual separation or movement.',
 'YB-1160':'Alongside hobbies is explicitly imagined; it does not require actual physical co-presence.',
 'YB-1162':'Campfire positions are imaginary and described without real step distances.',
 'YB-1166':'Imagined celebration requires no photographs or actual event.',
 'YB-1180':'The invented musical symbol is described in text; real notation/music is explicitly unnecessary.'};
for(const name of names){const raw=fs.readFileSync(source+'/'+name),before=JSON.parse(raw);assert.equal(sha(raw),pins.source_files.find(p=>p.path.endsWith('/'+name)).sha256);let after=structuredClone(before),changed=false;
 if(before.interaction==='pair_private'){
  assert(!before.requires_physical_contact&&!before.requires_going_away);assert.equal(before.consent,'bilateral');assert(before.min_comfort>=1&&before.min_progression_stage>=3);
  assert.deepEqual(Object.keys(before.text).sort(),['en','ru','tr']);after.meeting_contexts=['online','in_person'];after.required_capabilities=[...new Set([...before.required_capabilities,'private_text_chat'])];
  changed=canonical(after)!==canonical(before);assert(changed);after.revision=before.revision+1;
  const fieldEvidence=Object.fromEntries(['ru','en','tr'].map(locale=>[locale,Object.entries(before.text[locale]).map(([field,text])=>({field,utf8_sha256:sha(Buffer.from(text)),text,assessment:'WRITTEN_PRIVATE_DISCUSSION_OR_IMAGINARY_DESCRIPTION_NO_PHYSICAL_CONTEXT_DEPENDENCY'}))]));
  const dialogueOnly=!before.required_capabilities.includes('private_text_chat');
  const reason=dialogueOnly?'The private conversation is optional preference/imaginary discussion; words/discussion can be exchanged through the same typed private channel. No locale requires speaking aloud or physical proximity. Explicit chat capability now makes its private delivery prerequisite enforceable.':'Each locale already locates the optional action in private chat. The operation is a written answer, choice, short invented scene or imaginary description; being in the same physical room changes neither the channel nor the action.';
  review.push({id:before.id,mode:before.mode,decision:'AUTHOR_METADATA_APPLICABLE_BOTH_CONTEXTS_REQUIRES_INDEPENDENT_REVIEW',source_contexts:before.meeting_contexts,target_contexts:after.meeting_contexts,old21_capability_added:dialogueOnly,rationale:reason,card_specific_note:special[before.id]??('Unchanged '+before.mode+' operation: '+Object.values(before.text.en)[0]),locale_evidence:fieldEvidence,physical:false,going_away:false,human_approval:false});
  fs.writeFileSync(e+'/revision-history/'+before.id+'-r'+before.revision+'.json',raw,{flag:'wx'});
 }
 assert.equal(canonical(before.text),canonical(after.text));assert.equal(canonical(before.authoring),canonical(after.authoring));
 const other=c=>Object.fromEntries(Object.entries(c).filter(([k])=>!['revision','meeting_contexts','required_capabilities'].includes(k)));assert.equal(canonical(other(before)),canonical(other(after)));
 const output=changed?Buffer.from(JSON.stringify(after,null,2)+'\n'):raw;fs.writeFileSync(dest+'/'+name,output,{flag:'wx'});
 if(changed)changes.push({id:before.id,source_path:source+'/'+name,candidate_path:dest+'/'+name,previous_raw_sha256:sha(raw),raw_sha256:sha(output),previous_canonical_sha256:digest(before),canonical_sha256:digest(after),previous_revision:before.revision,revision:after.revision,metadata_diff:{meeting_contexts:{before:before.meeting_contexts,after:after.meeting_contexts},...(canonical(before.required_capabilities)!==canonical(after.required_capabilities)?{required_capabilities:{before:before.required_capabilities,after:after.required_capabilities}}:{})},text_unchanged:true,provenance_unchanged:true});
}
assert.equal(changes.length,143);assert.equal(review.filter(r=>r.old21_capability_added).length,21);for(const id of ['Q-1105','Q-1110','Q-1112','YB-1102','YB-1104','YB-1107','YB-1130'])assert.equal(sha(fs.readFileSync(source+'/'+id+'.json')),sha(fs.readFileSync(dest+'/'+id+'.json')));
for(const[name,value]of [['changes143.json',{schema_version:1,changed:changes,raw_unchanged:327,new_IDs:0,new_text_fields:0,scope:'ONLY_METADATA_AND_REVISION_NO_HUMAN_APPROVAL'}],['applicability143.json',{schema_version:1,status:'AUTHOR_ASSESSMENT_REQUIRES_INDEPENDENT_REVIEW',cards:review,blockers:[],mechanical_flags_are_not_semantic_or_human_approval:true}]])fs.writeFileSync(e+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cards:470,changed:143,raw_unchanged:327,private_modes:{questions:47,truth_or_dare:50,yes_but:46},old21_capability_added:21,text_changes:0,human_approval:false}));
