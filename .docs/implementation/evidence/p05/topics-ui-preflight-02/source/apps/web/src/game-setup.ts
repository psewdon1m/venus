import type {GameView,PrepareGame,RoomView} from '@venus/contracts';
import {ApiError} from './api.js';
export interface SetupIntent {mode:GameView['mode'];players:string[];round_count:number;idempotency_key:string}
/** Refresh the revision, never the user's choices. Structural changes require a
 * new visible decision after the authoritative room has been refreshed. */
export function freshPreparation(captured:RoomView,fresh:RoomView,intent:SetupIntent):PrepareGame {
 if(fresh.room_id!==captured.room_id||fresh.state!=='open'||!Number.isSafeInteger(fresh.room_rev)||fresh.room_rev<captured.room_rev||!Array.isArray(fresh.members)) throw new ApiError('GAME_SETUP_CHANGED');
 const before=captured.members.map(m=>m.id).sort(),after=fresh.members.map(m=>m.id).sort();
 if(fresh.meeting_context!==captured.meeting_context||before.join('|')!==after.join('|')||new Set(after).size!==after.length) throw new ApiError('GAME_SETUP_CHANGED');
 if(intent.players.length<2||intent.players.length>8||new Set(intent.players).size!==intent.players.length||!Number.isInteger(intent.round_count)||intent.round_count<1||intent.round_count>100) throw new ApiError('INVALID_GAME_PLAYERS');
 if(intent.players.some(id=>!fresh.members.some(m=>m.id===id&&m.setup_ready&&m.presence==='online'))) throw new ApiError('PLAYERS_NOT_READY');
 return {...intent,players:[...intent.players],expected_rev:fresh.room_rev};
}
