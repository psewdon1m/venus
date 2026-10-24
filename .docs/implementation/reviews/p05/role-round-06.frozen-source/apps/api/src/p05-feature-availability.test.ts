import {describe,it,expect,vi} from 'vitest';
import pg from 'pg';
import {mkdtempSync,rmSync,writeFileSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {RevocationLedger,emptyLedgerHead} from '@venus/card-catalog';
import {Catalog} from './catalog.js';
import {Games} from './games.js';
import {DomainError} from './security.js';
import type {Rooms} from './rooms.js';
describe('B05-003 module indicator is not a mutation or safety gate',()=>{
  for(const state of ['active','aborted']) it(`unreconciled catalogue returns unavailable for ${state} without blocking its caller`,async()=>{
    const games=new Games({} as Rooms,()=>null,true),adapters=games as unknown as Record<string,unknown>;
    adapters.row=vi.fn(async()=>({state}));adapters.pack=vi.fn(async()=>{throw new DomainError('CATALOG_RECONCILIATION_REQUIRED',503);});
    games.attachCatalog({active:async()=>{throw new DomainError('CATALOG_RECONCILIATION_REQUIRED',503);},assertPinned:async()=>{}});
    expect(await games.featureAvailable({} as pg.PoolClient,'room')).toBe(false);
  });
  it('retains a real database failure rather than claiming healthy unavailability',async()=>{
    const games=new Games({} as Rooms,()=>null,true),adapters=games as unknown as Record<string,unknown>,failure=new Error('database unavailable');
    adapters.row=vi.fn(async()=>{throw failure;});await expect(games.featureAvailable({} as pg.PoolClient,'room')).rejects.toBe(failure);
  });
  it('reports a valid pinned running game without requiring a new-start pack',async()=>{
    const games=new Games({} as Rooms,()=>null,true),adapters=games as unknown as Record<string,unknown>;
    adapters.row=vi.fn(async()=>({state:'active'}));adapters.pack=vi.fn(async()=>({}));
    expect(await games.featureAvailable({} as pg.PoolClient,'room')).toBe(true);
  });
  for(const kind of ['missing','utf8','partial'])it(`actual ${kind} withdrawal file becomes typed unavailability without hiding a PostgreSQL failure`,async()=>{
    const directory=mkdtempSync(join(tmpdir(),'venus-p05-ledger-unit-')),file=join(directory,'ledger.jsonl');
    try {
      const ledger=RevocationLedger.provision(file),games=new Games({} as Rooms,()=>null,true);
      const catalog=new Catalog({} as Rooms,games,ledger,[],true);
      if(kind==='missing')unlinkSync(file);else writeFileSync(file,kind==='utf8'?Buffer.from([0xff]):'{partial');
      const c={query:vi.fn(async()=>({rows:[{active_digest:null,generation:'0',ledger_head:emptyLedgerHead}]}))} as unknown as pg.PoolClient;
      await expect(catalog.active(c)).rejects.toMatchObject({code:'CATALOG_LEDGER_UNAVAILABLE',statusCode:503});
      const failure=new pg.DatabaseError('actual driver error shape',0,'error');
      const broken={query:vi.fn(async()=>{throw failure;})} as unknown as pg.PoolClient;
      await expect(catalog.active(broken)).rejects.toBe(failure);
    }finally{
      expect(dirname(resolve(directory))).toBe(resolve(tmpdir()));
      expect(directory.startsWith(join(tmpdir(),'venus-p05-ledger-unit-'))).toBe(true);
      rmSync(directory,{recursive:true,force:true});
    }
  });
});
