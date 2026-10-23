import {randomUUID} from 'node:crypto';
import type pg from 'pg';
import {privateChatLimits as limits,type PrivateChatSend,type PrivateChatReceipt,type PrivateChatView} from '@venus/contracts';
import {Keyring,requireThat,type Cipher} from './security.js';

export function privateChatEnabled(value:string|undefined):boolean {
  requireThat(value===undefined||value==='true'||value==='false','PRIVATE_CHAT_CONFIG_INVALID',503);return value==='true';
}
export function chatInput(value:unknown):PrivateChatSend {
  requireThat(value&&typeof value==='object'&&!Array.isArray(value),'INVALID_REQUEST',400);
  const input=value as Record<string,unknown>;
  requireThat(Object.keys(input).sort().join(',')==='request_id,text'&&typeof input.request_id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.request_id),'INVALID_REQUEST',400);
  requireThat(typeof input.text==='string'&&input.text.trim().length>0&&![...input.text].some(char=>char.length===1&&char.charCodeAt(0)>=0xD800&&char.charCodeAt(0)<=0xDFFF)&&[...input.text].length<=limits.messageScalars&&Buffer.byteLength(input.text,'utf8')<=limits.messageBytes&&!/[\p{Cc}\p{Zl}\p{Zp}\u202A-\u202E\u2066-\u2069]/u.test(input.text),'INVALID_REQUEST',400);
  return {request_id:input.request_id.toLowerCase(),text:input.text};
}
interface Scope {room:string;session:string;round:string;until:number}
interface StoredScope {rev:string;total:number;minute:string;actor_counts:Record<string,number>;last_sent_at:Date|null;expires_at:Date}
/** SQL contains ciphertext and bounded metadata only. Volatile grants cannot be
 * reconstructed from backup: only newly created rounds in this API boot qualify. */
