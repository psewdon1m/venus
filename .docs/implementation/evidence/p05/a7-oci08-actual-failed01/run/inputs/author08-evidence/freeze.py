from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil,sys
r=Path(__file__).resolve().parents[2];w=Path(__file__).resolve().parent;base=r/'.artifacts/p05-pilot-bundle-source04'
read=lambda p:json.loads(p.read_text(encoding='utf-8'));write=lambda p,v:p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8');h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=base/'.artifacts/p05-compatible-rollback-producer08';n=base/'.artifacts/p05-normal-rollback-probe02';l=base/'.artifacts/p05-v2-layout-producer-resume06';b=read(p/'BINDING.json');lb=read(l/'binding.json');nb=read(n/'ROOT-ACK.template.json')
for name,prefix in [('topic-offer-throttle-independent-round02','71beb2c1'),('archive-origin13-independent-round01','25f878e4')]:
 src=r/'.docs/implementation/reviews/p05'/name;assert h(src/'INDEX.json').startswith(prefix);dest=base/'.docs/implementation/reviews/p05'/name
 for f in src.rglob('*'):
  if f.is_file():
   to=dest/f.relative_to(src);to.parent.mkdir(parents=True,exist_ok=True)
   if to.exists():assert to.read_bytes()==f.read_bytes()
   else:shutil.copyfile(f,to)
ociText=f'''# OCI08: A7/B4 operational binding only

AUTHOR_OPERATIONAL08_READY_FOR_NONAUTHOR_BINDING_REVIEW_NOT_RUN. No Docker/DB/browser/actual14, ACK remains false. Additive from immutable07; all23 coreMJS/original14controls/resource/time/cleanup/export semantics remain exact corrected06. Original64compiled/76expanded keysets remain, no worker78 claim. Binding-only author controls9/describe/source1846/syntax/lint PASS; unissued externalACK rejects before allocation. No173repeat framework.

A7source `{b['source_identity']}`/1846 at p05-pilot-bundle-source04; testimage `{b['images']['A']}` root actual284-file receipt. Genuine B4source04237568/1836/test62602920 root278 receipt unchanged. Full root maps and2supplemental equal pilot authority files are separate from worker76 anchors. Root normal production3d051bb9/a335 images are distinct and normalcompat02 is a separate ordinary boot/provider check; component14 does not replace it.

Same engine3/ROOM2/planner/policy/7SQL and owner470/map/grant; exact compiled differences are recorded. A7 private-conversation/index helper differs from B4 due reviewed native cooldown/clock fixes, so all-engine-byte equality is explicitly FALSE. UI maps differ coherently (B4prebundle lacks bundled/view UI); actual perimage3UI maps are retained, no overlay. B4 has known freshness/offer/first privateYesBut condition defects and is not knownGA. A7source/YB3463 review +A6cooldown71beb +ownerpilot0f702 +tools25f exact copies are present under excludedA7.docs; this author does not accept itself. Parent finalfullhost944PASS/208SKIP is context, not a new author execution.

Original synthetic liveD/E/private fixture, three processboots A→B→A,7SQL equality, newerroots/history preservation, source-free safe exits, B4/view404 versionbound vs A7safe200 and numeric metadata checks remain unchanged. Historical human450 HOLD marker inside original component contract refers to original professional review claim; provisional real470 U019 localpilot is separate, never release or productionapproval. Quiesced fallback startsOFF remains distinct from original flagON functional component14. QRB_BOUND_ONLY_1 native380+host96=476 within512MiB/900s/10GiB, no advancing2s guard claim.

Bound profile/owner safeguards, immutable source checks, exact external independent/app review pins and noRUN templates are retained. Copied predecessor logs/raw maps remain historical named evidence; only BINDING/actual-image-maps/included-inputs/current08 receipt copies are current operational truth. Parent must copy eventual independent08 packet into A7excluded.docs, issue exact external ACK and run at most one authorized attempt. No prior actualFAIL promoted; fullP05 remains pending. Writes COMPLETE.
'''
(p/'README.md').write_text(ociText,encoding='utf-8');(p/'REBIND.md').write_text(ociText,encoding='utf-8')
write(p/'AUTHOR_CHECKS.json',{'status':'AUTHOR_OPERATIONAL08_NOT_RUN','core23_exact06_07':True,'binding_controls':9,'sourcefiles':1846,'compiled_each':64,'expanded_each':76,'full_root_maps':{'A':284,'B':278},'false_ACK_rejected_exit':1,'Docker_commands':0,'RUN':False,'root_ACK':False})
write(p/'cold-checks.json',{'scope':'OPERATIONAL08_COLD_ONLY','commands':read(w/'commands.json'),'old_method23_same':True,'historical07_index_sha256':h(r/'.artifacts/p05-pilot-bundle-source01/.artifacts/p05-compatible-rollback-producer07/INDEX.json'),'excluded_venv_junction':{'path':str(base/'.venv'),'target':str(r/'.venv')},'actual_RUN':False})
old=r/'.artifacts/p05-pilot-bundle-source01/.artifacts/p05-compatible-rollback-producer07';changed=[]
for f in old.rglob('*'):
 if f.is_file()and f.name!='INDEX.json':
  rel=f.relative_to(old);g=p/rel
  if g.exists()and g.read_bytes()!=f.read_bytes():changed.append({'path':rel.as_posix(),'before_sha256':h(f),'after_sha256':h(g)})
