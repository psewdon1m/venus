import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {it,expect,vi} from 'vitest';
import {fixture,setup,withdrawal} from './fixture.ts';
import {Catalog} from '../../../../../apps/api/src/catalog.ts';
import type {TopicMapPins} from '@venus/relationship-engine';
import {createHash} from 'node:crypto';
import {loadReleaseTopicBundles,bundledPacks} from '@venus/card-catalog';
import {registryFixture} from './registry-fixture.ts';

// Fixture helper copied from author, machine-only and not signed human proof.
// All test behavior/expectations below are the independent reviewer's probes.
function actualCatalog() {
 const record=fixture(),f=setup([record]),state={active_digest:record.pack.digest,generation:'1',ledger_head:f.ledger.read().head};
 let delay:((sql:string)=>Promise<void>)|null=null;
 const c={query:vi.fn(async(sql:string)=>{if(delay)await delay(sql);
  if(sql==='SELECT * FROM venus_catalog_state WHERE singleton=true')return {rows:[state],rowCount:1};
  if(sql==='SELECT card_id,revision,ledger_hash FROM venus_catalog_withdrawals'||sql==='SELECT card_id,revision FROM venus_catalog_withdrawals')return {rows:[],rowCount:0};
  if(sql.startsWith('SELECT 1 FROM game_packs'))return {rows:[],rowCount:0};
  throw new Error('UNEXPECTED SQL '+sql);
 })};
 const catalog=new Catalog({} as any,{} as any,f.ledger,[record.pack]);
 // Existing source's catalog object identity is retained; methods delegate to
 // actual production Catalog with a controlled SQL responder, not PostgreSQL.
 vi.mocked(f.catalog.active).mockImplementation(()=>catalog.active(c as any));
 vi.mocked(f.catalog.assertPinned).mockImplementation((_c,pins)=>catalog.assertPinned(c as any,pins));
 return {...f,record,state,c,setDelay:(value:typeof delay)=>{delay=value;}};
}
it('actual Catalog resolves release identity and its normal three SELECTs',async()=>{const f=actualCatalog();expect((await f.source.active(f.c as any))?.pack).toBe(f.record.pack);expect(f.c.query).toHaveBeenCalledTimes(3);});
for(const kind of ['active','pinned'] as const)it('actual Catalog '+kind+' final SQL await cannot hide a new withdrawal',async()=>{
 const f=actualCatalog();f.setDelay(async sql=>{if((kind==='active'&&sql==='SELECT card_id,revision FROM venus_catalog_withdrawals')||(kind==='pinned'&&sql.startsWith('SELECT 1 FROM game_packs')))f.ledger.append(withdrawal());});
 await expect(kind==='active'?f.source.active(f.c as any):f.source.pinned(f.c as any,f.record.map.pins)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});
});
it('actual Catalog mismatch denies retained release content',async()=>{const f=actualCatalog();f.ledger.append(withdrawal('Q-9999'));await expect(f.source.active(f.c as any)).rejects.toMatchObject({code:'CATALOG_RECONCILIATION_REQUIRED'});});
it('JSON cloned exact historical pins survive without auto upgrade',async()=>{const old=fixture('OLD'),next=fixture('NEXT'),f=setup([{...old,active:false},next]);expect((await f.source.pinned(f.c,JSON.parse(JSON.stringify(old.map.pins)))).map).toBe(old.map);expect((await f.source.active(f.c))?.map).toBe(next.map);});
for(const key of Object.keys(fixture().map.pins))it('every pin field is bound: '+key,async()=>{const a=fixture(),f=setup([a]),pins={...a.map.pins,[key]:'WRONG'} as TopicMapPins;expect(()=>f.source.assertCurrent(pins)).toThrow();await expect(f.source.pinned(f.c,pins)).rejects.toMatchObject({code:'TOPIC_SOURCE_BUNDLE_UNAVAILABLE'});});
for(const excluded of [[],['Q-0104']])it('whole-pack exact revision withdrawal includes excluded cards '+excluded.length,()=>{const a=fixture('WITHDRAW',excluded),f=setup([a]);f.source.assertCurrent(a.map.pins);f.ledger.append(withdrawal('Q-0104'));expect(()=>f.source.assertCurrent(a.map.pins)).toThrow(expect.objectContaining({code:'CATALOG_WITHDRAWN'}));});
it('wrong revision and unrelated card do not withdraw this tuple',()=>{const a=fixture(),f=setup([a]);f.ledger.append(withdrawal('Q-0104',999));f.ledger.append(withdrawal('Q-9999'));expect(()=>f.source.assertCurrent(a.map.pins)).not.toThrow();});
for(const mutation of ['missing','partial','bad-utf8','changed-prefix','truncate'])it('ledger '+mutation+' denies final reads',()=>{const a=fixture(),f=setup([a]),initial=readFileSync(f.path);f.ledger.append(withdrawal('Q-9999'));
 if(mutation==='missing')unlinkSync(f.path);if(mutation==='partial')writeFileSync(f.path,'{');if(mutation==='bad-utf8')writeFileSync(f.path,Buffer.from([0xff,0x0a]));if(mutation==='truncate')writeFileSync(f.path,initial);
 if(mutation==='changed-prefix'){const row=JSON.parse(readFileSync(f.path,'utf8'));row.withdrawal.operator_id='tampered';writeFileSync(f.path,JSON.stringify(row)+'\n');}
 expect(()=>f.source.assertCurrent(a.map.pins)).toThrow(expect.objectContaining({code:'CATALOG_LEDGER_UNAVAILABLE'}));
});
it('release map and nested pins/labels remain deeply frozen',()=>{const a=fixture();expect(Object.isFrozen(a.map.pins)).toBe(true);expect(Object.isFrozen(a.map.topics[0]?.labels)).toBe(true);expect(()=>{(a.map.pins as any).map_revision='changed';}).toThrow();});
for(const active of [undefined,null,0,1,'true',{}])it('registry requires boolean active '+String(active),()=>{const f=registryFixture();expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[{...f.entry,active}]},[f.pack])).toThrow('REGISTRY_INVALID');});
it('registry both historical retention and single-active selection are explicit',()=>{const a=registryFixture('A'),b=registryFixture('B');const out=loadReleaseTopicBundles({schema_version:1,approved:[{...a.entry,active:false},b.entry]},[a.pack]);expect(out.map(v=>v.active)).toEqual([false,true]);expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[a.entry,b.entry]},[a.pack])).toThrow('ACTIVE_AMBIGUOUS');});
for(const kind of ['map','taxonomy','semantic'] as const)it('all raw document hashes remain bound '+kind,()=>{const f=registryFixture();expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[{...f.entry,bytes:{...f.entry.bytes,[kind]:Buffer.from(f.raw[kind]+' ').toString('base64')}}]},[f.pack])).toThrow('HASH_INVALID');});
for(const kind of ['map','taxonomy','semantic'] as const)it('new raw hashes cannot approve HOLD '+kind,()=>{const f=registryFixture(),raw=JSON.stringify({...JSON.parse(f.raw[kind]),owner_review_status:'HOLD'}),hash=createHash('sha256').update(raw).digest('hex');expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[{...f.entry,trusted:{...f.entry.trusted,[kind+'_sha256']:hash},bytes:{...f.entry.bytes,[kind]:Buffer.from(raw).toString('base64')}}]},[f.pack])).toThrow('NOT_APPROVED');});
it('production pack registry stays empty; approval-format machine fixtures are never release members',()=>{expect(bundledPacks).toEqual([]);const f=registryFixture();expect(()=>loadReleaseTopicBundles({schema_version:1,approved:[f.entry]},bundledPacks)).toThrow('PACK_UNAVAILABLE');});