export class PrivateChat {
  readonly boot=randomUUID();
  private readonly grants=new Map<string,Scope>();
  private clockFloor=0;
  constructor(private readonly keys:Keyring,private readonly rawClock:()=>number) {}
  private clock() {
    const now=this.rawClock();requireThat(Number.isSafeInteger(now)&&now>=this.clockFloor,'PRIVATE_CHAT_TIME_INVALID',409);
    this.clockFloor=now;return now;
  }
  register(room:string,session:string,round:string) {
    const now=this.clock();for(const [id,grant] of this.grants) if(grant.until<=now) this.grants.delete(id);
    const previous=this.grants.get(round);
    if(previous) return previous.room===room&&previous.session===session;
    if(this.grants.size>=limits.activeScopes) return false;
    this.grants.set(round,{room,session,round,until:now+limits.ttl});return true;
  }
  eligible(room:string,session:string,round:string) {
    const now=this.rawClock();if(!Number.isSafeInteger(now)||now<this.clockFloor) return false;this.clockFloor=now;
    const grant=this.grants.get(round);
    if(grant&&grant.until<=now) {this.grants.delete(round);return false;}
    return Boolean(grant&&grant.room===room&&grant.session===session);
  }
  async revoke(c:pg.PoolClient,room:string,round?:string) {
    for(const [id,grant] of this.grants) if(grant.room===room&&(!round||id===round)) this.grants.delete(id);
    await c.query('DELETE FROM private_chat_scopes WHERE room_id=$1'+(round?' AND round_id=$2':''),round?[room,round]:[room]);
  }
  async prune(c:pg.PoolClient,room:string) {
    const now=this.clock();for(const [id,grant] of this.grants) if(grant.until<=now) this.grants.delete(id);
    await c.query('DELETE FROM private_chat_scopes WHERE room_id=$3 AND (expires_at<=$1 OR boot_id<>$2)',[new Date(now),this.boot,room]);
    await c.query('DELETE FROM private_chat_messages WHERE room_id=$2 AND expires_at<=$1',[new Date(now),room]);
    await c.query('DELETE FROM private_chat_requests WHERE room_id=$2 AND expires_at<=$1',[new Date(now),room]);
  }
  async send(c:pg.PoolClient,room:string,session:string,round:string,member:string,until:number,input:PrivateChatSend):Promise<PrivateChatReceipt> {
    const now=this.clock(),expires=Math.min(until,now+limits.ttl,this.grants.get(round)?.until??0);
    requireThat(this.eligible(room,session,round)&&expires>now,'PRIVATE_CHAT_UNAVAILABLE',404);
    await c.query('INSERT INTO private_chat_scopes(round_id,room_id,session_id,boot_id,expires_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(round_id) DO NOTHING',[round,room,session,this.boot,new Date(expires)]);
    const scope=(await c.query<StoredScope>('SELECT * FROM private_chat_scopes WHERE room_id=$1 AND session_id=$2 AND round_id=$3 AND boot_id=$4 FOR UPDATE',[room,session,round,this.boot])).rows[0];
    requireThat(scope&&scope.expires_at.getTime()>now,'PRIVATE_CHAT_UNAVAILABLE',404);
    const old=(await c.query<{request_hash:string;receipt:PrivateChatReceipt;expires_at:Date}>('SELECT request_hash,receipt,expires_at FROM private_chat_requests WHERE round_id=$1 AND member_id=$2 AND request_id=$3',[round,member,input.request_id])).rows[0];
    if(old) {requireThat(this.keys.matchesFingerprint(input,old.request_hash),'IDEMPOTENCY_CONFLICT',409);requireThat(old.expires_at.getTime()>now,'PRIVATE_CHAT_EXPIRED',409);return old.receipt;}
    const minute=Math.floor(now/60000),counts=Number(scope.minute)===minute?scope.actor_counts:{},count=counts[member]??0;
    requireThat(scope.last_sent_at===null||scope.last_sent_at.getTime()<=now,'PRIVATE_CHAT_TIME_INVALID',409);
    requireThat(count<limits.perMinute,'RATE_LIMITED',429);requireThat(scope.total<limits.perRound,'PRIVATE_CHAT_VOLUME_LIMIT',429);
    const rev=Number(scope.rev)+1,messageId=randomUUID(),expiry=new Date(Math.min(expires,scope.expires_at.getTime())).toISOString();
    const receipt:PrivateChatReceipt={request_id:input.request_id,message_id:messageId,chat_rev:rev,expires_at:expiry};
    await c.query('INSERT INTO private_chat_messages(message_id,room_id,session_id,round_id,member_id,chat_rev,cipher,sent_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[messageId,room,session,round,member,rev,this.keys.encrypt({text:input.text},`private-chat:${room}:${session}:${round}:${messageId}:1`),new Date(now),new Date(expiry)]);
    await c.query('INSERT INTO private_chat_requests(room_id,session_id,round_id,member_id,request_id,request_hash,receipt,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[room,session,round,member,input.request_id,this.keys.fingerprint(input),receipt,new Date(expiry)]);
    await c.query('UPDATE private_chat_scopes SET rev=$2,total=total+1,minute=$3,actor_counts=$4,last_sent_at=$5 WHERE round_id=$1',[round,rev,minute,{...counts,[member]:count+1},new Date(now)]);
    await c.query('DELETE FROM private_chat_messages WHERE round_id=$1 AND (expires_at<=$2 OR chat_rev<=$3)',[round,new Date(now),rev-limits.buffer]);
    return receipt;
  }
  async view(c:pg.PoolClient,room:string,session:string,round:string,until:number):Promise<PrivateChatView> {
    const scope=(await c.query<{rev:string;expires_at:Date;last_sent_at:Date|null}>('SELECT rev,expires_at,last_sent_at FROM private_chat_scopes WHERE room_id=$1 AND session_id=$2 AND round_id=$3 AND boot_id=$4',[room,session,round,this.boot])).rows[0];
    const rows=(await c.query<{message_id:string;member_id:string;cipher:Cipher;sent_at:Date;expires_at:Date}>('SELECT message_id,member_id,cipher,sent_at,expires_at FROM private_chat_messages WHERE room_id=$1 AND session_id=$2 AND round_id=$3 AND expires_at>$4 ORDER BY chat_rev DESC LIMIT 32',[room,session,round,new Date(this.clock())])).rows.reverse();
    const expiry=Math.min(until,this.grants.get(round)?.until??0,scope?.expires_at.getTime()??Infinity);
    const now=this.clock();
    requireThat(!scope||scope.last_sent_at===null||scope.last_sent_at instanceof Date&&scope.last_sent_at.getTime()<=now,'PRIVATE_CHAT_TIME_INVALID',409);
    requireThat(this.eligible(room,session,round)&&expiry>now,'PRIVATE_CHAT_UNAVAILABLE',404);
    return {session_id:session,round_id:round,chat_rev:Number(scope?.rev??0),expires_at:new Date(expiry).toISOString(),messages:rows.filter(row=>row.expires_at.getTime()>now&&row.sent_at.getTime()<=now).map(row=>({message_id:row.message_id,sender_member_id:row.member_id,...this.keys.decrypt<{text:string}>(row.cipher,`private-chat:${room}:${session}:${round}:${row.message_id}:1`),sent_at:row.sent_at.toISOString(),expires_at:row.expires_at.toISOString()}))};
  }
}
