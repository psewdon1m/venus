import type {GameView,PublicRound,PairCondition} from '@venus/contracts';
import type {RoundPlan,ConsentOffer,Mode,FrozenPack} from '@venus/relationship-engine';
import type {Cipher} from './security.js';
import {revision} from './rooms.js';
export interface GameRow {id:string;room_id:string;state:GameView['state'];pause_reason:GameView['pause_reason'];rev:string;mode:Mode;round_count:number;current_round:number;draft_cipher:Cipher;snapshot_cipher:Cipher|null;pack_digest:string|null;created_at:Date;updated_at:Date}
export interface RoundData {plan:RoundPlan;state:PublicRound['state'];invitation:ConsentOffer|null;action:ConsentOffer|null;choice:'truth'|'dare'|null;condition:PairCondition|null}
export interface RoundRow {id:string;room_id:string;session_id:string;round_index:number;state:PublicRound['state'];cipher:Cipher;created_at:Date}
export interface Draft {players:string[]}
export interface NameRow {id:string;display_name:string}
export type Locale='ru'|'en'|'tr';
/** One substitution pass: braces in a display name are plain text, never new placeholders. */
function substitute(raw:string,round:RoundData,names:readonly NameRow[]) {
  const roles=[round.plan.primary_member_id,round.plan.actors[1]];
  return raw.replace(/\{P([12])\}/g,(_match,index:string)=>names.find(n=>n.id===roles[Number(index)-1])?.display_name??'');
}
export function localText(pack:FrozenPack,round:RoundData,locale:Locale,names:readonly NameRow[]) {
  const card=pack.card(round.plan.card_id),text=card.text[locale];
  const raw=card.mode==='questions'?text.question:card.mode==='truth_or_dare'?(round.choice?text[round.choice]:null):text.proposal;
  if(!raw) return null;
  return substitute(raw,round,names);
}
/** Private YesBut must retain the reviewed instruction for the responding actor. */
export function privateText(pack:FrozenPack,round:RoundData,locale:Locale,names:readonly NameRow[]) {
  const prompt=localText(pack,round,locale,names);
  if(prompt===null||round.plan.mode!=='yes_but') return prompt;
  return prompt+'\n'+substitute(pack.card(round.plan.card_id).text[locale].responder!,round,names);
}
export function publicRound(pack:FrozenPack,round:RoundData,locale:Locale,names:readonly NameRow[]):PublicRound {
  const base={round_id:round.plan.round_id,round_index:round.plan.round_index,state:round.state};
  if(round.plan.interaction==='pair_private') return {...base,kind:'generic'};
  const response_state:Extract<PublicRound,{kind:'public'}>['response_state']=round.state==='completed'?'completed':round.state==='skipped'||round.state==='stopped'?'skipped':round.action?.state==='active'?'accepted':round.condition?'condition_proposed':'pending';
  const actors=round.plan.actors.length?[...round.plan.actors]:round.plan.mode==='truth_or_dare'?[round.plan.primary_member_id]:[];
  const common={...base,kind:'public' as const,card_id:round.plan.card_id,card_revision:round.plan.card_revision,actors,response_state,proposal_revision:round.action?.proposal_revision??1};
  const prompt=localText(pack,round,locale,names)??'';
  if(round.plan.mode==='questions') return {...common,mode:'questions',text:{question:prompt},choice:null};
  if(round.plan.mode==='truth_or_dare') return {...common,mode:'truth_or_dare',text:round.choice?{prompt}:null,choice:round.choice};
  const card=pack.card(round.plan.card_id);
  return {...common,mode:'yes_but',text:{proposal:prompt,responder:substitute(card.text[locale].responder!,round,names)},choice:null};
}
export function gameView(game:GameRow,current:PublicRound|null):GameView {return {session_id:game.id,game_rev:revision(game.rev),state:game.state,mode:game.mode,total_rounds:game.round_count,current_round:current,pause_reason:game.pause_reason};}
