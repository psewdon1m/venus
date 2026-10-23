from pathlib import Path
import datetime
r=Path.cwd();p=r/'apps/api/src/request-error-diagnostic.ts';s=p.read_bytes().decode()
s+='''
const websocketDomainCodes=new Set(['AUTH_REQUIRED','ENTRY_REACCEPT_REQUIRED','ROOM_CLOSED','SOCKET_REPLACED','ACTORS_UNAVAILABLE','INVALID_REQUEST','RATE_LIMITED','TICKET_INVALID','CONSENT_EXPIRED','PRIVATE_CHAT_UNAVAILABLE','PRIVATE_EVENT_CAPACITY','TOPIC_ROOM_RETIRED','TOPIC_ROOM_MEMBER_RETIRED','TOPIC_ROOM_MEMBER_NOT_ADMITTED','TOPIC_ROOM_BUSY','TOPIC_LEDGER_BUSY','TOPIC_STATE_CHANGED','TOPIC_ROOM_BIRTH_UNAVAILABLE']);
/** WS operator diagnostic only. The default HTTP projection remains unchanged. */
export function websocketErrorDiagnostic(error:unknown):RequestErrorDiagnostic&{domain_code?:string}{
 const diagnostic=requestErrorDiagnostic(error);
 if(!safePrototypeChain(error)||!types.isNativeError(error))return diagnostic;
 const code=data(error,'code');
 return typeof code==='string'&&websocketDomainCodes.has(code)?{...diagnostic,domain_code:code}:diagnostic;
}
''';p.write_bytes(s.encode())
p=r/'apps/api/src/room-routes.ts';s=p.read_bytes().decode();s="import {websocketErrorDiagnostic} from './request-error-diagnostic.js';\r\n"+s
old="let lastPing=-Infinity,pollPending=false;";new="let lastPing=-Infinity,pollPending=false,failureLogged=false;\r\n    function failed(error:unknown,phase:'auth_or_heartbeat'|'poll') {\r\n      if(!failureLogged) {failureLogged=true;try {\r\n        const request_id=typeof request.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(request.id)?request.id:undefined;\r\n        app.log.warn({event:'websocket_failed',phase,...(request_id?{request_id}:{}),...websocketErrorDiagnostic(error)},'websocket_failed');\r\n      } catch {/* Diagnostics must not suppress the existing fail-closed socket close. */}}\r\n      socket.close(4401,'Connection unavailable');\r\n    }"
assert s.count(old)==1;s=s.replace(old,new)
assert s.count(".catch(()=>{socket.close(4401,'Connection unavailable');});")==1;s=s.replace(".catch(()=>{socket.close(4401,'Connection unavailable');});",".catch(error=>failed(error,'auth_or_heartbeat'));")
assert s.count(".catch(()=>socket.close(4401,'Connection unavailable'))")==1;s=s.replace(".catch(()=>socket.close(4401,'Connection unavailable'))",".catch(error=>failed(error,'poll'))")
p.write_bytes(s.encode())
with (r/'.history/agents/2026-10-21-p05-ws-safe-failure01-author.md').open('a',encoding='utf-8') as f:f.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — BaselineRED exit1 preserved beforeprod edits. Addedexact18literal WS-only helperextension withsame safeinternals; defaultHTTPfunction unchanged. Two routecatchsites nowonce/socket safeevent; loggerfailure stillclose4401. No timers/handlers/clientpayload/APPsemantics change. Focusedchecks next.\n')
