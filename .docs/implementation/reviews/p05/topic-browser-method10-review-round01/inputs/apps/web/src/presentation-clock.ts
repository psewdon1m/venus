import type {GameView} from '@venus/contracts';
import type {AuthToken} from './game-operations.js';
// The epoch anchor preserves v1 absolute expires_at compatibility. Only elapsed
// performance time is read after initialization: wall adjustments never extend
// presentation, permission, retry or safety leases. There is no wall fallback.
const epochAnchor=Date.now(),elapsedAnchor=performance.now();
export function presentationNow(){return epochAnchor+(performance.now()-elapsedAnchor);}
interface PublicRead{binding:string;generation:number}
/** Content lease is separate from opaque game/round identity and own safety
 * facts. HTTP GameView plus fresh own metadata renews it; WS/disconnect/clear
 * never authorizes stale public text or destroys Stop/Pause identity. */
export class PublicGameLease{
 private binding='';private generation=0;private until=0;private wall=0;
 bind(auth:AuthToken,game:GameView|null){const key=JSON.stringify([auth.room,auth.member,auth.identity,auth.transport,game?.session_id,game?.game_rev,game?.current_round?.round_id]);if(key!==this.binding){this.binding=key;this.clear();}return this.issue();}
 issue():PublicRead{return {binding:this.binding,generation:this.generation};}
 clear(){this.generation++;this.until=0;}
 grant(read:PublicRead,started:number,received:number,serverTime:string,expiresAt:string){this.wall=Math.max(this.wall,received);const duration=Math.min(5000,Date.parse(expiresAt)-Date.parse(serverTime));if(read.binding!==this.binding||read.generation!==this.generation||!Number.isFinite(duration)||duration<=0||received<started||started+duration<=this.wall)return false;this.until=started+duration;return true;}
 visible(now=presentationNow()){this.wall=Math.max(this.wall,now);return this.wall<this.until;}
}
