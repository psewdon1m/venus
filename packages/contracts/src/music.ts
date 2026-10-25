export interface MusicTrack {id:string;title:Record<'ru'|'en'|'tr',string>;duration_ms:number;synthetic:boolean}
export interface MusicState {schema_version:1;room_id:string;rev:number;catalog_digest:string;server_time:string;status:'paused'|'playing';queue:string[];index:number;track:MusicTrack|null;position_ms:number;reason:'ready'|'empty'|'track_unavailable';can_control:boolean;default_speaker:boolean}
export type MusicCommand={expected_rev:number;idempotency_key:string}&({action:'queue';tracks:string[]}|{action:'play'|'pause'|'next'|'previous'}|{action:'seek';position_ms:number});
