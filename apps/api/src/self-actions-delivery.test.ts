import {describe,it,expect,vi} from 'vitest';
import type pg from 'pg';
import {Games} from './games.js';
import {DomainError} from './security.js';
import type {Rooms} from './rooms.js';
import type {GameRow,RoundData} from './games-model.js';
import type {GameSelfActions} from '@venus/contracts';
import {proposeConsent,consentResponse} from '@venus/relationship-engine';
function fixture(){
 let now=1000;const member={id:'a',role:'member',presence:'online',slot:1,removed_at:null,heartbeat_at:new Date(0),reserved_until:new Date(90000)};
 const auth={member,sessionHash:'hash',room:{rev:'4',host_member_id:'host',state:'open',last_activity_at:new Date(0)}},access=vi.fn(async()=>auth);
 const credential={expires_at:new Date(90000),offer_version:'v',offer_digest:'d'};
 const query=vi.fn(async(sql:string)=>{if(sql.startsWith('SELECT s.expires_at'))return {rows:[credential],rowCount:1};if(sql.startsWith('SELECT 1 FROM game_participants'))return {rows:[{}],rowCount:1};if(sql.startsWith('SELECT role FROM game_round_actors'))return {rows:[{role:'primary'}],rowCount:1};if(sql.startsWith('SELECT m.presence'))return {rows:[member,{...member,id:'b'}],rowCount:2};throw new Error('Unexpected SQL '+sql);});
 const c={query} as unknown as pg.PoolClient,rooms={now:()=>now,options:{ledger:{contains:()=>false},offer:()=>({version:'v',digest:'d'})},access,transaction:async(fn:(c:pg.PoolClient)=>Promise<unknown>)=>fn(c)} as unknown as Rooms,games=new Games(rooms,()=>null,true);
 const game={id:'game',room_id:'room',rev:'2',state:'active'} as GameRow;
 const data={state:'active',plan:{mode:'questions',primary_member_id:'a',actors:[],requires_action_consent:false,interaction:'group'},invitation:null,action:null,condition:null,choice:null} as RoundData;
 const adapters=games as unknown as {row:unknown;current:unknown;snapshot:unknown;present:unknown;privateChannelAvailable:unknown};
 const snapshot=vi.fn(async()=>({})),present=vi.fn(async()=>true);adapters.row=async()=>game;adapters.current=async()=>({row:{id:'round'},data});adapters.snapshot=snapshot;adapters.present=present;adapters.privateChannelAvailable=()=>true;
 let packet:GameSelfActions|undefined;return {games,game,data,member,auth,credential,access,query,snapshot,present,setClock:(v:number)=>{now=v;},get packet(){return packet;},run:()=>games.dispatchSelfActions('room','credential',value=>{packet=value;})};
}
describe('recipient final read-only projection',()=>{
 it('enqueues dense own permissions with no writes or extra recipient fields',async()=>{const f=fixture();await f.run();expect(f.packet?.round_actions.finish).toBe(true);expect(f.packet?.session_actions.stop).toBe(true);expect(f.query.mock.calls.every(([sql])=>sql.startsWith('SELECT '))).toBe(true);expect(JSON.stringify(f.packet)).not.toMatch(/primary|actors|role|card_id|reason/);});
 it('missing catalogue cannot remove independently authorized Stop/Pause/reset',async()=>{const f=fixture();f.snapshot.mockRejectedValue(new DomainError('CATALOG_LEDGER_UNAVAILABLE',503));await f.run();expect(f.packet?.round_actions.finish).toBe(false);expect(f.packet?.session_actions.stop).toBe(true);expect(f.packet?.session_actions.pause).toBe(true);expect(f.packet?.session_actions.neutral_reset).toBe(true);});
 it('unexpected SQL errors propagate without enqueue',async()=>{const f=fixture();f.snapshot.mockRejectedValue(new Error('SQL fault'));await expect(f.run()).rejects.toThrow('SQL fault');expect(f.packet).toBeUndefined();});
 it('selected missing presence denies normal controls as reconciliation would pause',async()=>{const f=fixture();f.present.mockResolvedValue(false);await f.run();expect(f.packet?.round_actions.finish).toBe(false);expect(f.packet?.session_actions.stop).toBe(true);});
 it('clock crossing during final auth await denies stale heartbeat and retains safety',async()=>{const f=fixture();let n=0;f.access.mockImplementation(async()=>{if(++n===4)f.setClock(45000);return f.auth;});await f.run();expect(f.packet?.round_actions.finish).toBe(false);expect(f.packet?.session_actions.stop).toBe(true);});
 it('final entry policy change denies ordinary actions only',async()=>{const f=fixture();let n=0;f.access.mockImplementation(async()=>{if(++n===4)throw new DomainError('ENTRY_REACCEPT_REQUIRED',403);return f.auth;});await f.run();expect(f.packet?.round_actions.finish).toBe(false);expect(f.packet?.session_actions.stop).toBe(true);});
 it('final auth revocation prevents any recipient enqueue',async()=>{const f=fixture();let n=0;f.access.mockImplementation(async()=>{if(++n===3)throw new DomainError('AUTH_REQUIRED',401);return f.auth;});await expect(f.run()).rejects.toMatchObject({code:'AUTH_REQUIRED'});expect(f.packet).toBeUndefined();});
 it('session TTL crossing the last awaited query denies every enqueue (P05-ROLE-004)',async()=>{const f=fixture();f.credential.expires_at=new Date(7000);f.query.mockImplementation(async(sql:string)=>{if(sql.startsWith('SELECT s.expires_at')){f.setClock(8000);return {rows:[f.credential],rowCount:1};}if(sql.startsWith('SELECT 1 FROM'))return {rows:[{}],rowCount:1};if(sql.startsWith('SELECT role'))return {rows:[{role:'primary'}],rowCount:1};if(sql.startsWith('SELECT m.presence'))return {rows:[f.member,{...f.member,id:'b'}],rowCount:2};throw new Error(sql);});await expect(f.run()).rejects.toMatchObject({code:'AUTH_REQUIRED'});expect(f.packet).toBeUndefined();});
 it('emitted lease cannot outlive the authenticated grant',async()=>{const f=fixture();f.credential.expires_at=new Date(2500);await f.run();expect(Date.parse(f.packet!.expires_at)).toBe(2500);});
 it('nonrecipient lease cannot expose another pair deadline',async()=>{const f=fixture();let invite=proposeConsent('offer',['x','y'],'invitation',0);for(const actor of ['x','y'])invite=consentResponse(invite,actor,'accept',0,{offer_id:'offer',scope:'invitation',proposal_revision:1});f.data.invitation=invite;f.query.mockImplementation(async(sql:string)=>{if(sql.startsWith('SELECT s.expires_at'))return {rows:[f.credential],rowCount:1};if(sql.startsWith('SELECT role'))return {rows:[],rowCount:0};if(sql.startsWith('SELECT 1 FROM'))return {rows:[{}],rowCount:1};if(sql.startsWith('SELECT m.presence'))return {rows:[f.member,{...f.member,id:'b'}],rowCount:2};throw new Error(sql);});await f.run();expect(Date.parse(f.packet!.expires_at)-Date.parse(f.packet!.server_time)).toBe(5000);});
});
