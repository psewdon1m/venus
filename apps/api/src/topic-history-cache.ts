import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {canonical} from '@venus/relationship-engine';

interface HistoryIdentity {room:string;session:string;snapshot:object;pack:object;map:object}
interface Entry<T> {identity:HistoryIdentity;digest:string;value:T;bytes:number;created:number}
const maxBytes=16*1024*1024;
/** Authentication and fresh storage reads precede every call. This memo skips
 * only immutable history validation. Encoded UTF8 weight is not a JS heap cap. */
export class TopicHistoryCache<T> {
 private entries:Entry<T>[]=[];
 private lastTime:number|null=null;
 private timer:ReturnType<typeof setTimeout>|null=null;
 constructor(private readonly clock:()=>number=()=>performance.now()){}
 clear(){if(this.timer!==null)clearTimeout(this.timer);this.timer=null;this.entries=[];this.lastTime=null;}
 forgetRoom(room:string){this.entries=this.entries.filter(entry=>entry.identity.room!==room);this.schedule();}
 private time():number|null {
  let now:number;try{now=this.clock();}catch{this.clear();return null;}
  if(!Number.isFinite(now)||now<0||this.lastTime!==null&&now<this.lastTime){this.clear();return null;}
  this.lastTime=now;return now;
 }
 private expire(now:number){this.entries=this.entries.filter(entry=>now-entry.created<30000);}
 private schedule(){
  if(this.timer!==null)clearTimeout(this.timer);this.timer=null;
  if(!this.entries.length)return;
  const now=this.time();if(now===null)return;
  const until=Math.min(...this.entries.map(entry=>entry.created+30000));
  this.timer=setTimeout(()=>{this.timer=null;const current=this.time();if(current===null)return;this.expire(current);this.schedule();},Math.max(1,until-now));this.timer.unref();
 }
 read<Raw>(identity:HistoryIdentity,authenticated:Raw,validate:(raw:Raw)=>T):T {
  let encoded:string;try{encoded=canonical(authenticated);}catch(error){this.clear();throw error;}
  const weight=Buffer.byteLength(encoded),digest=createHash('sha256').update(encoded).digest('hex'),now=this.time();
  if(now===null)return validate(authenticated);
  this.expire(now);
  const index=this.entries.findIndex(entry=>{const old=entry.identity;return old.room===identity.room&&old.session===identity.session&&old.snapshot===identity.snapshot&&old.pack===identity.pack&&old.map===identity.map&&entry.digest===digest;});
  if(index>=0){const entry=this.entries.splice(index,1)[0]!;this.entries.push(entry);return entry.value;}
  // A changed history/snapshot/source replaces the older value for this exact
  // session; prior versions never accumulate behind a current entry.
  this.entries=this.entries.filter(entry=>entry.identity.room!==identity.room||entry.identity.session!==identity.session);
  let value:T;try{value=validate(authenticated);}catch(error){this.clear();throw error;}
  const created=this.time();if(created===null)return value;
  this.expire(created);
  if(weight>maxBytes){this.schedule();return value;}
  this.entries.push({identity:{...identity},digest,value,bytes:weight,created});
  while(this.entries.length>32||this.entries.reduce((n,entry)=>n+entry.bytes,0)>maxBytes)this.entries.shift();
  this.schedule();return value;
 }
}
