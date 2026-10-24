from pathlib import Path
import shutil
old=Path('.artifacts/p05-private-batch-browser-producer20');out=Path('.artifacts/p05-private-batch-browser-producer21');assert not out.exists();shutil.copytree(old,out)
p=out/'private-batch-observer.mjs';s=p.read_text(encoding='utf-8')
s=s.replace('(target|conversation|conversation\\/chat)$/','(view|target|conversation|conversation\\/chat)$/')
s=s.replace("if(r.kind==='own'){const b=", "if(r.kind==='own'||r.kind==='view'){const b=")
s=s.replace("if(record.route.kind==='own'&&record.batch)", "if(['own','view'].includes(record.route.kind)&&record.batch)")
needle="    if(kind==='own'&&record.route.room===actor.room"
assert needle in s
at=s.index(needle)
s=s[:at]+'''    if(kind==='view'){
     // One ACTUAL HTTP response, not four requests. Component routes below are
     // validator bindings only; all times/status come from this envelope.
     if(response.status()!==200||!body||Object.keys(body).sort().join(',')!=='chat,conversation,own,schema_version,target'||body.schema_version!==2){b.reason='BUNDLE_INVALID';return;}
     for(const name of ['own','target','conversation','chat'])b[name]={...part,body:body[name],route:{...part.route,kind:name,actual_transport:'view'}};
     if(record.route.room===actor.room&&controls.validSelfActions(body.own,2)&&body.own.room_id===actor.room&&body.own.member_id===actor.id)onProjection(actor,{kind:'own',value:ownProjection(body.own,part)});
     finish(s,b);return;
    }
'''+s[at:]
assert "(view|target|conversation|conversation\\/chat)"in s and "r.kind==='view'"in s
p.write_text(s,encoding='utf-8',newline='\n')
p=out/'browser.mjs';s=p.read_text(encoding='utf-8');needle="if(path.endsWith('/self-actions')){const v=await response.json();";assert needle in s;s=s.replace(needle,"if(path.endsWith('/self-actions')||path.endsWith('/view')){const raw=await response.json(),v=path.endsWith('/view')?raw.own:raw;");p.write_text(s,encoding='utf-8',newline='\n')
p=out/'observations.mjs';s=p.read_text(encoding='utf-8');s=s.replace("export function privatePayloadMetadata", "export const roundViewPath=s=>`/api/v2/rooms/${s.room}/game/${s.session}/round/${s.round}/view`;\nexport function privatePayloadMetadata")
s=s.replace("path!==conversationPath(selection)", "(path!==conversationPath(selection)&&path!==roundViewPath(selection))")
s=s.replace("view=JSON.parse(bytes.toString('utf8'));", "view=JSON.parse(bytes.toString('utf8'));if(path===roundViewPath(selection)){if(view?.schema_version!==2||Object.keys(view).sort().join(',')!=='chat,conversation,own,schema_version,target')return null;view=view.conversation;}")
s=s.replace("if(view.schema_version!==2", "if(!view||view.schema_version!==2")
p.write_text(s,encoding='utf-8',newline='\n')
p=out/'runtime.mjs';s=p.read_text(encoding='utf-8').replace("{conversationPath,privatePayloadMetadata}","{conversationPath,roundViewPath,privatePayloadMetadata}").replace("request.url===conversationPath(holdSelection)","request.url===conversationPath(holdSelection)||request.url===roundViewPath(holdSelection)");p.write_text(s,encoding='utf-8',newline='\n')
p=out/'delivery-diagnostics.mjs';s=p.read_text(encoding='utf-8').replace('(target|conversation(?:\\/chat)?)$', '(view|target|conversation(?:\\/chat)?)$').replace("if(r.kind==='self-actions')actionsStart=started", "if(r.kind==='self-actions'||r.kind==='view')actionsStart=started")
needle="    const makeScope=s=>";assert needle in s
at=s.index(needle)
s=s[:at]+'''    if(row.route.kind==='view'){
     observed.transport_parts='ONE_ACTUAL_HTTP_ENVELOPE';
     observed.bundle={schema_version:integer(dto?.schema_version),own:safeDto(dto?.own,ended-row.started_native_ms),target:safeDto(dto?.target,ended-row.started_native_ms),conversation:safeDto(dto?.conversation,ended-row.started_native_ms),chat:safeDto(dto?.chat,ended-row.started_native_ms)};
     const ownScope=scope(dto?.own),input=ownScope?.session&&ownScope?.round?{room:row.route.room,member:a.id,identity:0,transport:0,...ownScope}:null;
     observed.validators={cache_accept_observed:false,target:input&&dto?.target?validators.target(dto.target,input):null,conversation:input&&dto?.conversation?validators.conversation(dto.conversation,input):null,chat:dto?.chat&&dto?.conversation?validators.chat(dto.chat,dto.conversation):null};
    }
'''+s[at:]
p.write_text(s,encoding='utf-8',newline='\n')
(out/'METHOD21.md').write_text('''# Bundled application transport adaptation21

Application switched from four sequential GET bodies to one coherent /view envelope. Observer splits only actual nested DTOs at the same actual request start/body-completion and feeds unchanged production validators/TopicCache; same5s permission/min250ms, source/auth/epoch/scope/consent oracles remain. One actual HTTP status is never counted as four endpoint responses. Legacy endpoint observation remains for direct functional reads and safe controls. Current own response retires prior accepted batch before decoding, including malformed bundle. Expired or crossscope nested parts reject through existing validators; no grant/epoch/clock extension.

Browser lastSelfActions reads nested own. Held-response tests recognize real /view bodies with selected actual private epoch/prompt; holding/release buffers entire original backend envelope without edit. Nativeclock test still blocksallGET/WSalive. Passive diagnostics retain one row perrequest, safe nestedmetadata only. No new scenarios, privateencounterbounds or mutationretries. Author controls/independent review/current binding pending; NOT_RUN.
''',encoding='utf-8',newline='\n')
print(out)
