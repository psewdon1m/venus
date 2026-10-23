/** Exact historical I01-I15 definitions/pure-consent probes. Not actual auth. */
function assert(ok,code) {if(!ok) throw new Error(code);}
export function invariantDefinitions() {return [
  ['I01','X veto','selected plans'],['I02','all affected comfort','selected plans'],['I03','stage ceiling','selected plans'],['I04','online physical/going-away exclusion','selected plans'],['I05','physical scope and bilateral action','planner + pure consent; DB integration required'],['I06','private scope, actor approval, targeted projection','planner + pure consent + production public renderer; HTTP/WS DB integration required'],['I07','scope and confirmed couple','selected plans'],['I08','immutable snapshot, refusal remains possible','immutable snapshot + pure consent; runtime integration required'],['I09','locale changes text only','production public renderer; no locale accepted by snapshot'],['I10','host cannot accept/read edges','pure consent negative; HTTP/DB ACL integration required'],['I11','timer never implies performed','pure consent expiry; physical-world completion cannot be measured'],['I12','production reviewed cards only','production pack loader rejects this draft; human approval remains P04'],['I13','generic invitation has no edge/reason','recursive production public projection assertion; actual transport integration required'],['I14','close revokes/wipes','NOT_TESTABLE_IN_PURE_PLANNER: required DB/WS close integration'],['I15','safe fallback same guards','all selected plans checked independently; safe refusal recorded']
  ].map(([id,requirement,scope])=>({id,requirement,scope,checks:0,violations:0,runtime_evidence_required:['I05','I06','I08','I10','I12','I13','I14'].includes(id)}));}
export function consentCheckFactory(engine){
const {proposeConsent,consentAllows,consentResponse,reconcileConsent}=engine;
function consentChecks(plan,rows) {
  if(plan.actors.length!==2) return;const actors=plan.actors,reference=o=>({offer_id:o.offer_id,scope:o.scope,proposal_revision:o.proposal_revision});
  let action=proposeConsent('synthetic-action',actors,'action',100,180000);assert(!consentAllows(action,actors[0],100),'I05_PRECONSENT');action=consentResponse(action,actors[0],'accept',101,reference(action));assert(!consentAllows(action,actors[0],101),'I05_ONE_ACK');action=consentResponse(action,actors[1],'accept',102,reference(action));assert(consentAllows(action,actors[0],102),'I05_BILATERAL');rows[4].checks++;
  assert(reconcileConsent(action,180000).state==='expired','I11_EXPIRY');rows[10].checks++;
  const stopped=consentResponse(action,actors[0],'stop',103);assert(!consentAllows(stopped,actors[1],104),'I08_REFUSAL');rows[7].checks++;
  let rejected=false;try {consentResponse(action,'non-actor-host','accept',103,reference(action));}catch {rejected=true;}assert(rejected,'I10_HOST_ACK');rows[9].checks++;
  if(plan.interaction==='pair_private') {const invite=proposeConsent('synthetic-invitation',actors,'invitation',100);assert(!consentAllows(invite,actors[0],100),'I06_PENDING');rows[5].checks++;}
}
return consentChecks;
}
