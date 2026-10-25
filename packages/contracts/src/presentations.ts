/** Venus room-PDF contract v1; authority and bounded delivery stay server-owned. */
export type PresentationMode='scroll'|'slides';
export interface PresentationDocument {id:string;content_version:string;rev:number;title:string;default_mode:PresentationMode;allow_switch:boolean;page_count:number;available:boolean}
export interface PresentationLive {document_id:string;content_version:string;page_index:number}
export interface PresentationJob {id:string;document_id:string;state:'awaiting_upload'|'rendering'|'ready'|'failed'|'cancelled';expires_at:string;failure:'invalid_pdf'|'limits'|'cancelled'|'conflict'|'unavailable'|null}
export interface PresentationState {schema_version:1;room_id:string;epoch:string;rev:number;available:boolean;import_available:boolean;server_time:string;expires_at:string;can_control:boolean;documents:PresentationDocument[];live:PresentationLive|null;job:PresentationJob|null}
export interface PresentationMutation {expected_rev:number;idempotency_key:string}
export interface PresentationImport extends PresentationMutation {document_id:string|null;title:string;default_mode:PresentationMode;allow_switch:boolean;source_bytes:number;source_sha256:string}
export type PresentationCommand=PresentationMutation&({action:'settings';document_id:string;title:string;default_mode:PresentationMode;allow_switch:boolean}|{action:'delete';document_id:string}|{action:'start'|'page';document_id:string;content_version:string;page_index:number}|{action:'stop'});
