export type RetryKind='setup'|'public'|'invitation'|'action'|'condition'|'chat';
export interface RetryScope {room:string;member:string;identity:number;transport:number;session:string|null;round:string|null;kind:RetryKind;offer:string|null;proposal:number|null;deadline:number|null}
export interface RetryContext {room:string;member:string;identity:number;transport:number;session:string|null;round:string|null;connected:boolean;grants:{kind:RetryKind;offer:string;proposal:number;deadline:number}[]}
export function retryAllowed(scope:RetryScope,context:RetryContext,now:number):boolean {
 if(scope.room!==context.room||scope.member!==context.member||scope.identity!==context.identity) return false;
 if(scope.kind==='setup') return true;
 if(scope.session!==context.session||scope.round!==context.round) return false;
 if(scope.kind==='public') return true;
 return context.connected&&scope.transport===context.transport&&scope.deadline!==null&&now<scope.deadline&&context.grants.some(g=>g.kind===scope.kind&&g.offer===scope.offer&&g.proposal===scope.proposal&&g.deadline===scope.deadline&&now<g.deadline);
}
export type RetryOperation=(current:()=>boolean)=>Promise<void>;
interface Entry {id:number;scope:RetryScope;operation:RetryOperation|null}
/** React stores an opaque numeric ID. Clearing mutates the only retained entry,
 * so old DOM handlers cannot keep or recover its private payload callback. */
export class RetryVault {
 private sequence=0;private entry:Entry|null=null;
 install(operation:RetryOperation,scope:RetryScope):number {this.clear();this.entry={id:++this.sequence,scope,operation};return this.entry.id;}
 get active():Readonly<Entry>|null {return this.entry;}
 get(id:number):Readonly<Entry>|null {return this.entry?.id===id?this.entry:null;}
 clear() {if(this.entry) this.entry.operation=null;this.entry=null;}
}

export interface AuthToken {room:string;member:string;identity:number;transport:number;connected:boolean}
/** A deny-first authorization resource, independent of passive React effects.
 * bind performs no network or React state update. An abandoned render can only
 * revoke an older grant; it cannot authorize that older token again. */
export class AuthBoundary {
 private token:AuthToken;readonly vault=new RetryVault();
 constructor(room:string,member:string,connected:boolean) {this.token={room,member,identity:1,transport:1,connected};}
 bind(room:string,member:string,connected:boolean):AuthToken {
  const changed=room!==this.token.room||member!==this.token.member,transport=changed||connected!==this.token.connected;
  if(transport) {this.vault.clear();this.token={room,member,connected,identity:this.token.identity+(changed?1:0),transport:this.token.transport+1};}
  return this.token;
 }
 get current():AuthToken {return this.token;}
 sameIdentity(token:AuthToken|null):boolean {return Boolean(token&&token.room===this.token.room&&token.member===this.token.member&&token.identity===this.token.identity);}
 sameTransport(token:AuthToken|null):boolean {return this.sameIdentity(token)&&token?.transport===this.token.transport;}
}