write(p/'BINDING_DELTA.json',{'status':'OPERATIONAL08_ONLY_NO_RUN','parent07_index_sha256':h(old/'INDEX.json'),'changed_existing':changed,'core23_same':True,'original14_same':True,'worker64plus76_same_keysets':True,'actual_RUN':False})
logs=p/'author08-evidence';shutil.copytree(w,logs,dirs_exist_ok=True)
normalText=f'''# Normalcompat02: final A7/B4 binding only

AUTHOR_OPERATIONAL02_ONLY_NOT_RUN. Runtime probe/outer/descriptor are byte-exact accepted normalcompat01/c7bd77a3 (19+6method checks), including legacy purpose identifier NORMAL470_PERSISTENT_A6_B4_01; that string is a stable method ID, while actual A is explicitly finalA7 from ACK pins. Only ROOT-ACK.template A source/image/full120runtime+metadata receipt fields changed. B4source/normalimage unchanged. No core/sequence/mode/rate/cap/TTL/cleanup changes, no42matrix/private search/framework.

A7 `{nb['A']['source_identity']}`/1846 normalimage `{nb['A']['image_id']}` and B4 `{nb['B']['source_identity']}`/1836 normalimage `{nb['B']['image_id']}`. Complete actual receipts/rawfreeze pinned. Native method handles A7publicYesBut identically: private-only YBcorrection does not change public branch. Sameexistingcompose/engine3/planner/pilot registry/schema verified by unchanged coldvalidator; two ordinary images are not the synthetic14testimages.

Exactly one initial C0/N2onlineYesBut public round with bilateral invitation/condition/action, app-only swap A7ON→B4OFF→sameB4ON, same DB/volumes/keyring/oldcredentials, readonly immutable persistedhashes, falsegrants/sourcefree Pause/Stop, newprepare and staleStart denials, usednullcatalog not reactivated, finalroomclose+owncleanup. No A→B→A positive re-enable or private grant claim. HTTP/manualcookies/HTTPSOrigin overloopback does not proveTLS/browser/devices. Original source/host147/111 evidence and synthetic14/privatebrowser remain separate.

19cold authorcontrols pass on final A7/B4 realpin inputs, false template rejected before allocation; runtime3bytes unchanged. Historical prepare-author.py/logs are copied provenance only, never run assembly again. Template status NOT_AUTHORIZED, final independent operational review hash/path pending. Parent must issue exact externalACK only after nonauthor review. NoDocker/ordinaryHTTP/WS/PG execution occurred here. Writes COMPLETE.
'''
(n/'REBIND02.md').write_text(normalText,encoding='utf-8')
layoutText=f'''# Layout06: A7-only operational binding

AUTHOR_OPERATIONAL06_ONLY_NOT_RUN. Carry method727092bb accepted04/root05: all browser/worker/sharedMETHOD21/helper/matrix/DOM/native/typography oracles unchanged. Only four existing files change: binding.json(finalA7/source1846/test9f5a receipts), false ROOT_RUN_ACK, run.mjs producer directory/status literals05→06/A4→A7, runner-policy exact sourcecount1842→1846. No459=9×51/3engines×RUENTr/width/native200/180ssetup/deadline/rate/assertion changes, no newframework/cases.

54field-locale/23realr4cards presentation supplement and byte-exact text fixtures remain;162logical text rows/324stress receipts acrossthreeengines, not all470visualfunctionalproof. Static all470renderbudget comes from separate accepted loader. Synthetic online/fullflows and actualpack typography remain distinct; no actualIPauth/API proof is invented. Shared passive observer uses actual bundle timing; no fakecacheacceptance or grant extension.

A7 `{lb['source_identity']}`/1846 testimage `{lb['image']}`, rootfull284receipt `{lb['root_build_receipt_sha256']}`. Current frontend/validators and packdata unchanged; wholeimage not assumed equal. Runtime digest from unchanged capture policy is89ea3cf1954a5fc2f171dd4d44540368879442fbf167e57574b3e7fcf09b0843. Accepted source/math controls carry by exact bytes; five targeted bindingcontrols PASS plus falseACK rejection/2syntax/lint0. NoactualDOM/rendering/Docker/shard happened.

Root MUST obtain final METHOD21A7 actual16PASS before layout ACK; this prerequisite is still PENDING in template. Parent must copy exact final independent layout06 review into A7excluded.docs and bind its source/image/runtime fields. NoACK/RUN/fullmatrix/cleancommit/P05PASS. Historical copied04/05 logs remain scoped to their original inputs. Writes COMPLETE.
'''
(l/'REBIND06.md').write_text(layoutText,encoding='utf-8')
# Recheck source exactly after all excluded writes and strict method equality.
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
inv=inventory(base);assert identity(inv)==b['source_identity']and len(inv)==1846;assert inv==read(p/'included-inputs.json')
carry=read(p/'METHOD_CARRY.json');assert len(carry['unchanged_MJS_files'])==22
assert (p/'scenarios.mjs').read_bytes()==(r/'.artifacts/p05-pilot-bundle-source01/.artifacts/p05-compatible-rollback-producer07/scenarios.mjs').read_bytes()
assert (p/'scenarios.mjs').read_bytes()==(r/'.artifacts/p05-engine3-bundle-source01/.artifacts/p05-compatible-rollback-producer06/scenarios.mjs').read_bytes()
for row in carry['unchanged_MJS_files']:assert h(p/row['path'])==row['sha256']
for name in ['probe.mjs','outer.mjs','DESCRIPTOR.json']:assert(n/name).read_bytes()==(r/'.artifacts/p05-normal-rollback-probe01'/name).read_bytes()
for f in (r/'.artifacts/p05-pilot-bundle-source01/.artifacts/p05-v2-layout-producer-resume05').iterdir():
 if f.is_file()and f.name not in ['binding.json','ROOT_RUN_ACK.json','run.mjs','runner-policy.mjs']:assert(l/f.name).read_bytes()==f.read_bytes()
