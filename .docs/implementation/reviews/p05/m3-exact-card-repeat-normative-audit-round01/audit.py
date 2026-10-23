from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys
r=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest()
paths=['.docs/10_IMPLEMENTATION_PLAN.md','.docs/08_RELATIONSHIP_ENGINE.md','.docs/P03_DEVELOPMENT.md','.docs/P05_TOPIC_ADVICE_DESIGN.md','.docs/adr/ADR-016-p03-progressive-evidence.md','.docs/adr/ADR-019-standalone-local-pilot.md','.docs/adr/ADR-023-p05-room-topic-safety-lifecycle.md','.docs/adr/ADR-024-p05-complete-private-opportunity-history.md','.docs/implementation/p03-measurement-protocol-v3.json','.docs/implementation/user-decisions.v2.json','.docs/implementation/user-decisions.v3.json','.docs/implementation/reviews/p05/topic-measurement-design-round03/PROPOSED_PREREG.json','.docs/implementation/reviews/p05/topic-measurement-design-round03/REPORT.md','.docs/implementation/reviews/p05/topic-measurement-design-round03/anti-repeat.json','packages/relationship-engine/src/topic-planner.ts']
# Resolve ADR016 by its actual repository filename, retaining the exact selected path.
paths[4]=str(next(Path('.docs/adr').glob('ADR-016-*.md'))).replace('\\','/')
inputs=[];excerpts=[]
terms=['No card repeats within a session','Query eligible unused','max_repeated_cards_per_session','private selection','Публичные semantic','собственной pair history','strict current-session0','Samepair cannot','different private pair','same family private in different pair','supersedes_measurements_only','M3 retains algorithm','used-cluster','unsupported old snapshot','function effectivePrivateCards','function blocked','function candidate(','function replaceTopicCandidateForTopics']
for name in paths:
 p=Path(name);b=p.read_bytes();inputs.append({'path':name,'bytes':len(b),'sha256':sha(b)})
 for n,line in enumerate(b.decode('utf-8-sig').splitlines(),1):
  if any(t in line for t in terms):excerpts.append({'path':name,'line':n,'text':line})
protocol=json.loads(Path(paths[8]).read_text(encoding='utf-8'));assert protocol['invariants']['max_repeated_cards_per_session']==0
proposal=json.loads(Path(paths[11]).read_text(encoding='utf-8'));assert proposal['invariants']['old_design_retained']['max_repeated_cards_per_session']==0
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert identity(current)=='732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80' and len(current)==1826
(r/'inputs.json').write_text(json.dumps({'at_utc':datetime.now(timezone.utc).isoformat(),'source_identity':identity(current),'files':len(current),'inputs':inputs},indent=2)+'\n',encoding='utf-8');(r/'excerpts.json').write_text(json.dumps(excerpts,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('PASS normative old+laterproposal exactcardzero retained; inputs',len(inputs),'excerpts',len(excerpts))
