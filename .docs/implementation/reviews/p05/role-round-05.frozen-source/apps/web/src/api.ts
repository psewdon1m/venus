import type {RoomView,EntryAcceptance} from '@venus/contracts';
export interface EntryPolicy {available:boolean;offer:null|{version:string;digest:string;text:Record<'ru'|'en'|'tr',string>;synthetic:boolean};csrf_token:string}
export class ApiError extends Error {constructor(readonly code:string) {super(code);}}
export class SessionApi {
  admissionCsrf='';private roomCsrf=new Map<string,string>();
  async request<T>(path:string,body?:unknown,method=body===undefined?'GET':'POST'):Promise<T> {
    const room=path.match(/^\/api\/v1\/rooms\/([a-f0-9-]{36})/i)?.[1];
    const publicAction=path==='/api/v1/rooms'||path==='/api/v1/invitations/resolve'||path.endsWith('/join');
    let response:Response;
    try {response=await fetch(path,{method,credentials:'same-origin',signal:AbortSignal.timeout(8000),headers:body===undefined?(room?{'x-csrf-token':this.roomCsrf.get(room)??''}:{}):{'content-type':'application/json','x-csrf-token':publicAction?this.admissionCsrf:this.roomCsrf.get(room??'')??''},...(body===undefined?{}:{body:JSON.stringify(body)})});}
    catch {throw new ApiError('SERVICE_UNAVAILABLE');}
    let result:unknown;try {result=await response.json();} catch {throw new ApiError('SERVICE_UNAVAILABLE');}
    if(!response.ok) throw new ApiError(result&&typeof result==='object'&&'code' in result&&typeof result.code==='string'?result.code:'SERVICE_UNAVAILABLE');
    const csrf=response.headers.get('x-csrf-token');
    if(csrf) {const id=room??(result&&typeof result==='object'&&'room_id' in result?String(result.room_id):'');this.roomCsrf.set(id,csrf);}
    return result as T;
  }
  async bootstrap() {const result=await this.request<EntryPolicy>('/api/v1/entry-policy');this.admissionCsrf=result.csrf_token;return result;}
}
export function acceptance(policy:EntryPolicy):EntryAcceptance {
  if(!policy.offer) throw new ApiError('ENTRY_POLICY_UNAVAILABLE');
  return {offer_version:policy.offer.version,offer_digest:policy.offer.digest,accept_offer:true,adult18:true};
}
export function inviteToken(value:string) {
  if(/^[A-Za-z0-9_-]{43}$/.test(value.trim())) return value.trim();
  try {const url=new URL(value);if(url.origin===location.origin) {const invite=new URLSearchParams(url.hash.slice(1)).get('invite');if(invite&&/^[A-Za-z0-9_-]{43}$/.test(invite)) return invite;}} catch { /* Return only a safe localized error. */ }
  throw new ApiError('INVITE_INVALID');
}
export function nextSnapshot(current:RoomView|null,frame:unknown):RoomView|null {
  if(!frame||typeof frame!=='object') return current;
  const e=frame as Record<string,unknown>;
  if(e.type!=='room.snapshot'||e.schema!==1||e.stream!=='room'||e.audience!=='room'||!Number.isSafeInteger(e.room_rev)||!Number.isSafeInteger(e.stream_rev)||e.room_rev!==e.stream_rev||typeof e.room_rev!=='number'||e.room_rev<0||!e.payload||typeof e.payload!=='object') return current;
  const view=e.payload as RoomView;
  if(view.room_id!==e.room_id||view.room_rev!==e.room_rev||!Array.isArray(view.members)||view.members.length>8) return current;
  if(current&&(view.room_id!==current.room_id||view.room_rev<=current.room_rev)) return current;
  return view;
}
