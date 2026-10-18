/** Declared observer adapter: production publicRound renderer, synthetic all-accept users.
 * No private delivery or preferences enter this transcript. Network latency, human
 * hesitation/refusal, names/locale selection and physical actions are not modeled.
 */
import {publicRound} from '../../apps/api/dist/games-model.js';
export const transcriptPolicy='P03-M2.ALL_ACCEPT.ONE_TICK_PER_MUTATION';
export const publicFeatureNames=publicCards=>[
  ...['group','solo','pair_public','generic'].map(x=>'interaction:'+x),
  ...Array.from({length:8},(_,i)=>'visible_role:'+i),
  ...Array.from({length:8},(_,i)=>'ordered_first:'+i),
  ...Array.from({length:8},(_,i)=>'ordered_second:'+i),
  ...Array.from({length:64},(_,i)=>'ordered_pair:'+Math.floor(i/8)+':'+i%8),
  ...Array.from({length:4},(_,i)=>'private_stage:'+(i+1)),
  ...['pending','active','completed','skipped','stopped'].map(x=>'round_state:'+x),
  ...['pending','accepted','completed','skipped','condition_proposed'].map(x=>'response_state:'+x),
  ...['none','truth','dare'].map(x=>'choice:'+x),
  'frames','last_game_revision','last_stream_revision','elapsed_ticks','serialized_bytes','proposal_revision','generic_frames',
  ...publicCards.map(c=>'card:'+c.id)
];
export function transcriptAccumulator(pack,players) {
  const publicCards=pack.cards.filter(c=>c.interaction!=='pair_private'),names=publicFeatureNames(publicCards),features=new Float64Array(names.length),positions=new Map(names.map((n,i)=>[n,i]));
  const display=players.map((p,i)=>({id:p.id,display_name:'OBSERVER_ROLE_'+i+'_END'}));let revision=1,ticks=0;
  const inc=(name,n=1)=>{const i=positions.get(name);if(i!==undefined) features[i]+=n;};
  return {
    names,
    add(plan) {
      const card=pack.card(plan.card_id),privatePair=plan.interaction==='pair_private';
      inc('interaction:'+(privatePair?'generic':plan.interaction));if(privatePair) inc('private_stage:'+plan.stage);else inc('card:'+plan.card_id);
      // Every committed mutation yields an observable current public snapshot.
      const data={plan,state:privatePair||plan.requires_action_consent||plan.mode==='truth_or_dare'?'pending':'active',invitation:null,action:null,choice:null,condition:null};
      const frames=[];
      const push=()=>{const projection=publicRound(pack,data,'en',display);const frame={type:'game.snapshot',stream:'game',stream_rev:revision++,game_rev:revision-1,at_tick:ticks++,current_round:projection};frames.push(frame);};
      push();
      if(privatePair) {push();push();} // Independent invitation acknowledgements.
      if(plan.mode==='truth_or_dare') {data.choice='truth';if(!plan.requires_action_consent) data.state='active';push();}
      if(plan.requires_action_consent) {data.action={state:'pending',proposal_revision:1};push();data.action={state:'active',proposal_revision:1};data.state='active';push();}
      data.state='completed';if(data.action) data.action={...data.action,state:'completed'};push();
      for(const frame of frames) {
        const round=frame.current_round;
        if(round.kind==='generic'&&Object.keys(round).sort().join(',')!=='kind,round_id,round_index,state') throw new Error('STRUCTURAL_PRIVATE_FIELD');
        const forbidden=new Set(['edges','comfort','pairClass','pair_class','relationship_scope','invitation','condition','private_text','refusal_reason','seed']);
        const inspect=value=>{if(value&&typeof value==='object') for(const [key,child] of Object.entries(value)) {if(forbidden.has(key)) throw new Error('STRUCTURAL_FORBIDDEN_FIELD:'+key);inspect(child);}};inspect(frame);
        inc('frames');inc('serialized_bytes',Buffer.byteLength(JSON.stringify(frame)));inc('round_state:'+round.state);
        if(round.kind==='generic') inc('generic_frames');else {
          inc('response_state:'+round.response_state);inc('proposal_revision',round.proposal_revision);
          inc('choice:'+(round.choice??'none'));
          // Text reveals a solo P1 even when public actors=[]; include every name token.
          const visible=new Set(round.actors);for(const [i,p] of players.entries()) if(JSON.stringify(round.text).includes('OBSERVER_ROLE_'+i+'_END')) visible.add(p.id);
          for(const actor of visible) inc('visible_role:'+players.findIndex(p=>p.id===actor));
          const actorIndices=round.actors.map(id=>players.findIndex(p=>p.id===id));
          if(actorIndices.length) inc('ordered_first:'+actorIndices[0]);
          if(actorIndices.length>1) {inc('ordered_second:'+actorIndices[1]);inc('ordered_pair:'+actorIndices[0]+':'+actorIndices[1]);}
        }
      }
      // card is used only to verify the renderer selected the production mode.
      if(!privatePair&&frames.at(-1).current_round.mode!==card.mode) throw new Error('PUBLIC_MODE_MISMATCH');
      return frames;
    },
    finish(roundCount) {inc('last_game_revision',revision-1);inc('last_stream_revision',revision-1);inc('elapsed_ticks',ticks);return Float64Array.from(features,x=>x/Math.max(1,roundCount));}
  };
}
/** Same committed plan/state, all production locales; only text may differ. */
export function localeMetadataInvariant(pack,plan,players) {
  const names=players.map((p,i)=>({id:p.id,display_name:'OBSERVER_ROLE_'+i+'_END'})),data={plan,state:'active',invitation:null,action:plan.requires_action_consent?{state:'active',proposal_revision:1}:null,choice:plan.mode==='truth_or_dare'?'truth':null,condition:null};
  const values=['ru','en','tr'].map(locale=>{const {text,...metadata}=publicRound(pack,data,locale,names);return {metadata:JSON.stringify(metadata),text};});
  return values.every(value=>value.metadata===values[0].metadata);
}
