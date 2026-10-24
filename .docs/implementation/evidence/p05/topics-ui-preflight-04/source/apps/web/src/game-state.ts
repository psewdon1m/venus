import type {GameView} from '@venus/contracts';
const states=['draft','waiting','active','paused','completed','aborted'];
const modes=['questions','truth_or_dare','yes_but'];
const roundStates=['pending','active','completed','skipped','stopped'];
function object(value:unknown):value is Record<string,unknown> {return Boolean(value&&typeof value==='object'&&!Array.isArray(value));}
export function validGame(value:unknown):value is GameView {
 if(!object(value)||typeof value.session_id!=='string'||!Number.isSafeInteger(value.game_rev)||Number(value.game_rev)<0||!states.includes(String(value.state))||!modes.includes(String(value.mode))||!Number.isSafeInteger(value.total_rounds)||Number(value.total_rounds)<1||Number(value.total_rounds)>100||![null,'transport','safety'].includes(value.pause_reason as null)) return false;
 const r=value.current_round;if(r===null) return true;
 if(!object(r)||typeof r.round_id!=='string'||!Number.isSafeInteger(r.round_index)||Number(r.round_index)<1||Number(r.round_index)>Number(value.total_rounds)||!roundStates.includes(String(r.state))) return false;
 if(r.kind==='generic') return Object.keys(r).every(k=>['round_id','round_index','state','kind'].includes(k));
 if(r.kind!=='public'||typeof r.card_id!=='string'||!Number.isSafeInteger(r.card_revision)||!Array.isArray(r.actors)||r.actors.length>8||!r.actors.every(id=>typeof id==='string')||!Number.isSafeInteger(r.proposal_revision)||r.mode!==value.mode) return false;
 if(r.mode==='truth_or_dare') return [null,'truth','dare'].includes(r.choice as null)&&(r.text===null||object(r.text)&&typeof r.text.prompt==='string');
 if(!object(r.text)) return false;
 return r.mode==='questions'?typeof r.text.question==='string':r.mode==='yes_but'&&typeof r.text.proposal==='string'&&typeof r.text.responder==='string';
}
/** HTTP refresh may replace same-revision localized text. Old in-flight responses cannot replace a newer session: caller fences its read generation. */
export function acceptGame(current:GameView|null,incoming:unknown):GameView|null {
 if(!validGame(incoming)) return current;
 if(current?.session_id===incoming.session_id&&incoming.game_rev<current.game_rev) return current;
 return incoming;
}
export function gameFrame(frame:unknown,roomId:string):GameView|null {
 if(!object(frame)||frame.type!=='game.snapshot'||frame.schema!==1||frame.room_id!==roomId||frame.stream!=='game'||frame.audience!=='room'||!Number.isSafeInteger(frame.stream_rev)||frame.stream_rev!==frame.room_rev||!validGame(frame.payload)) return null;
 return frame.payload;
}
export function privateCleared(frame:unknown,roomId:string,memberId:string):boolean {
 return object(frame)&&frame.schema===1&&frame.room_id===roomId&&frame.stream==='private'&&frame.audience==='member'&&frame.target_member_id===memberId&&frame.type==='game.private_cleared';
}
export function terminalRound(game:GameView|null) {return Boolean(game?.current_round&&['completed','skipped','stopped'].includes(game.current_round.state));}
export function validCondition(value:string) {return value.trim().length>0&&[...value].length<=2000&&!/[\p{Cc}\u202A-\u202E\u2066-\u2069]/u.test(value);}
export function validChat(value:string) {return value.trim().length>0&&![...value].some(c=>c.length===1&&c.charCodeAt(0)>=0xD800&&c.charCodeAt(0)<=0xDFFF)&&[...value].length<=1000&&new TextEncoder().encode(value).length<=4096&&!/[\p{Cc}\p{Zl}\p{Zp}\u202A-\u202E\u2066-\u2069]/u.test(value);}
