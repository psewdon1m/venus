import {describe,it,expect,vi} from 'vitest';
import {mkdtempSync,writeFileSync,unlinkSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {Games} from '../../apps/api/src/games.js';
import {Catalog} from '../../apps/api/src/catalog.js';
import {RevocationLedger} from '../../packages/card-catalog/src/revocations.js';
import {DomainError} from '../../apps/api/src/security.js';
import type {Rooms} from '../../apps/api/src/rooms.js';
import pg from 'pg';
describe('actual Catalog ledger boundary cannot roll back room safety projection',()=>{
 for(const state of ['active','aborted'] as const)for(const corruption of ['missing-file','invalid-utf8','partial-ledger'] as const)it(`reports unavailable for ${corruption} and ${state} game through actual Catalog`,async()=>{
  const directory=mkdtempSync(join(tmpdir(),'venus-review-p05-ledger-')),file=join(directory,'ledger');
  try{
   const ledger=RevocationLedger.provision(file),rooms={now:()=>1000} as Rooms,games=new Games(rooms,()=>null,true),a=games as unknown as Record<string,unknown>;
   a.row=vi.fn(async()=>({id:'session',state,pack_digest:'sha256:pinned'}));
   const c={query:vi.fn(async()=>({rows:[{active_digest:null,generation:'0',ledger_head:'0'.repeat(64)}]}))} as unknown as pg.PoolClient;
   const catalog=new Catalog(rooms,games,ledger,[],true);games.attachCatalog(catalog);
   if(corruption==='missing-file')unlinkSync(file);if(corruption==='invalid-utf8')writeFileSync(file,Buffer.from([0xc3,0x28]));if(corruption==='partial-ledger')writeFileSync(file,'{');
   await expect(catalog.active(c)).rejects.toMatchObject({code:'CATALOG_LEDGER_UNAVAILABLE'});
   await expect(games.featureAvailable(c,'room')).resolves.toBe(false);
  }finally{if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.startsWith(join(tmpdir(),'venus-review-p05-ledger-')))throw Error('Unsafe owned reviewer cleanup');rmSync(directory,{recursive:true,force:true});}
 });
 for(const state of ['active','aborted'] as const)it(`reports unavailable on actual consistency mismatch with ${state} game`,async()=>{
  const rooms={now:()=>1000} as Rooms,games=new Games(rooms,()=>null,true),a=games as unknown as Record<string,unknown>;
  a.row=vi.fn(async()=>({id:'session',state,pack_digest:'sha256:pinned'}));
  const ledger={read:()=>({head:'1'.repeat(64),entries:[]})} as unknown as RevocationLedger;
  const catalog=new Catalog(rooms,games,ledger,[],true);games.attachCatalog(catalog);
  const c={query:vi.fn(async()=>({rows:[{active_digest:null,generation:'0',ledger_head:'0'.repeat(64)}]}))} as unknown as pg.PoolClient;
  await expect(games.featureAvailable(c,'room')).resolves.toBe(false);
 });
 it('preserves actual PostgreSQL transaction errors outside ledger normalization',async()=>{
  const error=new pg.DatabaseError('SQL failure',0,'error'),rooms={now:()=>1000} as Rooms,games=new Games(rooms,()=>null,true),a=games as unknown as Record<string,unknown>;
  a.row=vi.fn(async()=>({id:'session',state:'aborted'}));
  games.attachCatalog(new Catalog(rooms,games,{read:()=>{throw new Error('must not reach ledger');}} as unknown as RevocationLedger,[],true));
  await expect(games.featureAvailable({query:vi.fn(async()=>{throw error;})} as unknown as pg.PoolClient,'room')).rejects.toBe(error);
 });
});
