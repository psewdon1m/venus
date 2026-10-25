import {createCipheriv,createDecipheriv,createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync,openSync,writeSync,fsyncSync,closeSync,renameSync,unlinkSync} from 'node:fs';
export class DomainError extends Error {
  constructor(public readonly code:string,public readonly statusCode:number) {super('Request could not be completed');}
}
export function requireThat(condition:unknown,code:string,status=403):asserts condition {if(!condition) throw new DomainError(code,status);}
export const token = () => randomBytes(32).toString('base64url');
export const hash = (value:string) => createHash('sha256').update(value).digest('hex');
export function equal(a:string,b:string) {const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function canonical(value:unknown):string {
  if(value===null||typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
}
export interface Cipher {key_version:string;nonce:string;tag:string;data:string;format:'padded-json-v1'|'json-v1'}
export class Keyring {
  constructor(readonly current:string,private readonly keys:Record<string,string>) {
    requireThat(Object.hasOwn(keys,current)&&Object.keys(keys).every(v=>/^[A-Za-z0-9_-]{1,64}$/.test(v))&&Object.values(keys).every(k=>Buffer.from(k,'base64').length===32),'KEYRING_INVALID',503);
  }
  static fromFile(path:string) {const v=JSON.parse(readFileSync(path,'utf8')) as {current:string;keys:Record<string,string>};return new Keyring(v.current,v.keys);}
  sign(value:string) {return createHmac('sha256',Buffer.from(this.keys[this.current]!,'base64')).update(value).digest('base64url');}
  fingerprint(value:unknown,version=this.current) {
    const key=this.keys[version];requireThat(key,'KEY_VERSION_UNAVAILABLE',503);
    return version+':'+createHmac('sha256',Buffer.from(key,'base64')).update('venus:idempotency:v1:'+canonical(value)).digest('base64url');
  }
  matchesFingerprint(value:unknown,stored:string) {return equal(this.fingerprint(value,stored.split(':')[0]),stored);}
  encrypt(value:unknown,aad:string,padded=true):Cipher {
    const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(this.keys[this.current]!,'base64'),iv);
    const json=Buffer.from(JSON.stringify(value));const format=padded?'padded-json-v1':'json-v1';
    requireThat(!padded||json.length<=16380,'ENCRYPTED_VALUE_TOO_LARGE',503);
    const plain=padded?randomBytes(16384):json;
    if(padded) {plain.writeUInt32BE(json.length);json.copy(plain,4);}
    cipher.setAAD(Buffer.from(aad+':'+format));
    const data=Buffer.concat([cipher.update(plain),cipher.final()]).toString('base64');
    return {key_version:this.current,nonce:iv.toString('base64'),data,tag:cipher.getAuthTag().toString('base64'),format};
  }
  /** Binary assets are length-bounded by their caller. JSON envelope semantics stay unchanged. */
  encryptBinary(plain:Buffer,aad:string):Buffer {
    requireThat(plain.length<=64*1024*1024,'ENCRYPTED_VALUE_TOO_LARGE',503);
    const keyVersion=Buffer.from(this.current),nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(this.keys[this.current]!,'base64'),nonce);
    cipher.setAAD(Buffer.from(aad+':binary-v1'));
    return Buffer.concat([Buffer.from('VBN1'),Buffer.from([keyVersion.length]),keyVersion,nonce,cipher.update(plain),cipher.final(),cipher.getAuthTag()]);
  }
  decryptBinary(value:Buffer,aad:string,maximum:number):Buffer {
    requireThat(value.length>=34&&value.subarray(0,4).toString()==='VBN1','CIPHER_FORMAT_INVALID',503);
    const n=value[4]!,offset=5+n;requireThat(n>0&&n<=64&&value.length>=offset+28&&value.length-offset-28<=maximum,'CIPHER_FORMAT_INVALID',503);
    const key=this.keys[value.subarray(5,offset).toString()];requireThat(key,'KEY_VERSION_UNAVAILABLE',503);
    const cipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'base64'),value.subarray(offset,offset+12));cipher.setAAD(Buffer.from(aad+':binary-v1'));cipher.setAuthTag(value.subarray(-16));
    return Buffer.concat([cipher.update(value.subarray(offset+12,-16)),cipher.final()]);
  }
  decrypt<T>(value:Cipher,aad:string):T {
    const key=this.keys[value.key_version];requireThat(key,'KEY_VERSION_UNAVAILABLE',503);
    const cipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'base64'),Buffer.from(value.nonce,'base64'));
    requireThat(value.format==='padded-json-v1'||value.format==='json-v1','CIPHER_FORMAT_INVALID',503);
    cipher.setAAD(Buffer.from(aad+':'+value.format));cipher.setAuthTag(Buffer.from(value.tag,'base64'));
    const plain=Buffer.concat([cipher.update(Buffer.from(value.data,'base64')),cipher.final()]);
    if(value.format==='padded-json-v1') {
      requireThat(plain.length===16384&&plain.readUInt32BE()<=16380,'CIPHER_FORMAT_INVALID',503);
      return JSON.parse(plain.subarray(4,4+plain.readUInt32BE()).toString('utf8')) as T;
    }
    return JSON.parse(plain.toString('utf8')) as T;
  }
}
export class DeletionLedger {
  private closed=new Map<string,number>();
  constructor(private readonly path:string,private readonly checkpoint?:()=>void) {
    checkpoint?.();
    const fd=openSync(path,'a+',0o600);closeSync(fd);
    this.reload();
  }
  private reload() {
    this.closed.clear();
    for(const row of readFileSync(this.path,'utf8').split('\n').filter(Boolean)) {
      const entry=JSON.parse(row) as {room_id:string;closed_at:number};
      requireThat(/^[a-f0-9-]{36}$/.test(entry.room_id)&&Number.isFinite(entry.closed_at),'LEDGER_INVALID',503);
      this.closed.set(entry.room_id,entry.closed_at);
    }
  }
  contains(roomId:string) {this.checkpoint?.();return this.closed.has(roomId);}
  entries() {this.checkpoint?.();return [...this.closed.entries()];}
  revoke(roomId:string,now:number) {
    this.lock(()=>{
      if(this.closed.has(roomId)) return;
      const fd=openSync(this.path,'a');
      try {writeSync(fd,JSON.stringify({room_id:roomId,closed_at:now})+'\n');fsyncSync(fd);} finally {closeSync(fd);}
      this.closed.set(roomId,now);
      this.checkpoint?.();
    });
  }
  private lock(operation:()=>void) {
    const lockPath=this.path+'.lock';let fd:number;
    try {fd=openSync(lockPath,'wx',0o600);} catch {throw new DomainError('LEDGER_BUSY',503);}
    try {this.reload();operation();} finally {closeSync(fd);unlinkSync(lockPath);}
  }
  prune(now:number,retention:number) {
    this.lock(()=>{
      const remaining=[...this.closed.entries()].filter(([,closedAt])=>now-closedAt<retention);
      if(remaining.length===this.closed.size) return;
      const path=this.path+'.new-'+randomBytes(8).toString('hex'),fd=openSync(path,'wx',0o600);
      try {writeSync(fd,remaining.map(([room_id,closed_at])=>JSON.stringify({room_id,closed_at})+'\n').join(''));fsyncSync(fd);} finally {closeSync(fd);}
      renameSync(path,this.path);this.reload();
    });
  }
}
