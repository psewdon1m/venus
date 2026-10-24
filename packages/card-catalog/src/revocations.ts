/** Durable metadata-only ledger lives OUTSIDE database backups. Missing/corrupt/truncated
 * files fail closed. Its directory/volume is provisioned and protected by the operator. */
import {openSync,readFileSync,writeFileSync,fsyncSync,closeSync,unlinkSync,statSync} from 'node:fs';
import {TextDecoder} from 'node:util';
import {digest,canonical} from '@venus/relationship-engine';
import {requireCatalog} from './catalog.js';
import {strictJson} from './json.js';
export interface Withdrawal {card_id:string;revision:number;reason_code:'rights'|'safety'|'correction';operator_id:string;at:string}
export interface WithdrawalEntry {seq:number;previous:string;hash:string;withdrawal:Withdrawal}
export const emptyLedgerHead='0'.repeat(64);
export class RevocationLedger {
  private observed:WithdrawalEntry[]=[];
  constructor(readonly path:string,private readonly checkpoint?:()=>void) {this.read();}
  /** Only initial operator provisioning; never called automatically on startup/restore. */
  static provision(path:string) {const fd=openSync(path,'wx',0o600);try {fsyncSync(fd);}finally {closeSync(fd);}return new RevocationLedger(path);}
  read() {
    requireCatalog(statSync(this.path).size<=16*1024*1024,'CATALOG_LEDGER_TOO_LARGE');const raw=new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(this.path));requireCatalog(raw===''||raw.endsWith('\n'),'CATALOG_LEDGER_PARTIAL_WRITE');
    let previous=emptyLedgerHead;const entries:WithdrawalEntry[]=[];
    for(const line of raw.split('\n').filter(Boolean)) {
      const entry=strictJson(line) as WithdrawalEntry,w=entry.withdrawal;
      requireCatalog(entry.seq===entries.length+1&&entry.previous===previous&&entry.hash===digest({seq:entry.seq,previous,withdrawal:w}),'CATALOG_LEDGER_CORRUPT');
      requireCatalog(/^(Q|TD|YB)-[0-9]{4}$/.test(w.card_id)&&Number.isSafeInteger(w.revision)&&w.revision>=1&&['rights','safety','correction'].includes(w.reason_code)&&w.operator_id.trim().length>0&&Number.isFinite(Date.parse(w.at)),'CATALOG_LEDGER_INVALID');
      entries.push(entry);previous=entry.hash;
    }
    requireCatalog(this.observed.every((entry,i)=>entries[i]?.hash===entry.hash),'CATALOG_LEDGER_REGRESSED');this.observed=entries;
    this.checkpoint?.();return {entries,head:previous};
  }
  append(withdrawal:Withdrawal) {
    const lock=this.path+'.lock',locked=openSync(lock,'wx',0o600);
    try {
      const state=this.read();
      const old=state.entries.find(e=>e.withdrawal.card_id===withdrawal.card_id&&e.withdrawal.revision===withdrawal.revision);if(old) return old;
      const body={seq:state.entries.length+1,previous:state.head,withdrawal},entry={...body,hash:digest(body)};
      // Validate before any write using a temporary in-memory equivalent of the entry constraints.
      requireCatalog(/^(Q|TD|YB)-[0-9]{4}$/.test(withdrawal.card_id)&&Number.isSafeInteger(withdrawal.revision)&&withdrawal.revision>=1&&['rights','safety','correction'].includes(withdrawal.reason_code)&&withdrawal.operator_id.trim().length>0&&Number.isFinite(Date.parse(withdrawal.at)),'CATALOG_LEDGER_INVALID');
      const fd=openSync(this.path,'a');try {writeFileSync(fd,canonical(entry)+'\n');fsyncSync(fd);}finally {closeSync(fd);}
      this.read();return entry;
    } finally {closeSync(locked);unlinkSync(lock);}
  }
}
