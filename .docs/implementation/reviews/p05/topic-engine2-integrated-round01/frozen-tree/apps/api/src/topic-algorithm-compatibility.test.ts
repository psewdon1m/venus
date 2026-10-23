/** Prospective included test; execute after coordinated engine2 integration. */
import {describe,it,expect} from 'vitest';
import {TOPIC_ALGORITHM,TOPIC_PRIVATE_POLICY,TOPIC_RECOVERY_POLICY} from '@venus/relationship-engine';
import {TopicGames} from './topic-games.js';
import {Keyring,type Cipher} from './security.js';
import {topicAad,type TopicRoundData} from './topic-game-model.js';
import type {Rooms} from './rooms.js';
const room='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',round='33333333-3333-4333-8333-333333333333';
const header=()=>({schema:2,engine_revision:TOPIC_ALGORITHM,private_policy_revision:TOPIC_PRIVATE_POLICY,recovery_policy_revision:TOPIC_RECOVERY_POLICY,pins_digest:'a'.repeat(64),baseline:{schema:1,room_id:room,session_id:session}});
function fixture(snapshot:unknown=header(),state='active'){
 const keys=new Keyring('test',{test:Buffer.alloc(32,17).toString('base64')}),snapshotCipher=keys.encrypt(snapshot,topicAad.snapshot(room,session)),queries:{sql:string;args:unknown[]}[]=[],writes:Cipher[]=[];
 const g={id:session,room_id:room,state,current_round:1,snapshot_cipher:snapshotCipher};
 const data={schema_version:2,state:'active',clock_floor:1000,boot_id:'old-boot',condition:null,invitation:null,action:null,plan:{schema:2,room_id:room,session_id:session,round_id:round,actors:['only-public-actor']}};
 const row={id:round,room_id:room,session_id:session,state:'active',cipher:keys.encrypt(data,topicAad.round(room,session,round))};
 const c={query:async(sql:string,args:unknown[]=[])=>{queries.push({sql,args});if(sql.startsWith('SELECT DISTINCT room_id FROM topic_game_sessions'))return {rows:[{room_id:room}]};if(sql.startsWith('SELECT g.* FROM game_sessions'))return {rows:[g]};if(sql.startsWith('SELECT * FROM game_rounds'))return {rows:[row]};if(sql.startsWith('UPDATE game_rounds SET state='))writes.push(args[2] as Cipher);return {rows:[]};}};
 const rooms={options:{keys},now:()=>1000,transaction:async(fn:(client:typeof c)=>unknown)=>fn(c)} as unknown as Rooms;
 const source={active:async()=>{throw Error('Boot must not consult source');},pinned:async()=>{throw Error('Boot must not consult source');},assertCurrent:()=>{throw Error('Boot must not consult source');}};
 const safety={read:async()=>{throw Error('Boot must not consult safety provider');},assertCurrent:()=>{throw Error('Boot must not consult safety provider');},excludeLocked:async()=>{throw Error('Boot must not consult safety provider');}};
 const games=new TopicGames(rooms,{enabled:true,privateTextChat:true,source,safety,syntheticFixtureOnly:true});
 return {games,g,keys,data,row,queries,writes,snapshotCipher};
}
describe('algorithm revision startup compatibility without source lookup',()=>{
 it('uses the new selector revision',()=>{expect(TOPIC_ALGORITHM).toBe('RE-1.P05-TOPIC-2');});
 it('preserves a supported public round and authenticated snapshot while clearing private objects before processing',async()=>{
  const f=fixture(),before=JSON.stringify(f.g.snapshot_cipher),result=await f.games.bootGate();
  expect(result.unsupported_sessions_aborted).toBe(0);expect(result.rounds_reconciled).toBe(1);expect(JSON.stringify(f.g.snapshot_cipher)).toBe(before);
  expect(f.queries.findIndex(q=>q.sql.startsWith('DELETE FROM topic_game_objects'))).toBeLessThan(f.queries.findIndex(q=>q.sql.startsWith('SELECT * FROM game_rounds')));
  expect(f.queries.some(q=>q.sql.includes("kind='history'")&&q.sql.startsWith('DELETE'))).toBe(false);
  const restored=f.keys.decrypt<TopicRoundData>(f.writes[0]!,topicAad.round(room,session,round));expect(restored.state).toBe('active');expect(restored.boot_id).not.toBe('old-boot');
 });
 it.each(['active','paused'])('aborts unsupported engine1 %s before reading round or consulting catalogue',async state=>{
  const f=fixture({...header(),engine_revision:'RE-1.P05-TOPIC-1'},state),before=JSON.stringify(f.g.snapshot_cipher),result=await f.games.bootGate();
  expect(result.unsupported_sessions_aborted).toBe(1);expect(result.rounds_reconciled).toBe(0);expect(f.writes).toEqual([]);
  expect(f.queries.some(q=>q.sql.startsWith('SELECT * FROM game_rounds'))).toBe(false);
  expect(f.queries.filter(q=>q.sql.startsWith("UPDATE game_sessions SET state='aborted'"))).toHaveLength(1);
  expect(JSON.stringify(f.g.snapshot_cipher)).toBe(before);expect(f.queries.some(q=>q.sql.startsWith('DELETE FROM topic_game_chunks'))).toBe(false);
 });
 it.each([
  {schema:99},{private_policy_revision:'unknown'},{recovery_policy_revision:'unknown'},{pins_digest:'invalid'},
  {baseline:{schema:1,room_id:'different-room',session_id:session}},{baseline:{schema:1,room_id:room,session_id:'different-session'}},{baseline:null},
 ])('fails closed for malformed authenticated header %#',async patch=>{const f=fixture({...header(),...patch});expect((await f.games.bootGate()).unsupported_sessions_aborted).toBe(1);expect(f.writes).toEqual([]);});
 it('aborts corrupted ciphertext without repairing the snapshot',async()=>{const f=fixture();f.g.snapshot_cipher={...f.snapshotCipher,tag:Buffer.alloc(16).toString('base64')};const before=JSON.stringify(f.g.snapshot_cipher);expect((await f.games.bootGate()).unsupported_sessions_aborted).toBe(1);expect(JSON.stringify(f.g.snapshot_cipher)).toBe(before);});
 it('does not reinterpret or erase a terminal unsupported snapshot',async()=>{const f=fixture({...header(),engine_revision:'RE-1.P05-TOPIC-1'},'aborted');expect((await f.games.bootGate()).unsupported_sessions_aborted).toBe(0);expect(f.queries.some(q=>q.sql.startsWith('UPDATE game_sessions'))).toBe(false);});
});

describe('started prior sessions cannot disappear after a partial restore',()=>{
 it('rejects a started history-bearing row without snapshot, and includes all started scope predicates in SQL',async()=>{
  const f=fixture(),queries:string[]=[],c={query:async(sql:string)=>{queries.push(sql);return {rows:[{id:'old-session',room_id:room,state:'aborted',current_round:1,snapshot_cipher:null}]};}};
  const prior=Reflect.get(f.games,'prior') as (...args:unknown[])=>Promise<unknown>;
  await expect(prior.call(f.games,c,{id:session,room_id:room},null,null)).rejects.toMatchObject({code:'TOPIC_HISTORY_UNAVAILABLE',statusCode:503});
  expect(queries).toHaveLength(1);for(const predicate of ['g.pack_digest IS NOT NULL',"g.state='completed'",'g.current_round>0','FROM game_rounds','FROM game_participants','FROM topic_game_objects',"o.kind='history'"])expect(queries[0]).toContain(predicate);
 });
});