def inventoryProducer(folder):return{f.relative_to(folder).as_posix():{'type':'regular_file','bytes':f.stat().st_size,'sha256':h(f)}for f in sorted(folder.rglob('*'))if f.is_file()and f!=folder/'INDEX.json'}
write(p/'INDEX.json',{'schema_version':1,'status':'AUTHOR_OPERATIONAL08_FINAL_A7_B4_COMPONENT14_NOT_RUN','root_ACK':False,'files':inventoryProducer(p)})
write(n/'INDEX.json',{'schema_version':1,'status':'AUTHOR_OPERATIONAL02_FINAL_A7_B4_NOT_RUN','root_ACK':False,'files':inventoryProducer(n)})
write(l/'INDEX.json',{'schema_version':1,'status':'AUTHOR_OPERATIONAL06_FINAL_A7_NOT_RUN','source_identity':b['source_identity'],'image':lb['image'],'producer_runtime_digest':'89ea3cf1954a5fc2f171dd4d44540368879442fbf167e57574b3e7fcf09b0843','root_ACK':False,'files':inventoryProducer(l)})
outputs=[]
for folder,packetName,text,meta in [(p,'compatible-rollback-author-round08',ociText,{'core23_exact':True,'synthetic14':True}),(n,'normal-production-continuity-author-round02',normalText,{'runtime3_exact01':True,'normalprovider_scope_only':True}),(l,'topic-layout-author-resume06',layoutText,{'runtime_worker_matrix_text_exact05':True,'matrix_cells':459,'text_rows':54,'actual_browser21_prerequisite':'PENDING_FINAL_A7_16PASS'})]:
 packet=r/'.docs/implementation/reviews/p05'/packetName;assert not packet.exists();packet.mkdir(parents=True);shutil.copytree(folder,packet/'producer');(packet/'REPORT.md').write_text(text,encoding='utf-8');write(packet/'HANDOFF.json',{'status':'AUTHOR_OPERATIONAL_BINDING_ONLY_INDEPENDENT_REVIEW_REQUIRED_NOT_RUN','writes_COMPLETE':True,'working_producer':str(folder),'producer_index_sha256':h(folder/'INDEX.json'),'source_identity':b['source_identity'],'included_files':1846,'root_ACK':False,'actual_RUN':False,**meta});write(packet/'INDEX.json',{'status':'AUTHOR_OPERATIONAL_BINDING_ONLY_INDEPENDENT_REVIEW_REQUIRED_NOT_RUN','files':[{'path':f.relative_to(packet).as_posix(),'bytes':f.stat().st_size,'sha256':h(f)}for f in sorted(packet.rglob('*'))if f.is_file()and f!=packet/'INDEX.json']});outputs.append({'packet':packetName,'index_sha256':h(packet/'INDEX.json'),'children':len(read(packet/'INDEX.json')['files']),'producer_index_sha256':h(folder/'INDEX.json')})
write(w/'FINAL-HANDOFF.json',{'outputs':outputs,'source1846_after_exact':True,'actual_RUN':False,'root_ACK':False,'writes_COMPLETE':True})
with(r/'.history/agents/2026-10-20-p05-a7-operational-rebind-author.md').open('a',encoding='utf-8')as j:j.write(datetime.now(timezone.utc).isoformat()+' UTC — Three additive packets frozen:'+json.dumps(outputs)+'. OCI9+normal19+layout5pinchecks, falseACK allreject, syntax/lint0. Afterall excludedwrites fullA7inventory1846exact; core23/runtime3/layoutworker unchanged. Rootactual21A7stillPENDING (layoutnotauthorized). NoRUN. Writes COMPLETE.\n')
print(json.dumps(outputs,indent=2))
