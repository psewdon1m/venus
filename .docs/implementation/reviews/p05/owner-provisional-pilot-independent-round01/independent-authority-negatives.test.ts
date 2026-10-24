import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type pg from 'pg';
import {afterEach,it,expect,vi} from 'vitest';
import {ownerProvisionalPilot,RevocationLedger} from '@venus/card-catalog';
import {FrozenPack,FrozenTopicMap,ownerProvisionalCapability,type OwnerProvisionalCapability} from '@venus/relationship-engine';
import {OwnerProvisionalTopicGameSource,ReleaseTopicGameSource,pilotAdmissionEnabled} from 'C:/.projects/venus/.artifacts/p05-pilot-bundle-source01/apps/api/src/topic-game-source.ts';
import registry from 'C:/.projects/venus/.artifacts/p05-pilot-bundle-source01/packages/card-catalog/src/owner-provisional-pilot.json' with {type:'json'};
const paths:string[]=[];afterEach(()=>{for(const p of paths.splice(0))rmSync(p,{recursive:true,force:true});});
const config={deploymentProfile:'local-pilot',origin:'https://localhost',privateTopicsEnabled:true};
for(const phase of ['active','pinned'] as const)it('independent final file-ledger fence after awaited DB identity '+phase,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'venus-pilot-independent-'));paths.push(dir);const ledger=RevocationLedger.provision(join(dir,'ledger.jsonl'));
 const catalog={active:vi.fn(async()=>ownerProvisionalPilot.pack),assertPinned:vi.fn(async()=>{})};
 const c={query:vi.fn(async()=>{await Promise.resolve();const card=ownerProvisionalPilot.pack.cards[0]!;
 ledger.append({card_id:card.id,revision:card.revision,operator_id:'independent-machine-test',reason_code:'safety',at:'2026-10-20T00:00:00Z'});
 return {rows:[{synthetic:false,manifest:ownerProvisionalPilot.pack.manifest}],rowCount:1};})} as unknown as pg.PoolClient;
 const source=new OwnerProvisionalTopicGameSource(catalog,ledger,config);
 await expect(phase==='active'?source.active(c):source.pinned(c,ownerProvisionalPilot.map.pins)).rejects.toMatchObject({code:'CATALOG_WITHDRAWN'});
 expect(c.query).toHaveBeenCalledOnce();
});
it('independent inherited capability object and serialized identity never mint admission',()=>{
 const p=ownerProvisionalPilot.pack,cap=ownerProvisionalCapability('local-pilot',p.owner_provisional!);
 for(const forged of [Object.create(cap),JSON.parse(JSON.stringify(cap))])expect(()=>FrozenPack.ownerProvisional([...p.cards],p.manifest,forged as OwnerProvisionalCapability)).toThrow('OWNER_PROVISIONAL_CAPABILITY_REQUIRED');
});
it('independent raw map whitespace change cannot carry unchanged semantic JSON authority',()=>{
 const p=ownerProvisionalPilot.pack,cap=ownerProvisionalCapability('local-pilot',p.owner_provisional!);
 const bytes={map:Buffer.concat([Buffer.from(registry.bytes.map,'base64'),Buffer.from('\n')]),taxonomy:Buffer.from(registry.bytes.taxonomy,'base64'),semantic:Buffer.from(registry.bytes.semantic,'base64')};
 expect(()=>FrozenTopicMap.ownerProvisional(bytes,p,cap)).toThrow('OWNER_PROVISIONAL_MAP_MISMATCH');
});
it('independent real non-synthetic pilot identity is still refused by production provider',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'venus-pilot-release-denial-'));paths.push(dir);const ledger=RevocationLedger.provision(join(dir,'ledger.jsonl'));
 const source=new ReleaseTopicGameSource({active:async()=>ownerProvisionalPilot.pack,assertPinned:async()=>{}},ledger);
 await expect(source.active({} as pg.PoolClient)).rejects.toMatchObject({code:'TOPIC_SOURCE_UNREVIEWED'});
});
it('independent closed deployment remains denied for loopback and remote origins',()=>{
 for(const origin of ['https://localhost','https://venus.shmoza.net'])expect(pilotAdmissionEnabled({...config,deploymentProfile:'closed',origin})).toBe(false);
});
