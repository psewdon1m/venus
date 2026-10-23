import {performance} from 'node:perf_hooks';

interface SnapshotIdentity {room:string;session:string;cipher:string;pack:object;map:object}
interface Entry<T> {identity:SnapshotIdentity;value:T;created:number}
/** Reuses only previously validated immutable values. Authentication precedes
 * every lookup; no access, membership, history, source or delivery grant lives here. */
export class TopicSnapshotCache<T> {
 private entries:Entry<T>[]=[];
 private lastTime:number|null=null;
 private timer:ReturnType<typeof setTimeout>|null=null;
 constructor(private readonly clock:()=>number=()=>performance.now()){}
 clear(){if(this.timer!==null)clearTimeout(this.timer);this.timer=null;this.entries=[];this.lastTime=null;}
 forgetRoom(room:string){this.entries=this.entries.filter(entry=>entry.identity.room!==room);this.schedule();}
 private time():number|null {
  const now=this.clock();
  if(!Number.isFinite(now)||now<0||this.lastTime!==null&&now<this.lastTime){this.clear();return null;}
  this.lastTime=now;return now;
 }
 private expire(now:number){this.entries=this.entries.filter(entry=>now-entry.created<30000);}
 private schedule(){
  if(this.timer!==null)clearTimeout(this.timer);this.timer=null;
  if(!this.entries.length)return;
  const now=this.time();if(now===null)return;
  const until=Math.min(...this.entries.map(entry=>entry.created+30000));
  this.timer=setTimeout(()=>{this.timer=null;const current=this.time();if(current===null)return;this.expire(current);this.schedule();},Math.max(1,until-now));
  this.timer.unref();
 }
 read<Raw>(identity:SnapshotIdentity,authenticate:()=>Raw,validate:(raw:Raw)=>T):T {
  // A hit never bypasses ciphertext authentication, AAD or a missing/rotated key.
  let raw:Raw;try{raw=authenticate();}catch(error){this.clear();throw error;}
  const now=this.time();if(now===null)return validate(raw);
  this.expire(now);
  const index=this.entries.findIndex(entry=>{const old=entry.identity;return old.room===identity.room&&old.session===identity.session&&old.cipher===identity.cipher&&old.pack===identity.pack&&old.map===identity.map;});
  if(index>=0){const entry=this.entries.splice(index,1)[0]!;this.entries.push(entry);return entry.value;}
  let value:T;try{value=validate(raw);}catch(error){this.clear();throw error;}
  const created=this.time();if(created===null)return value;
  this.entries.push({identity:{...identity},value,created});if(this.entries.length>32)this.entries.shift();this.schedule();return value;
 }
}
