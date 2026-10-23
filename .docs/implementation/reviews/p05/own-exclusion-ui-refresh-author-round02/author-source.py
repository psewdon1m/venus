from pathlib import Path
import datetime
r=Path.cwd()
p=r/'apps/web/src/topic-games-panel.tsx';s=p.read_bytes().decode();old="await api.request(path+'/conversation/commands',input);if(refreshOwn&&alive.current&&boundary.sameIdentity(auth))setOwnTopicsRefresh(value=>value+1);";new="try{await api.request(path+'/conversation/commands',input);}finally{if(refreshOwn&&alive.current&&boundary.sameIdentity(auth))setOwnTopicsRefresh(value=>value+1);}";assert s.count(old)==1;s=s.replace(old,new);p.write_bytes(s.encode())
p=r/'apps/web/src/topic-settings.tsx';s=p.read_bytes().decode()
s=s.replace(" const load=useCallback", " const draft=useRef<{allow:string[];excluded:string[];loaded:boolean}>({allow:[],excluded:[],loaded:false}),preserved=useRef<{allow:string[];excluded:string[]}|null>(null),loadedBy=useRef<unknown>(null);\r\n useEffect(()=>{draft.current={allow,excluded,loaded:record!==null};},[allow,excluded,record]);\r\n const load=useCallback",1)
old="setAllow([...own.allow_topic_ids]);setExcluded([]);setFailed(false);"
new="const held=preserved.current,known=new Set(taxonomy.topics.map(t=>t.topic_id)),permanent=new Set(own.exclude_topic_ids);setAllow([...new Set([...own.allow_topic_ids,...held?.allow??[]])].filter(id=>known.has(id)&&!permanent.has(id)));setExcluded((held?.excluded??[]).filter(id=>known.has(id)&&!permanent.has(id)));setFailed(false);"
assert s.count(old)==1;s=s.replace(old,new)
old="useEffect(()=>{alive.current=true;let active=true;const counter=generation;queueMicrotask"
new="useEffect(()=>{if(loadedBy.current!==load)preserved.current=null;else if(draft.current.loaded)preserved.current={allow:[...draft.current.allow],excluded:[...draft.current.excluded]};loadedBy.current=load;alive.current=true;let active=true;const counter=generation;queueMicrotask"
assert s.count(old)==1;s=s.replace(old,new)
s=s.replace("allow_topic_ids:[...allow]","allow_topic_ids:allow.filter(id=>!record.own.exclude_topic_ids.includes(id))")
s=s.replace("topic_ids:[...excluded]","topic_ids:excluded.filter(id=>!record.own.exclude_topic_ids.includes(id))")
s=s.replace("setRecord({taxonomy:record.taxonomy,own:next});", "preserved.current=null;setRecord({taxonomy:record.taxonomy,own:next});",1)
s=s.replace("checked={allow.includes(t.topic_id)}", "checked={!permanent&&allow.includes(t.topic_id)}")
p.write_bytes(s.encode())
with (r/'.history/agents/2026-10-21-p05-own-exclusion-refresh02-author.md').open('a',encoding='utf-8') as f:f.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — RED retained .artifacts/p05-own-exclusion-refresh02-red.txt: 3FAIL/7PASS, vitest native exit1. Added409+durableX, uncertain network+durableX, merged unrelated draft and no-dispatch controls in existing TSX harness. Implemented front-only finally invalidation and identity-bound authoritative/draft merge; no API/producer/backend writes.\n')
