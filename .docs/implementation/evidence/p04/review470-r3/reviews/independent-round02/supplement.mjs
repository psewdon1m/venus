import fs from 'node:fs';import crypto from 'node:crypto';import {DatabaseSync} from 'node:sqlite';
const e='.docs/implementation/evidence/p04/review470-r3',out=e+'/reviews/independent-round02';
const read=p=>JSON.parse(fs.readFileSync(p)),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const canon=x=>typeof x==='string'?JSON.stringify(x.normalize('NFC')):x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canon).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}';
const digest=x=>crypto.createHash('sha256').update(canon(x)).digest('hex');
const errors=[],checks=[];function check(n,v){checks.push({name:n,pass:!!v});if(!v)errors.push(n);}
const freeze=read(e+'/final-input-freeze.json'),pins=read(e+'/input-pins.json'),changes=read(e+'/changes139.json').changed,actions=read(e+'/actions139.json').actions;
check('freeze exact expected identity',sha(e+'/final-input-freeze.json')==='e04966b7bca53b924116376b9becf4304d2a38091d77f3f79439eecd05048577');
for(const p of freeze.author_scripts)check('frozen author script '+p.path,sha(p.path)===p.sha256);
check('frozen changes',sha(e+'/changes139.json')===freeze.changes_sha256);
check('frozen ledger',sha(freeze.ledger_path)===freeze.ledger_sha256);
check('frozen receipt',sha(e+'/authoring/receipt.json')===freeze.authoring_receipt_sha256);
check('rollback source ledger bytes',sha(e+'/authoring/rollback-470r2.sqlite')===pins.source_ledger.sha256);
check('only139 prior history files',fs.readdirSync('.docs/content/p04-r3/revision-history').length===139);
const diffs=(a,b,p='')=>{
 if(canon(a)===canon(b))return [];
 if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b))return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diffs(a[k],b[k],p+'/'+k));
 return [{path:p,before:a,after:b}];
};
for(const c of changes){const pin=pins.cards.find(p=>p.id===c.id),old=read(c.previous_path),cur=read(c.candidate_path),a=actions.find(a=>a.id===c.id);
 check('history raw '+c.id,sha(c.previous_path)===pin.raw_sha256&&c.before_raw_sha256===pin.raw_sha256);
 check('current raw '+c.id,sha(c.candidate_path)===c.after_raw_sha256);
 check('history canonical '+c.id,digest(old)===c.before_canonical_sha256&&c.before_canonical_sha256===pin.canonical_sha256);
 check('current canonical '+c.id,digest(cur)===c.after_canonical_sha256);
 check('all actual field diffs '+c.id,canon(diffs(old,cur).sort((a,b)=>a.path.localeCompare(b.path)))===canon([...c.differences].sort((a,b)=>a.path.localeCompare(b.path))));
 check('all source notes retained '+c.id,canon(c.notes)===canon(a.notes)&&c.priority===a.priority);
}
const cards=pins.cards.map(p=>read('.docs/content/p04-r3/cards/'+p.id+'.json'));
const privacy=new Set(actions.filter(a=>a.notes.some(n=>n.startsWith('Для оффлайн-'))).map(a=>a.id));
const remain=cards.filter(c=>privacy.has(c.id)&&c.interaction==='pair_private');
check('48 retained private delivery',remain.length===48);
for(const c of remain)for(const [locale,text] of Object.entries(c.text))check('chat delivery '+c.id+' '+locale,new RegExp({ru:'личн.{0,8}чат',en:'private.{0,8}chat',tr:'özel.{0,8}sohbet'}[locale],'i').test(Object.values(text).join(' ')));
const legacy=cards.filter(c=>c.interaction==='pair_private'&&c.meeting_contexts.includes('in_person')&&!c.required_capabilities.includes('private_text_chat'));
check('21 legacy outside139',legacy.length===21&&legacy.every(c=>!actions.some(a=>a.id===c.id)));
const db=new DatabaseSync(freeze.ledger_path,{readOnly:true});const events=db.prepare('SELECT * FROM events ORDER BY seq').all();
const added=events.slice(151);check('31 records and3 CAS request revisions',added.length===34&&added.filter(r=>r.kind==='DRAFT_RECORDED').length===31&&added.filter(r=>r.kind==='REQUEST_REVISED').length===3);
check('no new reservations or batches',db.prepare('SELECT count(*) n FROM reservations').get().n===547&&db.prepare('SELECT count(*) n FROM batches').get().n===41);
for(const event of added.filter(r=>r.kind==='REQUEST_REVISED')){
 const r=JSON.parse(event.body),batch=db.prepare('SELECT request FROM batches WHERE id=?').get(r.request.batch_id);
 check('CAS stable batch identity '+r.request.batch_id,['batch_id','mode','first','count'].every(k=>r.request[k]===r.previous_request[k])&&batch.request===canon(r.request));
}
db.close();
const result={at:new Date().toISOString(),status:errors.length?'FAIL':'PASS',scope:'SCOPED_CORRECTION_GATE_NOT_HUMAN_APPROVAL_OR_STAGE_PASS',checks:checks.length,failures:errors,legacy_outside139:legacy.map(c=>c.id),detail:checks};
fs.writeFileSync(out+'/supplement.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:checks.length,failures:errors},null,2));process.exitCode=errors.length?1:0;
