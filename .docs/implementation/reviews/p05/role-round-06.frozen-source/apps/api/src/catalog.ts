import type pg from 'pg';
import {FrozenPack} from '@venus/relationship-engine';
import {RevocationLedger,emptyLedgerHead,type Withdrawal} from '@venus/card-catalog';
import type {Rooms} from './rooms.js';
import type {Games} from './games.js';
import {requireThat,DomainError} from './security.js';
interface State {active_digest:string|null;generation:string;ledger_head:string}
export interface GameCatalog {active(c:pg.PoolClient):Promise<FrozenPack|null>;assertPinned(c:pg.PoolClient,digest:string):Promise<void>}
/** Bundles must be immutable members of the application release. No consumer endpoint
 * accepts external JSON/URLs. This trusted API has no HTTP route or shell capability. */
export class Catalog implements GameCatalog {
  private readonly packs:ReadonlyMap<string,FrozenPack>;
  constructor(readonly rooms:Rooms,readonly games:Games,readonly ledger:RevocationLedger,packs:readonly FrozenPack[],allowSynthetic=false) {
    requireThat(packs.every(p=>!p.synthetic||allowSynthetic),'CATALOG_UNREVIEWED',503);this.packs=new Map(packs.map(p=>[p.digest,p]));
    requireThat(this.packs.size===packs.length,'CATALOG_DUPLICATE',503);
  }
  private async state(c:pg.PoolClient) {const row=(await c.query<State>('SELECT * FROM venus_catalog_state WHERE singleton=true')).rows[0];requireThat(row,'CATALOG_UNAVAILABLE',503);return row;}
  private readLedger() {
    try {return this.ledger.read();}
    catch {throw new DomainError('CATALOG_LEDGER_UNAVAILABLE',503);}
  }
  private async consistent(c:pg.PoolClient) {
    const row=await this.state(c),ledger=this.readLedger();requireThat(row.ledger_head===ledger.head,'CATALOG_RECONCILIATION_REQUIRED',503);
    const stored=(await c.query<{card_id:string;revision:number;ledger_hash:string}>('SELECT card_id,revision,ledger_hash FROM venus_catalog_withdrawals')).rows;
    requireThat(stored.length===ledger.entries.length&&stored.every(r=>ledger.entries.some(e=>e.withdrawal.card_id===r.card_id&&e.withdrawal.revision===r.revision&&e.hash===r.ledger_hash)),'CATALOG_RECONCILIATION_REQUIRED',503);return row;
  }
  async assertPinned(c:pg.PoolClient,digest:string) {
    await this.consistent(c);
    const result=await c.query(`SELECT 1 FROM game_packs p JOIN venus_catalog_withdrawals w ON EXISTS(SELECT 1 FROM jsonb_array_elements(p.cards) AS card WHERE card->>'id'=w.card_id AND (card->>'revision')::int=w.revision) WHERE p.digest=$1 LIMIT 1`,[digest]);
    requireThat(result.rowCount===0,'CATALOG_WITHDRAWN',503);
  }
  async active(c:pg.PoolClient) {
    const row=await this.consistent(c);if(!row.active_digest) return null;
    const pack=this.packs.get(row.active_digest);requireThat(pack,'CATALOG_BUNDLE_UNAVAILABLE',503);
    await this.checkPack(c,pack);return pack;
  }
  private async checkPack(c:pg.PoolClient,pack:FrozenPack) {
    const revoked=(await c.query<{card_id:string;revision:number}>('SELECT card_id,revision FROM venus_catalog_withdrawals')).rows;
    requireThat(!pack.cards.some(card=>revoked.some(r=>r.card_id===card.id&&r.revision===card.revision)),'CATALOG_WITHDRAWN',503);
  }
  async activate(digest:string,expectedGeneration:string,operatorId:string,rollback=false) {
    requireThat(operatorId.trim().length>0,'OPERATOR_REQUIRED',403);
    return this.rooms.transaction(async c=>{
      const row=await this.consistent(c);requireThat(row.generation===expectedGeneration,'CATALOG_POINTER_CONFLICT',409);
      const pack=this.packs.get(digest);requireThat(pack,'CATALOG_BUNDLE_UNAVAILABLE',503);await this.checkPack(c,pack);
      const updated=(await c.query<State>('UPDATE venus_catalog_state SET active_digest=$1,generation=generation+1 WHERE singleton=true RETURNING *',[digest])).rows[0]!;
      await c.query('INSERT INTO venus_catalog_events(kind,digest,generation,operator_id,at) VALUES($1,$2,$3,$4,$5)',[rollback?'rollback':'activate',digest,updated.generation,operatorId,new Date(this.rooms.now())]);return updated;
    },'exclusive');
  }
  async withdraw(withdrawal:Withdrawal) {
    // An fsynced intent deliberately survives DB failure. Serving remains fail-closed
    // until reconcile reapplies that intent and stops every affected pinned session.
    return this.rooms.transaction(async c=>{await this.consistent(c);this.ledger.append(withdrawal);return this.reconcileLocked(c,withdrawal.operator_id);},'exclusive');
  }
  async reconcile(operatorId:string) {requireThat(operatorId.trim().length>0,'OPERATOR_REQUIRED',403);return this.rooms.transaction(c=>this.reconcileLocked(c,operatorId),'exclusive');}
  private async reconcileLocked(c:pg.PoolClient,operatorId:string) {
    const state=await this.state(c),ledger=this.readLedger();
    requireThat(state.ledger_head===emptyLedgerHead||ledger.entries.some(e=>e.hash===state.ledger_head),'CATALOG_LEDGER_REGRESSED',503);
    for(const entry of ledger.entries) await c.query('INSERT INTO venus_catalog_withdrawals VALUES($1,$2,$3) ON CONFLICT(card_id,revision) DO NOTHING',[entry.withdrawal.card_id,entry.withdrawal.revision,entry.hash]);
    const stored=(await c.query<{card_id:string;revision:number;ledger_hash:string}>('SELECT card_id,revision,ledger_hash FROM venus_catalog_withdrawals')).rows;
    requireThat(stored.length===ledger.entries.length&&stored.every(r=>ledger.entries.some(e=>e.withdrawal.card_id===r.card_id&&e.withdrawal.revision===r.revision&&e.hash===r.ledger_hash)),'CATALOG_LEDGER_DATABASE_MISMATCH',503);
    const affected=(await c.query<{digest:string}>(`SELECT DISTINCT p.digest FROM game_packs p JOIN venus_catalog_withdrawals w ON EXISTS(SELECT 1 FROM jsonb_array_elements(p.cards) AS card WHERE card->>'id'=w.card_id AND (card->>'revision')::int=w.revision) ORDER BY p.digest`)).rows.map(r=>r.digest);
    await this.games.withdrawPacks(c,affected);
    let active=state.active_digest;
    if(active) {const pack=this.packs.get(active);if(!pack||affected.includes(active)||pack.cards.some(card=>ledger.entries.some(e=>e.withdrawal.card_id===card.id&&e.withdrawal.revision===card.revision))) active=null;}
    await c.query('UPDATE venus_catalog_state SET active_digest=$1,ledger_head=$2,generation=generation+1 WHERE singleton=true',[active,ledger.head]);
    await c.query("INSERT INTO venus_catalog_events(kind,digest,generation,operator_id,at) SELECT 'reconcile',active_digest,generation,$1,$2 FROM venus_catalog_state",[operatorId,new Date(this.rooms.now())]);
    return {ledger_head:ledger.head,active_digest:active,quarantined_packs:affected.length};
  }
}
