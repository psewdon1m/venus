import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import ts from 'typescript';
import assert from 'node:assert/strict';
// Reuse the existing deterministic scheduler, executing actual TSX/helpers.
// This is actual-module logic with explicit API doubles, not browser proof.
const scheduler=readFileSync(resolve('apps/web/src/game-races.test.ts'),'utf8').match(/const harness=String.raw`([\s\S]*?)`;/)![1];
const fixture=String.raw`
function metadata(i,g,permissions={}) {return {schema_version:1,room_id:i.props.room.room_id,member_id:i.props.prefs.owner_member_id,session_id:g.session_id,round_id:g.current_round?.round_id??null,game_rev:g.game_rev,room_rev:i.props.room.room_rev,server_time:new Date(clock+360000).toISOString(),expires_at:new Date(clock+365000).toISOString(),session_actions:{pause:true,stop:true,abort:false,resume:false,advance:false,neutral_reset:true,neutral_reset_aborts_game:true,...permissions.session},round_actions:{finish:true,skip:true,choose_truth:false,choose_dare:false,propose_condition:false,accept_invitation:false,accept_action:false,decline_invitation:false,withdraw_action:false,...permissions.round}};}
const publicGame=()=>({...game('s'),current_round:{kind:'public',round_id:'r',round_index:1,state:'active',mode:'questions',card_id:'Q',card_revision:1,actors:[],proposal_revision:1,response_state:'pending',choice:null,text:{question:'Synthetic group question'}}});
function pendingInvitation(g,skew=0){return {offer_id:'own-invite',session_id:g.session_id,round_id:g.current_round.round_id,expires_at:new Date(40000+skew).toISOString(),invitation:'SYNTHETIC PRIVATE PARTNER CONTENT',own_state:'pending',proposal_revision:1,consent_scope:'invitation'};}
function invitationMetadata(i,g,skew=0){const packet=metadata(i,g,{round:{finish:false,accept_invitation:true,decline_invitation:true}});packet.server_time=new Date(10000+skew).toISOString();packet.expires_at=new Date(15000+skew).toISOString();return packet;}
`;
async function scenario(code:string){return await vm.runInNewContext(scheduler+fixture+'\n(async()=>{'+code+'})()',{root:process.cwd(),ts,readFileSync,resolve,vm,console,Date,TextEncoder,AbortSignal,fetch,randomUUID,assert}) as unknown;}
describe('actual GamesPanel own controls',()=>{
 it('group Questions primary finishes then host advances solely through actual JSX handlers',async()=>{
  const result=await scenario(String.raw`
   let live=publicGame();const posts=[];let i;const api={async request(path,body){if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return metadata(i,live,{session:{advance:live.current_round.state==='completed'},round:{finish:live.current_round.state==='active'}});if(path.endsWith('/finish')){posts.push('finish');live={...live,game_rev:2,current_round:{...live.current_round,state:'completed'}};return {rev:2};}if(path.endsWith('/round/advance')){posts.push('advance');live={...live,game_rev:3,current_round:{...live.current_round,round_id:'r2',round_index:2,state:'active'}};return live;}throw new ApiError('NOT_FOUND');}};
   i=instance(api);render(i);await settle();render(i);assert(find(i,'game-finish'));find(i,'game-finish').props.onClick();await settle();render(i);assert(find(i,'game-next'));find(i,'game-next').props.onClick();await settle();render(i);return {posts,round:live.current_round.round_id};
  `);expect(result).toEqual({posts:['finish','advance'],round:'r2'});
 });
 it('spectator/host outside selection sees no Finish/Skip/Pause but retains host Abort and honest own-reset label',async()=>{
  const result=await scenario(String.raw`
   const live=publicGame();let i;const api={async request(path){if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return metadata(i,live,{session:{pause:false,stop:false,abort:true,neutral_reset_aborts_game:false},round:{finish:false,skip:false}});throw new ApiError('NOT_FOUND');}};i=instance(api);render(i);await settle();render(i);return {finish:!!find(i,'game-finish'),skip:!!find(i,'game-skip'),pause:!!find(i,'game-pause'),abort:find(i,'game-stop').props.children,reset:find(i,'game-neutral-reset').props.children};
  `);expect(result).toEqual({finish:false,skip:false,pause:false,abort:'End game for the room',reset:'Use my neutral settings'});
 });
 it('private TruthDare prompt does not make locked alternatives available',async()=>{
  const result=await scenario(String.raw`
   const live=game('s','truth_or_dare');let i;const api={async request(path){if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return metadata(i,live,{round:{finish:false,choose_truth:false,choose_dare:false}});if(path.endsWith('/private'))return {offer_id:'i',session_id:'s',round_id:'round-s',state:'active',card_id:'TD',card_revision:1,actors:['a','b'],prompt:'Already chosen private truth',expires_at:new Date(clock+10000).toISOString(),proposal_revision:1};throw new ApiError('NOT_FOUND');}};i=instance(api);render(i);await settle();render(i);return {prompt:!!find(i,'private-prompt'),truth:!!find(i,'game-truth'),dare:!!find(i,'game-dare')};
  `);expect(result).toEqual({prompt:true,truth:false,dare:false});
 });
 it('stale JSX Finish callbacks cannot send after room revision changes before effects',async()=>{
  const result=await scenario(String.raw`
   const live=publicGame(),posts=[];let i;const api={async request(path,body){if(body){posts.push(path);return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return metadata(i,live);throw new ApiError('NOT_FOUND');}};i=instance(api);render(i);await settle();render(i);const click=find(i,'game-finish').props.onClick;i.props.room={...i.props.room,room_rev:2};current=i;i.cursor=0;i.effects=[];i.tree=GamesPanel(i.props);click();await settle();return {posts};
  `);expect(result).toEqual({posts:[]});
 });
 it('a newer shared frame cannot authorize Next against an older rendered game revision',async()=>{
  const result=await scenario(String.raw`
   const first=publicGame(),completed={...first,game_rev:2,current_round:{...first.current_round,state:'completed'}},posts=[];let i,newer=false,newerOwnReads=0;
   const api={async request(path,body){if(body){posts.push(body);return {};}if(path.endsWith('/current'))return first;if(path.endsWith('/self-actions')){if(newer)newerOwnReads++;return metadata(i,newer?completed:first,{session:{advance:newer},round:{finish:!newer}});}throw new ApiError('NOT_FOUND');}};
   i=instance(api);render(i);await settle();render(i);newer=true;i.props.frame={schema:1,room_id:'room',room_rev:2,stream_rev:2,type:'game.snapshot',stream:'game',audience:'room',payload:completed};
   function beforeEffects(){current=i;i.cursor=0;i.effects=[];i.tree=GamesPanel(i.props);}
   beforeEffects();const syncTimers=intervals.filter(t=>t.ms===4000);assert.equal(syncTimers.length,1,'Actual GamesPanel sync timer must be scheduled');for(const timer of syncTimers)timer.fn();await settle();assert.equal(newerOwnReads,1,'Newer own metadata must actually be read');beforeEffects();const next=find(i,'game-next');if(next)next.props.onClick();await settle();return {nextOffered:!!next,postedRevisions:posts.map(p=>p.expected_rev)};
  `);expect(result).toEqual({nextOffered:false,postedRevisions:[]});
 });
 it('new same-session frame does not remove known Stop while round controls await coherent JSX',async()=>{
  const result=await scenario(String.raw`
   const first=publicGame(),completed={...first,game_rev:2,current_round:{...first.current_round,state:'completed'}},posts=[];let i,newer=false;
   const api={async request(path,body){if(body){posts.push(path);return {};}if(path.endsWith('/current'))return first;if(path.endsWith('/self-actions'))return metadata(i,newer?completed:first,{session:{advance:newer},round:{finish:!newer}});throw new ApiError('NOT_FOUND');}};
   i=instance(api);render(i);await settle();render(i);newer=true;i.props.frame={schema:1,room_id:'room',room_rev:2,stream_rev:2,type:'game.snapshot',stream:'game',audience:'room',payload:completed};current=i;i.cursor=0;i.effects=[];i.tree=GamesPanel(i.props);const stop=find(i,'game-stop');stop.props.onClick();await settle();return {stopOffered:!!stop,posts:posts.map(p=>p.split('/').at(-1))};
  `);expect(result).toEqual({stopOffered:true,posts:['stop']});
 });
 it('authorized Stop runs while ordinary Finish is stalled and keeps result unconfirmed until server acknowledgement',async()=>{
  const result=await scenario(String.raw`
   const live=publicGame(),posts=[];let i,release;const held=new Promise(done=>release=done);const api={async request(path,body){if(body){posts.push(path);if(path.endsWith('/finish'))await held;return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return metadata(i,live);throw new ApiError('NOT_FOUND');}};i=instance(api);render(i);await settle();render(i);find(i,'game-finish').props.onClick();await settle();render(i);find(i,'game-stop').props.onClick();await settle();release();await settle();return posts.map(p=>p.split('/').at(-1));
  `);expect(result).toEqual(['finish','stop']);
 });
 it('expired metadata plus offline transport still allows newly rendered authorized Stop with explicit uncertainty',async()=>{
  const result=await scenario(String.raw`
   const live=publicGame(),posts=[];let i;const api={async request(path,body){if(body){posts.push(path);return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return metadata(i,live);throw new ApiError('NOT_FOUND');}};i=instance(api);render(i);await settle();render(i);clock+=6000;i.props.connection='offline';render(i);await settle();render(i);const before={finish:!!find(i,'game-finish'),stop:!!find(i,'game-stop'),unconfirmed:!!find(i,'game-safety-unconfirmed')};find(i,'game-stop').props.onClick();await settle();return {...before,posts:posts.map(p=>p.split('/').at(-1))};
  `);expect(result).toEqual({finish:false,stop:true,unconfirmed:true,posts:['stop']});
 });
});
describe('actual GamesPanel degraded round refusal',()=>{
 for(const skew of [-360000,0,360000])it('retains authenticated refusal evidence with server clock offset '+skew+' without restoring private content',async()=>{
  const result=await scenario(String.raw`
   const live=game('skew'),posts=[];let i;const api={async request(path,body){if(body){posts.push(body);return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return invitationMetadata(i,live,offset);if(path.endsWith('/invitation'))return pendingInvitation(live,offset);throw new ApiError('NOT_FOUND');}};
   i=instance(api);render(i);await settle();render(i);clock=16001;i.props.connection='offline';render(i);await settle();render(i);const decline=find(i,'pair-decline'),generic=find(i,'round-refusal-fallback');if(decline&&!decline.props.disabled)decline.props.onClick();await settle();return {visible:!!decline,enabled:!!decline&&!decline.props.disabled,generic:!!generic,privateContent:!!find(i,'pair-invitation'),accept:!!find(i,'pair-accept'),posts:posts.map(p=>p.kind)};
  `.replaceAll('offset',String(skew)));expect(result).toEqual({visible:true,enabled:true,generic:true,privateContent:false,accept:false,posts:['decline']});
 });
 for(const change of ['expired_display_lease','offline'] as const)it('keeps a bounded specific decline after '+change+' without reusing a stale DOM callback',async()=>{
  const result=await scenario(String.raw`
   const live=game('invite'),posts=[];let i;const api={async request(path,body){if(body){posts.push(body);return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return invitationMetadata(i,live);if(path.endsWith('/invitation'))return pendingInvitation(live);throw new ApiError('NOT_FOUND');}};
   i=instance(api);render(i);await settle();render(i);const old=find(i,'pair-decline').props.onClick;
   if(change==='offline')i.props.connection='offline';else clock=16001;render(i);await settle();render(i);
   const current=find(i,'pair-decline'),fallback=find(i,'round-refusal-fallback'),before=posts.length;old();await settle();const oldPosts=posts.length-before;
   if(change==='offline'){assert(fallback);assert(!JSON.stringify(fallback).includes('SYNTHETIC PRIVATE PARTNER CONTENT'));current.props.onClick();await settle();}
   return {visible:!!current,enabled:!current.props.disabled,fallback:!!fallback,oldPosts,posts:posts.map(p=>p.kind),acceptPresent:!!find(i,'pair-accept')};
  `.replaceAll('change',JSON.stringify(change)));expect(result).toEqual(change==='offline'?{visible:true,enabled:true,fallback:true,oldPosts:0,posts:['decline'],acceptPresent:false}:{visible:true,enabled:true,fallback:false,oldPosts:1,posts:['decline'],acceptPresent:true});
 });
 it('local offer bound survives six-minute server skew and cannot be extended by a later render',async()=>{
  const result=await scenario(String.raw`
   const live=game('invite'),posts=[];let i;const api={async request(path,body){if(body){posts.push(body);return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return invitationMetadata(i,live,360000);if(path.endsWith('/invitation'))return pendingInvitation(live,360000);throw new ApiError('NOT_FOUND');}};
   i=instance(api);render(i);await settle();render(i);i.props.connection='offline';clock=39999;render(i);await settle();render(i);const before=!!find(i,'pair-decline');clock=40000;render(i);await settle();render(i);const after=!!find(i,'pair-decline');return {before,after,posts};
  `);expect(result).toEqual({before:true,after:false,posts:[]});
 });
 it('a late negative whose display lease aged in flight cannot leave or reseed refusal controls',async()=>{
  const result=await scenario(String.raw`
   const live=game('invite'),posts=[];let i,hold=false,release,heldReads=0;const pending=new Promise(done=>release=done);const api={async request(path,body){if(body){posts.push(body);return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions')){if(hold){heldReads++;return pending;}return invitationMetadata(i,live);}if(path.endsWith('/invitation'))return pendingInvitation(live);throw new ApiError('NOT_FOUND');}};
   i=instance(api);render(i);await settle();render(i);const old=find(i,'pair-decline').props.onClick;hold=true;const syncTimers=intervals.filter(t=>t.ms===4000);assert.equal(syncTimers.length,1,'Actual GamesPanel sync timer must be scheduled');for(const t of syncTimers)t.fn();await settle();assert.equal(heldReads,1,'Self-actions request must be held in flight before its lease ages');clock=16001;const negative=invitationMetadata(i,live);negative.round_actions.decline_invitation=false;negative.round_actions.skip=false;release(negative);await settle();render(i);const declined=find(i,'pair-decline');old();await settle();return {enabled:!!declined&&!declined.props.disabled,posts};
  `);expect(result).toEqual({enabled:false,posts:[]});
 });
 it('an explicit private-cleared frame revokes generic refusal before passive effects',async()=>{
  const result=await scenario(String.raw`
   const live=game('invite'),posts=[];let i;const api={async request(path,body){if(body){posts.push(body);return {};}if(path.endsWith('/current'))return live;if(path.endsWith('/self-actions'))return invitationMetadata(i,live);if(path.endsWith('/invitation'))return pendingInvitation(live);throw new ApiError('NOT_FOUND');}};i=instance(api);render(i);await settle();render(i);i.props.connection='offline';render(i);await settle();render(i);const old=find(i,'pair-decline').props.onClick;i.props.frame={schema:1,event_id:'clear',room_id:'room',stream:'private',audience:'member',target_member_id:'a',type:'game.private_cleared'};current=i;i.cursor=0;i.effects=[];i.tree=GamesPanel(i.props);old();await settle();return {fallback:!!find(i,'round-refusal-fallback'),posts};
  `);expect(result).toEqual({fallback:false,posts:[]});
 });
});
