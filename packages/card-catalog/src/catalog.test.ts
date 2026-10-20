import {describe,it,expect} from 'vitest';
import {readFileSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonical,digest,FrozenPack,type Card} from '@venus/relationship-engine';
import {analyze,normalized,manifestFor,reviewedCandidate,requiredHumanChecks,type HumanReview,type HumanReviewer} from './catalog.js';
import {AuthoringLedger,type BatchReservation} from './authoring.js';
import {RevocationLedger} from './revocations.js';
import {coverageSnapshot,safeAvailability,coverageReport} from './coverage.js';
import {strictJson} from './json.js';
import {loadReviewedBundles,bundledPacks} from './bundles.js';

function card(index=0):Card {
  const value=JSON.parse(readFileSync('.docs/examples/cards/Q-0001.json','utf8')) as Card;
  return {...value,id:`Q-${1001+index}`,category:['icebreaker','memory','music','friendship','humor'][index%5]!,
    text:{ru:{question:`Синтетический вопрос ${index}: выберите цвет.`},en:{question:`Synthetic question ${index}: choose a colour.`},tr:{question:`Sentetik soru ${index}: bir renk seçin.`}},
    authoring:{...value.authoring,origin:'agent',batch_id:'P04-TEST-Q-001',source_notes:'SYNTHETIC TEST ONLY, not a production draft or real review.'}};
}
function fixtureCards() {
  const cards:Card[]=[];
  for(let i=0;i<100;i++) {
    cards.push(card(i));
    const base=card(i),td:Card={...base,id:`TD-${1001+i}`,mode:'truth_or_dare',text:{ru:{truth:`Тестовая правда ${i}: назовите оттенок.`,dare:`Тестовое действие ${i}: придумайте название.`},en:{truth:`Test truth ${i}: name a shade.`,dare:`Test dare ${i}: invent a title.`},tr:{truth:`Deneme doğruluk ${i}: bir ton söyleyin.`,dare:`Deneme cesaret ${i}: bir başlık bulun.`}}};cards.push(td);
    cards.push({...base,id:`YB-${1001+i}`,mode:'yes_but',interaction:'pair_public',participants_required:2,consent:'bilateral',relationship_scope:'acquaintance',text:{
      ru:{proposal:`{P1}, предложи игроку {P2} выдумать тестовое слово ${i}.`,responder:'Можно задать своё условие или отказаться.'},
      en:{proposal:`{P1}, offer {P2} to invent test word ${i}.`,responder:'Set your own condition or decline.'},
      tr:{proposal:`{P1}, {P2} adlı oyuncuya ${i} numaralı deneme sözcüğünü bulmayı öner.`,responder:'Kendi koşulunu söyle veya reddet.'}}});
  }
  return cards;
}
function humanFixture(cards:Card[]) {
  const keys=generateKeyPairSync('ed25519'),analysis=analyze(cards);
  const person:HumanReviewer={id:'SYNTHETIC-TEST-REVIEWER',kind:'human',public_key_pem:keys.publicKey.export({type:'spki',format:'pem'}).toString(),competencies:[...requiredHumanChecks],operator_evidence:'SYNTHETIC TEST TRUST FIXTURE ONLY. No real person/competence/rights claimed.'};
  const review:HumanReview={schema_version:1,reviewer_id:person.id,reviewed_at:'2026-10-18T00:00:00Z',catalog_digest:analysis.catalog_digest,card_hashes:cards.map(digest),checks:[...requiredHumanChecks],
    similarity_dispositions:analysis.similarity_queue.map(item=>({id:item.id,decision:'distinct_originals',reason:'Synthetic fixture disposition; no original-content claim.'})),decision:'approve',notes:'SYNTHETIC TEST ONLY'};
  const signed=(value:HumanReview)=>({review:value,signature_base64:sign(null,Buffer.from(canonical(value)),keys.privateKey).toString('base64')});
  return {person,review,signed};
}
describe('P04 catalogue authoring and independent review boundary',()=>{
  it('distinguishes a missing required in-person channel from a real private content shortage',()=>{
    const publicCards=fixtureCards().filter(c=>c.id.endsWith('1001'));
    const privateCard:Card={...card(1),interaction:'pair_private',participants_required:2,consent:'bilateral',relationship_scope:'friend_or_more',min_comfort:1,min_progression_stage:3,meeting_contexts:['in_person'],safety_tags:['private'],required_capabilities:['private_text_chat'],text:{ru:{question:'{P2}, назови вымышленный цвет для тестовой пары.'},en:{question:'{P2}, name an imaginary colour for the test pair.'},tr:{question:'{P2}, deneme çifti için hayali bir renk söyle.'}}};
    const cards=[...publicCards,privateCard],pack=FrozenPack.load(cards,manifestFor(cards),true);
    const off=coverageReport(pack,[],[20]),on=coverageReport(pack,['private_text_chat'],[20]);
    const eligibleProfile=(r:ReturnType<typeof coverageReport>)=>r.cells.find(c=>c.mode==='questions'&&c.context==='in_person'&&c.size===2&&c.stage===3&&c.comfort===1&&c.resolved_class==='F')!;
    expect(eligibleProfile(off).private_profile_status).toBe('CAPABILITY_UNAVAILABLE');
    expect(off.private_sessions.find(c=>c.mode==='questions'&&c.context==='in_person'&&c.size===2&&c.comfort===1&&c.resolved_class==='F')?.status).toBe('CAPABILITY_UNAVAILABLE');
    expect(eligibleProfile(on).private_profile_status).toBe('CONTENT_GAP');
    expect(eligibleProfile(on).private_baseline_card_count).toBe(1);
    const legacyCards=[...publicCards,{...privateCard,required_capabilities:[]}];
    const legacy=coverageReport(FrozenPack.load(legacyCards,manifestFor(legacyCards),true),[],[20]);
    expect(eligibleProfile(legacy).private_profile_status).toBe('CONTENT_GAP');
  });
  it('rejects nested duplicate keys, nonfinite values, excessive nesting and invalid JSON',()=>{
    for(const text of ['{"a":1,"a":2}','{"a":{"b":1,"b":2}}','{"a":1e999}','[NaN]','{"a":1,}','[1,]','[true false]','[','"unterminated','['.repeat(65)+'0'+']'.repeat(65)]) expect(()=>strictJson(text)).toThrow();
    expect(strictJson('{"a":[1,true,null,"x"],"b":{}}')).toEqual({a:[1,true,null,'x'],b:{}});
    expect(()=>strictJson('{"\\u0061":1,"a":2}')).toThrow('CATALOG_JSON_DUPLICATE_KEY');
    expect(()=>strictJson('"\\ud800"')).toThrow('CATALOG_JSON_INVALID_UNICODE');expect(strictJson('"\\ud83d\\ude00"')).toBe('😀');
  });
  it('rejects duplicate text across modes, locales and individual TD sides',()=>{
    const a=card(),b=card(1);b.text.en.question=a.text.en.question!;expect(()=>analyze([a,b])).toThrow('CARD_013_EXACT_DUPLICATE');
    const td=fixtureCards().find(c=>c.mode==='truth_or_dare')!;td.text.tr.dare=a.text.tr.question!;expect(()=>analyze([a,td])).toThrow('CARD_013_EXACT_DUPLICATE');
    expect(normalized('I İ ı i','tr')).toBe('ı i ı i');expect(normalized('ЁЖ,  ДОМ!','ru')).toBe('ёж дом');
  });
  it('uses the production strict loader, rejecting bidi/control/role/render-budget tampering',()=>{
    for(const value of ['A\u202eB','<script>','https://bad.test','Unbalanced {','{P1} '.repeat(200)]) {
      const a=card();a.text.en.question=value;expect(()=>analyze([a])).toThrow();
    }
    const a=card();a.interaction='solo';a.participants_required=1;expect(()=>analyze([a])).toThrow();
  });
  it('never promotes drafts without complete signed independent review; changes invalidate it',()=>{
    const cards=fixtureCards(),{person,review,signed}=humanFixture(cards);
    expect(()=>reviewedCandidate(cards,[],[person],['author'])).toThrow('CATALOG_HUMAN_REVIEW_INCOMPLETE');
    expect(()=>reviewedCandidate(cards,[signed(review)],[person],[person.id])).toThrow('CATALOG_HUMAN_TRUST_REQUIRED');
    expect(()=>reviewedCandidate(cards,[{review,signature_base64:'bad'}],[person],['author'])).toThrow();
    const altered=structuredClone(cards);altered[0]!.text.en.question+=' Changed.';
    expect(()=>reviewedCandidate(altered,[signed(review)],[person],['author'])).toThrow('CATALOG_REVIEW_STALE_OR_INVALID');
    expect(()=>reviewedCandidate(cards,[signed({...review,checks:['editorial']})],[person],['author'])).toThrow('CATALOG_HUMAN_REVIEW_INCOMPLETE');
    expect(()=>reviewedCandidate(cards,[signed({...review,similarity_dispositions:[]})],[person],['author'])).toThrow('CATALOG_SIMILARITY_UNRESOLVED');
    const candidate=reviewedCandidate(cards,[signed(review)],[person],['author']);expect(candidate.pack.synthetic).toBe(false);expect(candidate.manifest.reviewed_cards).toBe(300);
    expect(cards.every(c=>c.status==='draft')).toBe(true);
    const entry={draft_cards:cards,cards:candidate.cards,manifest:candidate.manifest,reviews:[signed(review)],reviewers:[person],author_ids:['author'],pack_revision:1};
    expect(loadReviewedBundles({schema_version:1,approved:[entry]})[0]?.digest).toBe(candidate.pack.digest);expect(bundledPacks).toHaveLength(0);
    const tampered=structuredClone(entry);tampered.cards[0]!.text.en.question+=' changed';expect(()=>loadReviewedBundles({schema_version:1,approved:[tampered]})).toThrow('CATALOG_BUNDLE_REVIEW_BINDING_INVALID');
  });
  it('rejects example-origin and wrong-role material even with a signed record',()=>{
    const cards=fixtureCards();cards[0]!.authoring.origin='example';const {person,review,signed}=humanFixture(cards);
    expect(()=>reviewedCandidate(cards,[signed(review)],[person],['author'])).toThrow('PACK_NOT_REVIEWED');
  });
  it('reserves durable unique IDs, retries idempotently and rolls failed batches back',()=>{
    const dir=mkdtempSync(join(tmpdir(),'venus-p04-authoring-')),path=join(dir,'ledger.sqlite');
    let ledger=new AuthoringLedger(path);
    try {
      const request:BatchReservation={batch_id:'P04-TEST-Q-001',mode:'questions',first:1001,count:2,source_catalog_digest:'sha256:'+'0'.repeat(64),request_sha256:'1'.repeat(64),author_id:'synthetic-author',constraints:{pack_id:'venus-cards-core',meeting_contexts:['online','in_person'],allowed_interactions:['group'],relationship_scope_distribution:{none:2},comfort_distribution:{'0':2},progression_distribution:{'1':2}}};
      expect(ledger.reserve(request)).toEqual(['Q-1001','Q-1002']);expect(ledger.reserve(request)).toHaveLength(2);
      expect(()=>ledger.reserve({...request,request_sha256:'2'.repeat(64)})).toThrow('BATCH_IDEMPOTENCY_CONFLICT');
      expect(()=>ledger.reserve({...request,batch_id:'P04-CONFLICT'})).toThrow();
      ledger.record(request.batch_id,[card(),card(1)]);const head=ledger.export().head;ledger.close();ledger=new AuthoringLedger(path);
      ledger.record(request.batch_id,[card(),card(1)]);expect(ledger.export().head).toBe(head);
      const changed=card();changed.text.en.question+=' changed';expect(()=>ledger.record(request.batch_id,[changed,card(1)])).toThrow('CARD_IMMUTABLE_REVISION');
      expect(ledger.export().head).toBe(head);
      const wrongContext=card();wrongContext.min_comfort=1;expect(()=>ledger.record(request.batch_id,[wrongContext,card(1)])).toThrow('BATCH_DISTRIBUTION_MISMATCH');
      const revised=[changed,{...card(1)}];revised[0]!.revision=2;ledger.record(request.batch_id,revised);expect(ledger.export().head).not.toBe(head);
      const nextRequest={...request,request_sha256:'3'.repeat(64),constraints:{...request.constraints,comfort_distribution:{'0':1,'1':1}}};
      expect(()=>ledger.revise(nextRequest,'9'.repeat(64))).toThrow('BATCH_REVISION_CONFLICT');
      expect(ledger.revise(nextRequest,request.request_sha256)).toEqual(['Q-1001','Q-1002']);
      revised[0]!.revision=3;revised[0]!.min_comfort=1;ledger.record(request.batch_id,revised);
      expect(ledger.export().events.some(e=>e.kind==='REQUEST_REVISED')).toBe(true);
    } finally {ledger.close();rmSync(dir,{recursive:true,force:true});}
  });
  it('makes missing/corrupt/truncated revocation ledgers fail closed and replays durable intent',()=>{
    const dir=mkdtempSync(join(tmpdir(),'venus-p04-revoke-')),path=join(dir,'ledger.jsonl');
    try {
      expect(()=>new RevocationLedger(path)).toThrow();const ledger=RevocationLedger.provision(path);
      const entry=ledger.append({card_id:'Q-1001',revision:1,operator_id:'synthetic-operator',reason_code:'safety',at:'2026-10-18T00:00:00Z'});
      expect(new RevocationLedger(path).read().head).toBe(entry.hash);expect(()=>RevocationLedger.provision(path)).toThrow();
      writeFileSync(path,'');expect(()=>ledger.read()).toThrow('CATALOG_LEDGER_REGRESSED');
      writeFileSync(path,'{');expect(()=>new RevocationLedger(path)).toThrow('CATALOG_LEDGER_PARTIAL_WRITE');
    } finally {rmSync(dir,{recursive:true,force:true});}
  });
  it('previews the actual planner, rejects all-X YesBut and insufficient requested rounds',()=>{
    const cards=fixtureCards().filter(c=>Number(c.id.split('-')[1])<=1020),pack=FrozenPack.load(cards,manifestFor(cards),true);
    for(const mode of ['questions','truth_or_dare','yes_but'] as const) for(const context of ['online','in_person'] as const) for(let size=2;size<=8;size++) {
      expect(safeAvailability(coverageSnapshot(pack,size,mode,context,0,'F',20,[]),pack).available).toBe(true);
      expect(safeAvailability(coverageSnapshot(pack,size,mode,context,0,'F',21,[]),pack)).toEqual({available:false,requested_rounds:21,reason:'INSUFFICIENT_SAFE_CARDS'});
      if(mode==='yes_but') expect(safeAvailability(coverageSnapshot(pack,size,mode,context,0,'X',20,[]),pack).available).toBe(false);
    }
  });
});
