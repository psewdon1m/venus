import {mkdtempSync,rmSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type pg from 'pg';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {ownerProvisionalPilot,RevocationLedger} from '@venus/card-catalog';
import {OwnerProvisionalTopicGameSource,pilotAdmissionEnabled,legacyReleaseCatalog,bootstrapPilotCatalog} from './topic-game-source.js';
import type {Catalog,GameCatalog} from './catalog.js';
import {releasedRoomTopicProfile} from './topic-runtime.js';
import {unavailableTopicContent} from './topic-content-availability.js';
const paths:string[]=[];afterEach(()=>{for(const path of paths.splice(0))rmSync(path,{recursive:true,force:true});});
const config={deploymentProfile:'local-pilot',origin:'https://localhost',privateTopicsEnabled:true};
function setup(){const dir=mkdtempSync(join(tmpdir(),'venus-pilot-source-'));paths.push(dir);const path=join(dir,'revocations.jsonl'),ledger=RevocationLedger.provision(path);
 const catalog:GameCatalog={active:vi.fn(async()=>ownerProvisionalPilot.pack),assertPinned:vi.fn(async()=>{})};
 const c={query:vi.fn(async()=>({rows:[],rowCount:0}))} as unknown as pg.PoolClient;
 return {path,ledger,c,catalog,source:new OwnerProvisionalTopicGameSource(catalog,ledger,config)};}
describe('normal V2 owner-provisional source deployment/restore/final fences',()=>{
 it('requires explicit profile+operator enablement and reuses exact loopback validator',()=>{
  expect(pilotAdmissionEnabled(config)).toBe(true);
  for(const deploymentProfile of [undefined,'closed'])expect(pilotAdmissionEnabled({...config,deploymentProfile})).toBe(false);
  expect(pilotAdmissionEnabled({...config,privateTopicsEnabled:false})).toBe(false);
  for(const origin of ['https://venus.shmoza.net','http://localhost','https://localhost/path'])expect(()=>pilotAdmissionEnabled({...config,origin})).toThrow();
 });
 it('returns the compiled real pack/map, then restores exact pins via normal catalog checks',async()=>{
  const f=setup(),value=await f.source.active(f.c);expect(value).toEqual({pack:ownerProvisionalPilot.pack,map:ownerProvisionalPilot.map});
  expect(await f.source.pinned(f.c,ownerProvisionalPilot.map.pins)).toEqual(value);expect(f.catalog.assertPinned).toHaveBeenCalledWith(f.c,ownerProvisionalPilot.pack.digest);
 });
 it('does not admit on inactive catalog or operator flag-off; pinned old data stays denied',async()=>{
  const f=setup();vi.mocked(f.catalog.active).mockResolvedValue(null);expect(await f.source.active(f.c)).toBeNull();
  const disabled=new OwnerProvisionalTopicGameSource(f.catalog,f.ledger,{...config,privateTopicsEnabled:false});expect(await disabled.active(f.c)).toBeNull();
  await expect(disabled.pinned(f.c,ownerProvisionalPilot.map.pins)).rejects.toMatchObject({code:'TOPIC_SOURCE_UNAVAILABLE'});
  expect(()=>disabled.assertCurrent(ownerProvisionalPilot.map.pins)).toThrow();
 });
 it('rejects changed exact pins before touching the catalog',async()=>{
  const f=setup();await expect(f.source.pinned(f.c,{...ownerProvisionalPilot.map.pins,map_sha256:'0'.repeat(64)})).rejects.toMatchObject({code:'TOPIC_SOURCE_BUNDLE_UNAVAILABLE'});
  expect(f.catalog.assertPinned).not.toHaveBeenCalled();
 });
 for(const synthetic of [true,false])it('rejects historical DB identity conflict synthetic='+synthetic,async()=>{
  const f=setup();vi.mocked(f.c.query).mockResolvedValue({rows:[{synthetic,manifest:synthetic?ownerProvisionalPilot.pack.manifest:{}}],rowCount:1} as never);
  await expect(f.source.active(f.c)).rejects.toMatchObject({code:'TOPIC_SOURCE_UNREVIEWED'});
  try{await f.source.active(f.c);}catch(error){expect(unavailableTopicContent(error)).toBe(true);}
 });
 it('accepts exact non-synthetic stored manifest without interpreting it as reviewed release',async()=>{
  const f=setup();vi.mocked(f.c.query).mockResolvedValue({rows:[{synthetic:false,manifest:ownerProvisionalPilot.pack.manifest}],rowCount:1} as never);
  expect((await f.source.pinned(f.c,ownerProvisionalPilot.map.pins)).pack).toBe(ownerProvisionalPilot.pack);
 });
 for(const at of ['active','pinned','final'])it('withdrawal remains failclosed at '+at,async()=>{
  const f=setup(),card=ownerProvisionalPilot.pack.cards[0]!;
  const withdraw=()=>f.ledger.append({card_id:card.id,revision:card.revision,operator_id:'machine-test',reason_code:'safety',at:'2026-10-20T00:00:00Z'});
  if(at==='active')vi.mocked(f.catalog.active).mockImplementation(async()=>{withdraw();return ownerProvisionalPilot.pack;});
  if(at==='pinned')vi.mocked(f.catalog.assertPinned).mockImplementation(async()=>{withdraw();});
  if(at==='final'){expect(await f.source.active(f.c)).not.toBeNull();withdraw();expect(()=>f.source.assertCurrent(ownerProvisionalPilot.map.pins)).toThrow();}
  else await expect(at==='active'?f.source.active(f.c):f.source.pinned(f.c,ownerProvisionalPilot.map.pins)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});
 });
 it('fails closed if ledger disappears after admission',async()=>{const f=setup();await f.source.active(f.c);unlinkSync(f.path);expect(()=>f.source.assertCurrent(ownerProvisionalPilot.map.pins)).toThrow();});
 it('keeps legacy V1 admission closed but delegates pinned withdrawal validation',async()=>{
  const f=setup(),legacy=legacyReleaseCatalog(f.catalog);expect(await legacy.active(f.c)).toBeNull();await legacy.assertPinned(f.c,ownerProvisionalPilot.pack.digest);expect(f.catalog.assertPinned).toHaveBeenCalled();
 });
 it('provides taxonomy-only boot metadata without release admission or changing topic policy',()=>{
  expect(releasedRoomTopicProfile()).toBeNull();const profile=releasedRoomTopicProfile(true)!;expect(profile.topics).toHaveLength(13);expect(profile.pins.taxonomy).toBe(ownerProvisionalPilot.map.pins.taxonomy_digest);
 });
 for(const row of [{active_digest:null,generation:'0',used:false},{active_digest:null,generation:'0',used:true},{active_digest:null,generation:'1',used:false},{active_digest:ownerProvisionalPilot.pack.digest,generation:'2',used:true}])it('bootstrap fresh CAS vs used/null/restart '+JSON.stringify(row),async()=>{
  const query=vi.fn(async()=>({rows:[row]})),activate=vi.fn(async()=>{}),catalog={rooms:{transaction:async(fn:(c:unknown)=>unknown)=>fn({query})},activate} as unknown as Catalog;
  const fresh=row.generation==='0'&&!row.used&&!row.active_digest;
  expect(await bootstrapPilotCatalog(catalog)).toBe(fresh?'ACTIVATED_FRESH':'UNCHANGED');expect(activate).toHaveBeenCalledTimes(fresh?1:0);
  if(fresh)expect(activate).toHaveBeenCalledWith(ownerProvisionalPilot.pack.digest,'0','owner-provisional-local-pilot-bootstrap');
 });
 it('does not retry a failed catalog CAS or ledger/withdrawal rejection',async()=>{
  const fault=new Error('typed catalog refusal'),activate=vi.fn(async()=>{throw fault;}),catalog={rooms:{transaction:async(fn:(c:unknown)=>unknown)=>fn({query:async()=>({rows:[{active_digest:null,generation:'0',used:false}]})})},activate} as unknown as Catalog;
  await expect(bootstrapPilotCatalog(catalog)).rejects.toBe(fault);expect(activate).toHaveBeenCalledOnce();
 });
});
