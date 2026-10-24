import {describe,it,expect} from 'vitest';
import {TopicGames} from './topic-games.js';
import {Keyring,DomainError} from './security.js';
import type {Rooms} from './rooms.js';
/** Real public methods and real request fingerprint/AEAD. SQL/auth boundaries
 * are explicit doubles here; actual PostgreSQL/HTTP tests are separate. */
function replayFixture(){
 const keys=new Keyring('test',{test:Buffer.alloc(32,49).toString('base64')}),a={room:{id:'room',rev:'1',host_member_id:'member'},member:{id:'member',role:'host'}},g={id:'session-a',room_id:'room',rev:'1',state:'active',mode:'questions'},data={state:'active',plan:{requires_action_consent:false,interaction:'group'},invitation:null,action:null};
 let cache:Record<string,unknown>|null=null,targetCalls=0,writes=0;
 const c={query:async(sql:string,args:unknown[]=[])=>{if(sql.startsWith('SELECT private_protocol'))return {rows:[{private_protocol:2}]};if(sql.startsWith('SELECT operation,request_hash'))return {rows:cache?[cache]:[]};if(sql.startsWith('SELECT count(*)'))return {rows:[{count:'0'}]};if(sql.startsWith('INSERT INTO topic_game_requests')){cache={operation:args[3],request_hash:args[4],receipt_cipher:args[5]};writes++;}return {rows:[],rowCount:0};}};
 const rooms={now:()=>1000,options:{keys},transaction:async(fn:(value:unknown)=>unknown)=>fn(c),access:async()=>a,finalAccessFence:async()=>()=>{}} as unknown as Rooms;
 const games=new TopicGames(rooms,{enabled:true,source:{active:async()=>null,pinned:async()=>{throw Error('not called');},assertCurrent:()=>{}},safety:{read:async()=>{throw Error('not called');},excludeLocked:async()=>{throw Error('not called');},assertCurrent:()=>{}}});
 Object.assign(games,{target:async(_c:unknown,_a:unknown,id:string,round:string)=>{targetCalls++;if(id!=='session-a'||round!=='round-a')throw new DomainError('ROUND_STALE',409);return {game:g,row:{id:round},data};},actor:async()=>{},clearPrivate:async()=>{},saveRound:async()=>{g.rev=String(Number(g.rev)+1);},required:async(_c:unknown,_room:string,id:string)=>{targetCalls++;if(id!=='session-a')throw new DomainError('GAME_NOT_FOUND',404);return g;},participant:async()=>{},current:async()=>null,bump:async()=>{g.rev=String(Number(g.rev)+1);}});
 return {games,g,data,seedLegacy:(input:unknown)=>{cache={operation:'finish',request_hash:keys.fingerprint(input),receipt_cipher:keys.encrypt({schema_version:2,request_id:request,game_rev:2},`topic-game-receipt:room:member:${request}:2`)};},stats:()=>({targetCalls,writes})};
}
const request='11111111-1111-4111-8111-111111111111';
describe('V2 exact URL target idempotency',()=>{
 it('replays exact finish without repeating a mutation',async()=>{const f=replayFixture(),input={request_id:request,expected_rev:1},first=await f.games.finish('room','credential','session-a','round-a',input),second=await f.games.finish('room','credential','session-a','round-a',input);expect(second).toEqual(first);expect(f.stats()).toEqual({targetCalls:1,writes:1});});
 it.each([['session-b','round-a'],['session-a','round-b'],['session-b','round-b']])('rejects finish replay onto %s/%s without changing state',(id,round)=>{return (async()=>{const f=replayFixture(),input={request_id:request,expected_rev:1};await f.games.finish('room','credential','session-a','round-a',input);const before={rev:f.g.rev,state:f.data.state};await expect(f.games.finish('room','credential',id,round,input)).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT',statusCode:409});expect({rev:f.g.rev,state:f.data.state}).toEqual(before);expect(f.stats()).toEqual({targetCalls:1,writes:1});})();});
 it('binds session-only safety action replay and retains exact retry',async()=>{const f=replayFixture(),input={request_id:request},first=await f.games.safetyStop('room','credential','session-a',input,'pause');expect(await f.games.safetyStop('room','credential','session-a',input,'pause')).toEqual(first);const before=f.g.rev;await expect(f.games.safetyStop('room','credential','session-b',input,'pause')).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT',statusCode:409});expect(f.g.rev).toBe(before);expect(f.stats()).toEqual({targetCalls:1,writes:1});});
 it('denies pre-upgrade unbound request hashes instead of ambiguously replaying them',async()=>{const f=replayFixture(),input={request_id:request,expected_rev:1};f.seedLegacy(input);await expect(f.games.finish('room','credential','session-a','round-a',input)).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT',statusCode:409});expect(f.stats()).toEqual({targetCalls:0,writes:0});});
 it('still rejects changing body or operation for an exact target',async()=>{const f=replayFixture(),input={request_id:request,expected_rev:1};await f.games.finish('room','credential','session-a','round-a',input);await expect(f.games.finish('room','credential','session-a','round-a',{...input,expected_rev:2})).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT'});await expect(f.games.choice('room','credential','session-a','round-a',{request_id:request,side:'truth'})).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT'});expect(f.stats().writes).toBe(1);});
});

// Verify the public entry points supply URL scope to the shared helper. This is
// a wiring check; the tests above execute real helper persistence/replay logic.
describe('V2 mutation target wiring',()=>{
 const sessionId='22222222-2222-4222-8222-222222222222',roundId='33333333-3333-4333-8333-333333333333',player='44444444-4444-4444-8444-444444444444';
 const cases:[string,(g:TopicGames)=>Promise<unknown>,Record<string,string>][]=[
  ['prepare',g=>g.prepare('room','credential',{request_id:request,expected_rev:1,mode:'questions',round_count:1,players:[sessionId,player]}),{}],
  ['start',g=>g.start('room','credential',{request_id:request,draft_rev:1}),{}],
  ['response',g=>g.response('room','credential',sessionId,roundId,{request_id:request,kind:'skip'}),{sessionId,roundId}],
  ['choice',g=>g.choice('room','credential',sessionId,roundId,{request_id:request,side:'truth'}),{sessionId,roundId}],
  ['condition',g=>g.condition('room','credential',sessionId,roundId,{request_id:request,expected_rev:1,text:'condition'}),{sessionId,roundId}],
  ['finish',g=>g.finish('room','credential',sessionId,roundId,{request_id:request,expected_rev:1}),{sessionId,roundId}],
  ['conversation:stop',g=>g.conversationCommand('room','credential',sessionId,roundId,{request_id:request,kind:'stop'}),{sessionId,roundId}],
  ['chat',g=>g.sendChat('room','credential',sessionId,roundId,{request_id:request,conversation_id:player,epoch:1,text:'hello'}),{sessionId,roundId}],
  ['advance',g=>g.advance('room','credential',sessionId,{request_id:request,expected_rev:1}),{sessionId}],
  ['resume',g=>g.resume('room','credential',sessionId,{request_id:request,expected_rev:1}),{sessionId}],
  ...(['pause','stop','abort'] as const).map(kind=>[kind,(g:TopicGames)=>g.safetyStop('room','credential',sessionId,{request_id:request},kind),{sessionId}] as [string,(g:TopicGames)=>Promise<unknown>,Record<string,string>]),
 ];
 it.each(cases)('%s supplies its exact structured URL target',async(operation,call,target)=>{const f=replayFixture();let seen:unknown;Object.assign(f.games,{mutation:async(_room:unknown,_credential:unknown,_input:unknown,op:string,scope:unknown)=>{seen={operation:op,scope};return {schema_version:2,request_id:request,game_rev:1};}});await call(f.games);expect(seen).toEqual({operation,scope:target});});
});
