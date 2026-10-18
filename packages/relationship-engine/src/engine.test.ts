import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {syntheticCards,syntheticManifest,playerId} from '../../../tests/p03/fixtures.mjs';
import {FrozenPack,digest,policyDigest,resolvePair,progressionStage,immutableSnapshot,eligible,selectNextRound,preflight,AuditProjection,algorithmRevision,type Player,type Snapshot,type Relation} from './index.js';
const cards=syntheticCards(),manifest=syntheticManifest(cards,digest,policyDigest),pack=FrozenPack.load(cards,manifest,true);
const labels:Relation[]=['just_met','friendship','crush','situationship','in_relationships','not_a_friend'];
const seed=createHash('sha256').update('P03-UNIT-GOLDEN').digest('hex');
function player(i:number,relation:Relation='friendship',comfort=4):Player {return {id:playerId(i),comfort,edges:{[playerId(1-i)]:{relation,explicit:true}}};}
function input(override:Partial<Snapshot>={}):Snapshot {return {schema:1,room_id:'11111111-1111-4111-8111-111111111111',session_id:'22222222-2222-4222-8222-222222222222',engine_revision:algorithmRevision,policy_revision:'RE-1',policy_digest:policyDigest,pack_digest:pack.digest,seed,mode:'questions',context:'in_person',total_rounds:20,players:[player(0),player(1)],capabilities:['private_text_chat'],...override};}
describe('production relationship engine, explicit synthetic test pack',()=>{
  it('resolves all 36 directed cases and defaults without implying mutual status',()=>{
    const matrix=['JJJJJX','JFGGGX','JGMMMX','JGMSSX','JGMSRX','XXXXXX'];
    for(let a=0;a<6;a++) for(let b=0;b<6;b++) expect(resolvePair(player(0,labels[a]!),player(1,labels[b]!)).pairClass).toBe(matrix[a]![b]);
    expect(resolvePair(player(0,'crush'),player(1,'friendship')).initiator).toBe(playerId(0));
    expect(resolvePair({id:playerId(0),comfort:0,edges:{}},{id:playerId(1),comfort:0,edges:{}}).pairClass).toBe('F');
  });
  it('uses exact quarter boundaries for every 1..100 round count',()=>{
    for(let total=1;total<=100;total++) for(let r=1;r<=total;r++) {
      const p=(r-1)/Math.max(1,total-1),expected=p<.25?1:p<.5?2:p<.75?3:4;
      expect(progressionStage(r,total)).toBe(expected);
    }
    expect(()=>progressionStage(0,20)).toThrow();expect(()=>progressionStage(1,101)).toThrow();
  });
  it('enforces class, every actor comfort, context, stage, capability and common public support exhaustively',()=>{
    const publicCard=pack.card('Q-0005'),privateCard=pack.card('Q-0104');
    for(const ab of labels) for(const ba of labels) for(let ac=0;ac<=4;ac++) for(let bc=0;bc<=4;bc++) for(const context of ['online','in_person'] as const) for(let stage=1;stage<=4;stage++) {
      const s=immutableSnapshot(input({players:[player(0,ab,ac),player(1,ba,bc)],context}),pack),actors=s.players.map(p=>p.id);
      expect(eligible(publicCard,s,actors,stage)).toBe(ab!=='not_a_friend'&&ba!=='not_a_friend');
      const resolved=resolvePair(s.players[0]!,s.players[1]!).pairClass;
      expect(eligible(privateCard,s,actors,stage)).toBe(['F','G','M','S','R'].includes(resolved)&&ac>=privateCard.min_comfort&&bc>=privateCard.min_comfort&&stage>=3&&privateCard.meeting_contexts.includes(context));
    }
    const noChat=immutableSnapshot(input({context:'online',capabilities:[]}),pack);expect(eligible(pack.card('Q-0101'),noChat,noChat.players.map(p=>p.id),4)).toBe(false);
    const deepPublic={...publicCard,min_comfort:1};expect(eligible(deepPublic,immutableSnapshot(input(),pack),[playerId(0),playerId(1)],4)).toBe(false);
  });
  it('pins immutable snapshot/pack and exactly replays without repeats or private projection leakage',()=>{
    const original=input(),snapshot=immutableSnapshot(original,pack),before=digest(snapshot);const first=preflight(snapshot,pack),again=preflight(immutableSnapshot(JSON.parse(JSON.stringify(snapshot)),pack),pack);
    expect(first).toEqual(again);expect(new Set(first.map(r=>r.card_id)).size).toBe(20);expect(digest(snapshot)).toBe(before);
    const shuffled=FrozenPack.load([...cards].reverse(),manifest,true);expect(preflight(immutableSnapshot(input(),shuffled),shuffled)).toEqual(first);
    original.players[0]!.comfort=0;expect(snapshot.players[0]!.comfort).toBe(4);expect(()=>snapshot.players[0]!.comfort=0).toThrow();
    for(const plan of first) if(plan.interaction==='pair_private') expect(AuditProjection(plan)).toEqual({round_index:plan.round_index,kind:'generic'});
    expect(()=>immutableSnapshot(input({policy_digest:'sha256:'+'0'.repeat(64)}),pack)).toThrow('VERSION');
    expect(()=>immutableSnapshot({...input(),engine_revision:'unknown'} as unknown as Snapshot,pack)).toThrow('VERSION');
    expect(()=>immutableSnapshot({...input(),locale:'tr'} as Snapshot,pack)).toThrow('FIELDS');
    expect(()=>selectNextRound(snapshot,[{...first[0]!,pack_digest:'foreign'}],pack)).toThrow('HISTORY');
  });
  it('rejects draft packs in production, tampering and impossible safe pools',()=>{
    expect(()=>FrozenPack.load(cards,manifest)).toThrow('NOT_REVIEWED');
    const changed=structuredClone(cards);changed[0]!.text.ru.question+=' TAMPERED';expect(()=>FrozenPack.load(changed,manifest,true)).toThrow('HASH');
    const neutral=immutableSnapshot(input({players:[player(0,'not_a_friend',0),player(1,'in_relationships',0)],mode:'yes_but'}),pack);expect(()=>selectNextRound(neutral,[],pack)).toThrow('SAFE_POOL_EXHAUSTED');
  });
});
