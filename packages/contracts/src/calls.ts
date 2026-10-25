export type CallKind='general_call'|'pair_call';
export interface CallScopeView {id:string;rev:number;kind:CallKind;state:'pending'|'active';members:string[];inviter_member_id:string;expires_at:string;participants:{lease_id:string;member_id:string}[]}
export interface CallsView {schema_version:1;room_id:string;available:boolean;transport_ready:boolean;general:CallScopeView|null;pairs:CallScopeView[];self_lease:{lease_id:string;scope_id:string;kind:CallKind;audio:boolean;video:boolean}|null}
export interface CallGrant {schema_version:1;lease_id:string;scope_id:string;kind:CallKind;call_rev:number;audio:boolean;video:boolean;expires_at:string;signaling_url:string;token:string}
export interface CallMutation {expected_rev:number;idempotency_key:string}
export interface CallJoin extends CallMutation {audio:boolean;video:boolean}
