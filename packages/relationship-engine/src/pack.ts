import {createHash} from 'node:crypto';
import {Ajv2020} from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from './card-schema.json' with {type:'json'};
import {assertEngine,type Card} from './types.js';
import {policyDigest} from './policy-identity.js';
export function canonical(value:unknown):string {
  if(typeof value==='string') return JSON.stringify(value.normalize('NFC'));
  if(value===null||typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
}
export const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
export function freeze<T>(value:T):T {if(value&&typeof value==='object') {Object.freeze(value);for(const child of Object.values(value)) freeze(child);}return value;}
const ajv=new Ajv2020({strict:false,coerceTypes:false,removeAdditional:false});addFormats.default(ajv);
const validate=ajv.compile(schema);
const fields={questions:['question'],truth_or_dare:['truth','dare'],yes_but:['proposal','responder']} as const;
export interface PackManifest {
  schema_version:1;pack_id:string;pack_revision:number;content_contract_revision:'CARD-1';policy_revision:'RE-1';policy_sha256:string;
  status:'reviewed_release_candidate'|'illustrative_draft_candidate';locale_codes:string[];total_cards:number;reviewed_cards:number;
  mode_counts:Record<string,number>;category_counts:Record<string,number>;eligibility_cell_counts:Record<string,number>;
  cards:{id:string;revision:number;sha256:string;status:string}[];caveats:string[];canonical_payload_sha256:string;
}
function semantics(c:Card) {
  assertEngine(c.participants_required===({group:0,solo:1,pair_public:2,pair_private:2} as const)[c.interaction],'CARD_PARTICIPANTS_INVALID');
  const pair=c.interaction.startsWith('pair_'),privatePair=c.interaction==='pair_private';
  assertEngine(c.mode!=='yes_but'||pair,'CARD_MODE_INVALID');
  assertEngine(pair?c.relationship_scope!=='none'&&c.consent==='bilateral':c.relationship_scope==='none','CARD_SCOPE_INVALID');
  assertEngine(privatePair===c.safety_tags.includes('private'),'CARD_PRIVATE_INVALID');
  assertEngine(!privatePair||(c.min_comfort>=1&&c.min_progression_stage>=3&&(!c.meeting_contexts.includes('online')||c.required_capabilities.includes('private_text_chat'))),'CARD_PRIVATE_INVALID');
  assertEngine(c.requires_physical_contact===c.safety_tags.includes('physical_contact'),'CARD_PHYSICAL_INVALID');
  assertEngine(!c.requires_physical_contact||(c.meeting_contexts.length===1&&c.meeting_contexts[0]==='in_person'&&c.min_comfort===4&&c.min_progression_stage>=3&&c.consent==='bilateral'),'CARD_PHYSICAL_INVALID');
  assertEngine(!c.requires_going_away||(privatePair&&c.meeting_contexts.length===1&&c.meeting_contexts[0]==='in_person'&&c.consent==='bilateral'),'CARD_CONTEXT_INVALID');
  assertEngine(!(c.category==='romance'||c.safety_tags.includes('romantic'))||c.min_comfort>=2,'CARD_ROMANCE_INVALID');
  for(const field of fields[c.mode]) {
    const roles:string[]=[];
    for(const locale of ['ru','en','tr'] as const) {
      const text=c.text[locale][field];assertEngine(typeof text==='string','CARD_LOCALE_INVALID');
      assertEngine(text===text.normalize('NFC')&&text.trim()===text&&!/[\p{Cc}\u202A-\u202E\u2066-\u2069<>]/u.test(text)&&!/(https?:\/\/|www\.|\]\()/i.test(text),'CARD_TEXT_INVALID');
      const tokens=[...text.matchAll(/\{([^{}]+)\}/g)].map(v=>v[1]!);assertEngine(tokens.every(v=>v==='P1'||v==='P2')&&!/[{}]/.test(text.replace(/\{P[12]\}/g,'')),'CARD_PLACEHOLDERS_INVALID');
      if(field!=='responder') assertEngine(c.interaction==='group'?tokens.length===0:c.interaction==='solo'?tokens.includes('P1'):tokens.includes('P2'),'CARD_PLACEHOLDERS_INVALID');
      roles.push([...new Set(tokens)].sort().join(','));
    }
    assertEngine(new Set(roles).size===1,'CARD_LOCALE_INVALID');
  }
}
/** Constructor validates bytes and review status; synthetic drafts remain explicitly synthetic. */
export class FrozenPack {
  private constructor(readonly manifest:PackManifest,readonly cards:readonly Card[],readonly synthetic:boolean) {}
  static load(input:unknown[],manifest:PackManifest,synthetic=false) {
    const {canonical_payload_sha256,...payload}=manifest;
    assertEngine(manifest.schema_version===1&&manifest.policy_revision==='RE-1'&&manifest.policy_sha256===policyDigest.slice(7)&&manifest.content_contract_revision==='CARD-1'&&manifest.locale_codes.join(',')==='ru,en,tr','PACK_POLICY_UNSUPPORTED');
    assertEngine(digest(payload)===canonical_payload_sha256&&/^[a-f0-9]{64}$/.test(canonical_payload_sha256),'PACK_DIGEST_INVALID');
    assertEngine(input.length>0&&input.length<=30000&&manifest.total_cards===input.length&&manifest.cards.length===input.length,'PACK_COUNT_INVALID');
    assertEngine(synthetic?manifest.status==='illustrative_draft_candidate':manifest.status==='reviewed_release_candidate'&&manifest.reviewed_cards===input.length,'PACK_NOT_REVIEWED');
    const cards:Card[]=[],ids=new Set<string>();
    for(const raw of input) {
      assertEngine(validate(raw),'CARD_SCHEMA_INVALID');const card=raw as unknown as Card;semantics(card);
      assertEngine(card.pack_id===manifest.pack_id&&card.authoring.policy_revision==='RE-1'&&!ids.has(card.id),'PACK_CARD_ID_INVALID');
      ids.add(card.id);const entry=manifest.cards.find(v=>v.id===card.id);
      assertEngine(entry?.revision===card.revision&&entry.sha256===digest(card)&&entry.status===card.status,'PACK_CARD_HASH_INVALID');
      assertEngine(synthetic?card.status==='draft':card.status==='reviewed'&&Boolean(card.authoring.reviewed_by)&&Boolean(card.authoring.reviewed_at)&&card.authoring.rights_status==='original_verified'&&card.authoring.origin!=='example','PACK_NOT_REVIEWED');
      cards.push(freeze(JSON.parse(canonical(card)) as Card));
    }
    assertEngine(new Set(manifest.cards.map(c=>c.id)).size===cards.length,'PACK_CARD_ID_INVALID');
    cards.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:a.revision-b.revision);
    return Object.freeze(new FrozenPack(freeze(JSON.parse(canonical(manifest)) as PackManifest),Object.freeze(cards),synthetic));
  }
  get digest() {return 'sha256:'+this.manifest.canonical_payload_sha256;}
  card(id:string) {const value=this.cards.find(c=>c.id===id);assertEngine(value,'PACK_CARD_NOT_FOUND');return value;}
}
