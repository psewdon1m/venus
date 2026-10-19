/** Durable offline authoring ledger. BEGIN IMMEDIATE serializes reservations across processes.
 * Immutable revisions and events share one FULL-synchronous SQLite transaction. */
import {DatabaseSync} from 'node:sqlite';
import {canonical,digest,type Card} from '@venus/relationship-engine';
import {analyze,requireCatalog} from './catalog.js';

export interface BatchReservation {
  batch_id:string;mode:Card['mode'];first:number;count:number;source_catalog_digest:string;request_sha256:string;author_id:string;
  constraints:{pack_id:string;meeting_contexts:Card['meeting_contexts'];allowed_interactions:Card['interaction'][];relationship_scope_distribution:Record<string,number>;comfort_distribution:Record<string,number>;progression_distribution:Record<string,number>}
}
export class AuthoringLedger {
  private readonly db:DatabaseSync;
  constructor(path:string) {
    this.db=new DatabaseSync(path);this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;');
    this.db.exec(`CREATE TABLE IF NOT EXISTS batches(id TEXT PRIMARY KEY, request TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reservations(card_id TEXT PRIMARY KEY,batch_id TEXT NOT NULL REFERENCES batches(id));
      CREATE TABLE IF NOT EXISTS revisions(card_id TEXT NOT NULL REFERENCES reservations(card_id),revision INTEGER NOT NULL,hash TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(card_id,revision));
      CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY,kind TEXT NOT NULL,body TEXT NOT NULL,previous TEXT NOT NULL,hash TEXT NOT NULL);`);
  }
  close() {this.db.close();}
  private transaction<T>(run:()=>T) {this.db.exec('BEGIN IMMEDIATE');try {const result=run();this.db.exec('COMMIT');return result;}catch(error) {this.db.exec('ROLLBACK');throw error;}}
  private event(kind:string,body:unknown) {
    const previous=(this.db.prepare('SELECT hash FROM events ORDER BY seq DESC LIMIT 1').get() as {hash:string}|undefined)?.hash??'0'.repeat(64);
    const value=canonical(body),hash=digest({kind,body,previous});this.db.prepare('INSERT INTO events(kind,body,previous,hash) VALUES(?,?,?,?)').run(kind,value,previous,hash);
  }
  private validateRequest(request:BatchReservation) {
    requireCatalog(/^[A-Za-z0-9_-]{5,128}$/.test(request.batch_id)&&['questions','truth_or_dare','yes_but'].includes(request.mode),'BATCH_INVALID');
    requireCatalog(Number.isSafeInteger(request.first)&&request.first>=1001&&Number.isSafeInteger(request.count)&&request.count>=1&&request.count<=100&&request.first+request.count<=10000,'BATCH_RANGE_INVALID');
    requireCatalog(/^sha256:[a-f0-9]{64}$/.test(request.source_catalog_digest)&&/^[a-f0-9]{64}$/.test(request.request_sha256)&&request.author_id.trim().length>0,'BATCH_SOURCE_INVALID');
    requireCatalog(request.constraints.pack_id.trim().length>0&&request.constraints.meeting_contexts.length>0&&request.constraints.allowed_interactions.length>0,'BATCH_CONSTRAINTS_INVALID');
    for(const distribution of [request.constraints.relationship_scope_distribution,request.constraints.comfort_distribution,request.constraints.progression_distribution]) requireCatalog(Object.values(distribution).every(n=>Number.isSafeInteger(n)&&n>=0)&&Object.values(distribution).reduce((a,b)=>a+b,0)===request.count,'BATCH_DISTRIBUTION_INVALID');
  }
  reserve(request:BatchReservation) {
    this.validateRequest(request);
    return this.transaction(()=>{
      const body=canonical(request),old=this.db.prepare('SELECT request FROM batches WHERE id=?').get(request.batch_id) as {request:string}|undefined;
      if(old) {requireCatalog(old.request===body,'BATCH_IDEMPOTENCY_CONFLICT');return this.ids(request);}
      this.db.prepare('INSERT INTO batches VALUES(?,?)').run(request.batch_id,body);
      for(const id of this.ids(request)) this.db.prepare('INSERT INTO reservations VALUES(?,?)').run(id,request.batch_id);
      this.event('RESERVED',request);return this.ids(request);
    });
  }
  /** Explicit request revision preserves ownership of stable IDs. Safety metadata
   * changes may need new distributions/base; an ordinary retry cannot rewrite them. */
  revise(request:BatchReservation,expectedRequestHash:string) {
    this.validateRequest(request);
    return this.transaction(()=>{
      const row=this.db.prepare('SELECT request FROM batches WHERE id=?').get(request.batch_id) as {request:string}|undefined;requireCatalog(row,'BATCH_NOT_RESERVED');
      const old=JSON.parse(row.request) as BatchReservation;
      if(row.request===canonical(request)) return this.ids(request);
      requireCatalog(old.request_sha256===expectedRequestHash,'BATCH_REVISION_CONFLICT');
      requireCatalog(old.mode===request.mode&&old.first===request.first&&old.count===request.count,'BATCH_STABLE_ID_RANGE_CHANGED');
      this.db.prepare('UPDATE batches SET request=? WHERE id=?').run(canonical(request),request.batch_id);this.event('REQUEST_REVISED',{previous_request:old,request});return this.ids(request);
    });
  }
  private ids(request:BatchReservation) {const prefix={questions:'Q',truth_or_dare:'TD',yes_but:'YB'}[request.mode];return Array.from({length:request.count},(_,i)=>`${prefix}-${String(request.first+i).padStart(4,'0')}`);}
  record(batchId:string,cards:readonly Card[]) {
    analyze(cards);
    return this.transaction(()=>{
      const batch=this.db.prepare('SELECT request FROM batches WHERE id=?').get(batchId) as {request:string}|undefined;requireCatalog(batch,'BATCH_NOT_RESERVED');
      const request=JSON.parse(batch.request) as BatchReservation,ids=this.ids(request);
      requireCatalog(cards.length===request.count&&cards.every(c=>ids.includes(c.id)&&c.mode===request.mode&&c.authoring.batch_id===batchId&&c.authoring.origin!=='example'),'BATCH_CONTENT_MISMATCH');
      const constraints=request.constraints;
      requireCatalog(cards.every(c=>c.pack_id===constraints.pack_id&&c.meeting_contexts.every(ctx=>constraints.meeting_contexts.includes(ctx))&&constraints.allowed_interactions.includes(c.interaction)),'BATCH_CONTEXT_OR_INTERACTION_MISMATCH');
      for(const [field,distribution] of [['relationship_scope',constraints.relationship_scope_distribution],['min_comfort',constraints.comfort_distribution],['min_progression_stage',constraints.progression_distribution]] as const) {
        const actual:Record<string,number>={};for(const card of cards) {const key=String(card[field]);actual[key]=(actual[key]??0)+1;}
        const expected=Object.fromEntries(Object.entries(distribution).filter(([,n])=>n>0));requireCatalog(canonical(actual)===canonical(expected),'BATCH_DISTRIBUTION_MISMATCH');
      }
      const complete=this.db.prepare('SELECT body FROM events WHERE kind=? ORDER BY seq').all('DRAFT_RECORDED') as {body:string}[];
      const all=this.db.prepare('SELECT body FROM revisions ORDER BY card_id,revision').all() as {body:string}[];
      const latest=new Map<string,Card>();for(const row of all) {const card=JSON.parse(row.body) as Card;latest.set(card.id,card);}
      for(const card of cards) {
        const old=latest.get(card.id),hash=digest(card);
        if(old&&card.revision===old.revision) requireCatalog(digest(old)===hash,'CARD_IMMUTABLE_REVISION');
        else {
          requireCatalog(card.revision===(old?.revision??0)+1,'CARD_REVISION_SEQUENCE');
          this.db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(card.id,card.revision,hash,canonical(card));
        }
        latest.set(card.id,card);
      }
      analyze([...latest.values()]);
      const record={batch_id:batchId,card_hashes:cards.map(c=>({id:c.id,revision:c.revision,sha256:digest(c)})).sort((a,b)=>a.id<b.id?-1:1)};
      if(!complete.some(row=>row.body===canonical(record))) this.event('DRAFT_RECORDED',record);
      return record;
    });
  }
  export() {
    const rows=this.db.prepare('SELECT seq,kind,body,previous,hash FROM events ORDER BY seq').all() as {seq:number;kind:string;body:string;previous:string;hash:string}[];
    let previous='0'.repeat(64);
    for(const row of rows) {requireCatalog(row.previous===previous&&row.hash===digest({kind:row.kind,body:JSON.parse(row.body),previous}),'AUTHORING_LEDGER_CORRUPT');previous=row.hash;}
    return {schema_version:1,head:previous,events:rows.map(row=>({...row,body:JSON.parse(row.body) as unknown}))};
  }
}
