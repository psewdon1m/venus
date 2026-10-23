import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const out=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/,'$1'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const changes=read('.docs/implementation/evidence/p04/review470-r3/changes139.json').changed.filter(x=>/^(Q|TD)-/.test(x.id));
const actions=read('.docs/implementation/evidence/p04/review470-r3/actions139.json').actions;
const pins=read(path.join(out,'pins.json')).pins;
const errors=[];
const rows=[];
fs.mkdirSync(path.join(out,'snapshots'),{recursive:true});
for(const item of changes){
  const pin=pins.find(x=>x.id===item.id);
  const raw=fs.readFileSync(item.candidate_path);
  const prev=fs.readFileSync(item.previous_path);
  const card=JSON.parse(raw);
  const old=JSON.parse(prev);
  if(hash(raw)!==pin.sha256)errors.push(`${item.id}: candidate changed since pin`);
  if(hash(prev)!==pin.before_sha256)errors.push(`${item.id}: previous changed since pin`);
  if(hash(raw)!==item.after_raw_sha256)errors.push(`${item.id}: manifest hash differs`);
  if(card.revision!==old.revision+1)errors.push(`${item.id}: wrong revision`);
  if(JSON.stringify(actions.find(x=>x.id===item.id)?.notes)!==JSON.stringify(item.notes))errors.push(`${item.id}: note mismatch`);
  if(card.status!=='draft'||card.authoring.rights_status!=='needs_review'||card.authoring.reviewed_by!==null)errors.push(`${item.id}: approval state drift`);
  const fields=item.id.startsWith('Q-')?['question']:['truth','dare'];
  for(const field of fields){
    const slots=['ru','en','tr'].map(l=>(card.text[l][field].match(/\{P[12]\}/g)||[]).sort().join(','));
    if(new Set(slots).size!==1)errors.push(`${item.id}/${field}: placeholder parity`);
    if(card.interaction==='pair_private'){
      if(!card.required_capabilities.includes('private_text_chat'))errors.push(`${item.id}: missing chat capability`);
      for(const l of ['ru','en','tr']){
        const phrase={ru:/личном чате/,en:/private chat/,tr:/özel sohbette|özel sohbete/}[l];
        if(!phrase.test(card.text[l][field]))errors.push(`${item.id}/${l}/${field}: chat unspecified`);
      }
    }
  }
  fs.writeFileSync(path.join(out,'snapshots',`${item.id}.json`),raw);
  rows.push({id:item.id,sha256:hash(raw),before_sha256:hash(prev),note_count:item.notes.length,interaction:card.interaction,contexts:card.meeting_contexts,stage:card.min_progression_stage,capabilities:card.required_capabilities});
}
for(const id of ['Q-1172','YB-1175']){
  const p=`.docs/content/p04-r3/cards/${id}.json`;
  const raw=fs.readFileSync(p);
  fs.writeFileSync(path.join(out,'snapshots',`${id}.json`),raw);
  rows.push({id,sha256:hash(raw),role:'semantic-neighbor'});
}
const result={timestamp_utc:new Date().toISOString(),scope:{Q:changes.filter(x=>x.id.startsWith('Q-')).length,TD:changes.filter(x=>x.id.startsWith('TD-')).length},errors,rows};
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({scope:result.scope,errors,snapshots:rows.length}));
process.exitCode=errors.length?1:0;
