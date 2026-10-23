import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const e='.docs/implementation/evidence/p04/review470-r3',r='.docs/content/p04-r3',out=e+'/reviews/independent-handoff-round03';
const read=p=>JSON.parse(fs.readFileSync(p)),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const canonical=x=>typeof x==='string'?JSON.stringify(x.normalize('NFC')):x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const digest=x=>crypto.createHash('sha256').update(canonical(x)).digest('hex');
const checks=[],failures=[];const check=(name,ok)=>{checks.push({name,pass:!!ok});if(!ok)failures.push(name);};
const freeze=read(e+'/final-input-freeze.json'),changes=read(e+'/changes139.json').changed,index=read(e+'/source-index470.json'),obligations=read(e+'/global-obligations.json');
check('freeze unchanged',sha(e+'/final-input-freeze.json')==='e04966b7bca53b924116376b9becf4304d2a38091d77f3f79439eecd05048577');
for(const p of [...freeze.card_files,...freeze.author_scripts])check('frozen '+p.path,sha(p.path)===p.sha256);
check('ledger unchanged',sha(freeze.ledger_path)===freeze.ledger_sha256);
const worksheet=fs.readFileSync(e+'/REVIEW_CHANGED139.md','utf8');
const sections=[...worksheet.matchAll(/^## ((?:Q|TD|YB)-\d+) · (P[12]) · r(\d+) → r(\d+)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
check('worksheet139 unique sections',sections.length===139&&new Set(sections.map(m=>m[1])).size===139);
for(const c of changes){
 const section=sections.find(m=>m[1]===c.id),before=read(c.previous_path),after=read(c.candidate_path);
 check('worksheet identity '+c.id,!!section&&section[2]===c.priority&&+section[3]===before.revision&&+section[4]===after.revision);
 const text=section?.[5]||'';
 check('worksheet hashes '+c.id,text.includes('Было canonical SHA256: `'+digest(before)+'`.')&&text.includes('Стало canonical SHA256: `'+digest(after)+'`.'));
 check('worksheet empty approval '+c.id,text.includes('**Повторное решение владельца:** _не заполнено_.'));
 for(const locale of ['ru','en','tr']){
  const label='### '+locale.toUpperCase(),portion=text.split(label)[1]?.split(/^### /m)[0]||'';
  for(const [field,value] of Object.entries(after.text[locale])){
   check('worksheet before '+c.id+'/'+locale+'/'+field,portion.split(/\r?\n/).includes('**'+field+' — было:** '+before.text[locale][field]));
   check('worksheet after '+c.id+'/'+locale+'/'+field,portion.split(/\r?\n/).includes('**'+field+' — стало:** '+value));
  }
 }
}
check('index470 unique',index.cards.length===470&&new Set(index.cards.map(c=>c.id)).size===470);
for(const c of index.cards){const card=read(c.source_path),pin=freeze.card_files.find(p=>p.path===c.source_path);
 check('sourceindex '+c.id,card.id===c.id&&card.revision===c.revision&&c.raw_sha256===sha(c.source_path)&&c.raw_sha256===pin?.sha256&&c.canonical_sha256===digest(card)&&c.changed===changes.some(r=>r.id===c.id)&&c.human_approved===false);
}
check('draft index flags',index.runtime_activation===false&&index.status==='DRAFT_R3_NOT_APPROVED_REGISTRY_OR_TOPICMAP');
check('index catalog digest',index.catalog_digest===digest(index.cards.map(c=>({id:c.id,revision:c.revision,sha256:c.canonical_sha256})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)));
const delta=fs.readFileSync(e+'/inputs/Venus_P04_REVIEW_470_R2_DELTA365_2026-10-20.md','utf8');
const section6=delta.slice(delta.indexOf('## 6.'),delta.indexOf('## 7.'));
const rows=section6.split('\n').filter(l=>l.startsWith('|')&&/`(?:Q|TD|YB)-\d+`/.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));
check('source11 clusters',rows.length===11&&obligations.semantic_clusters.length===11);
for(const [name,ids,repetition,action] of rows){const c=obligations.semantic_clusters.find(c=>c.name===name);check('cluster '+name,!!c&&canonical(c.card_ids)===canonical([...ids.matchAll(/`((?:Q|TD|YB)-\d+)`/g)].map(m=>m[1]))&&c.repetition===repetition&&c.required_action===action&&c.status==='SELECTION_OR_SESSION_UX_VERIFICATION_PENDING_NOT_CARD_APPROVAL');}
const requirementIds=['R470-CTX-01','R470-LEGACY-IP-21','R470-YB-CHOICES','R470-QUIET-PUBLIC','R470-RELATIONSHIPS','R470-PROGRESSION','R470-UI-RULES','R470-PRIVATE-CAPACITY','R470-TD1170'];
check('nine obligations distinct',obligations.requirements.length===9&&requirementIds.every(id=>obligations.requirements.some(r=>r.id===id)));
check('no obligation approval',obligations.human_approval===false&&obligations.runtime_source_modified===false&&obligations.legacy_review450_HOLD_preserved===true&&obligations.legacy_excluded77_and_moved_UX_unchanged===true);
const get=id=>obligations.requirements.find(r=>r.id===id),cards=index.cards.map(c=>read(c.source_path));
check('legacy21 exact IDs',canonical(get('R470-LEGACY-IP-21').card_ids)===canonical(cards.filter(c=>c.interaction==='pair_private'&&c.meeting_contexts.includes('in_person')&&!c.required_capabilities.includes('private_text_chat')).map(c=>c.id)));
check('48 withheld exact IDs',get('R470-CTX-01').ids_requiring_private_channel.length===48&&get('R470-CTX-01').ids_requiring_private_channel.every(id=>cards.some(c=>c.id===id&&c.interaction==='pair_private'&&c.meeting_contexts.includes('in_person')&&c.required_capabilities.includes('private_text_chat'))));
check('122 public bilateral actual',cards.filter(c=>c.interaction==='pair_public').length===122&&cards.filter(c=>c.interaction==='pair_public').every(c=>c.consent==='bilateral'));
const coverage=[];
for(const n of ['coverage.json','coverage-private-chat.json']){
 const c=read(e+'/checks/draft-check-round02/'+n),summary={name:n,cells:c.cells.length,sessions:c.sessions.length,private_sessions:c.private_sessions.length,neutral20:c.neutral20,private_coverage:c.private_coverage,statuses:{}};
 for(const row of c.private_sessions)summary.statuses[row.status]=(summary.statuses[row.status]||0)+1;coverage.push(summary);
 check('coverage accurately limited '+n,c.cells.length===5880&&c.sessions.length===4214&&c.private_sessions.length===420&&c.neutral20==='PASS'&&c.private_coverage==='CONTENT_GAP'&&c.synthetic===true);
}
const markdown=[];function walk(p){for(const f of fs.readdirSync(p)){const q=path.join(p,f);if(fs.statSync(q).isDirectory())walk(q);else if(q.endsWith('.md'))markdown.push(q);}}
walk(r);walk(e);let links=0;for(const p of markdown){let t;try{t=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(p));check('utf8 '+p,true);}catch{check('utf8 '+p,false);continue;}
 for(const m of t.matchAll(/!?\[[^\]\n]*\]\(([^)]+)\)/g)){const l=m[1].trim().split(' "')[0];if(!l||/^(https?:|mailto:|data:|#)/.test(l))continue;const target=decodeURIComponent(l.split('#')[0]);if(!target)continue;check('link '+p+' '+target,fs.existsSync(path.resolve(path.dirname(p),target)));links++;}
}
const reviewed=[r+'/README.md',r+'/SOURCE_REVISION.md',r+'/prepare-handoff.mjs',r+'/check-handoff.mjs',e+'/REPORT.md',e+'/REVIEW_CHANGED139.md',e+'/global-obligations.json',e+'/source-index470.json'];
const result={at:new Date().toISOString(),status:failures.length?'FAIL':'PASS',scope:'DERIVATIVE_HANDOFF_REVIEW_ONLY_NOT_HUMAN_APPROVAL_OR_STAGE_PASS',checks:checks.length,failures,coverage,markdown_files:markdown.length,local_links:links,pins:reviewed.map(p=>({path:p,sha256:sha(p)})),detail:checks};fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:checks.length,failures,markdown_files:markdown.length,local_links:links},null,2));process.exitCode=failures.length?1:0;
