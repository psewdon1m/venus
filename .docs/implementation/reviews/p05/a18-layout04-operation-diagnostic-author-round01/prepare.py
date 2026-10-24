from pathlib import Path
import json,hashlib,shutil,difflib
r=Path('C:/.projects/venus');o=Path(__file__).parent;p=r/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-03';c=p.with_name('p05-v2-layout-producer-a18-04');assert not c.exists();shutil.copytree(p,c)
def edit(name,changes):
 b=(p/name).read_bytes()
 for before,after in changes:
  before=before.encode();after=after.encode();assert b.count(before)==1,(name,before[:70]);b=b.replace(before,after)
 (c/name).write_bytes(b)
ops=['CLOCK_BEFORE','DOM_AUDIT','PRIVATE_OBSERVER_GUARD','TARGETS','KEYBOARD_HEADING','KEYBOARD_TAB','KEYBOARD_FOCUS','CAPTURE','CLOCK_AFTER']
old_enums="['FOREGROUND','FRESH_SCOPE','POSITIVE_DOM_PREPARATION','INITIAL_PROJECTION','MEASUREMENT','FINAL_PROJECTION']";new_enums=old_enums[:-1]+','+','.join("'"+x+"'" for x in ops)+']'
edit('browser.mjs',[(old_enums,new_enums),("layout_method_revision:'A18_BOUNDED_OFFER_SWEEPS_03'","layout_method_revision:'A18_BOUNDED_OFFER_SWEEPS_04'")])
edit('measure.mjs',[("export async function keyboard(page,targets,xserver,budget,alreadyForeground=false){","export async function keyboard(page,targets,xserver,budget,alreadyForeground=false,onCheckpoint=()=>{}){"),("await bounded(budget,'content-heading-focus'","onCheckpoint('KEYBOARD_HEADING');await bounded(budget,'content-heading-focus'"),("attempts++){await bounded(budget,'physical-tab'","attempts++){onCheckpoint('KEYBOARD_TAB');await bounded(budget,'physical-tab'"),("const value=await bounded(budget,'actual-focus'","onCheckpoint('KEYBOARD_FOCUS');const value=await bounded(budget,'actual-focus'"),("const clockBefore=await bounded(","onCheckpoint('CLOCK_BEFORE');const clockBefore=await bounded("),("const audit=await bounded(budget,'dom-audit'","onCheckpoint('DOM_AUDIT');const audit=await bounded(budget,'dom-audit'"),("if(isPrivate&&role==='observer'){","onCheckpoint('PRIVATE_OBSERVER_GUARD');if(isPrivate&&role==='observer'){"),("const targets=await bounded(budget,'own-visible-targets'","onCheckpoint('TARGETS');const targets=await bounded(budget,'own-visible-targets'"),("keys=await keyboard(actor.page,targets,xserver,budget,true);","keys=await keyboard(actor.page,targets,xserver,budget,true,onCheckpoint);"),("const file=cell.id.replaceAll('/','-')","onCheckpoint('CAPTURE');const file=cell.id.replaceAll('/','-')"),("const clockAfter=await bounded(budget,'native-clock-after'","onCheckpoint('CLOCK_AFTER');const clockAfter=await bounded(budget,'native-clock-after'")])
range_meta="""// Fixed diagnostics only. No message/stack/code value outside these enums is emitted.
const rangeNodeCodes=new Set(['ERR_OUT_OF_RANGE','ERR_BUFFER_OUT_OF_BOUNDS','ERR_STRING_TOO_LONG','ERR_BUFFER_TOO_LARGE','ERR_FS_FILE_TOO_LARGE']);
const rangeStockKinds=new Map([['Maximum call stack size exceeded','CALL_STACK_EXHAUSTED'],['Invalid string length','INVALID_STRING_LENGTH'],['Invalid array length','INVALID_ARRAY_LENGTH'],['Array buffer allocation failed','ARRAY_BUFFER_ALLOCATION_FAILED']]);
function rangeFailureMetadata(error,name,message){
 if(name!=='RangeError')return {};const code=errorData(error,'code');return {range_error_kind:typeof message==='string'&&message.length<=128?(rangeStockKinds.get(message)??'UNKNOWN'):'UNKNOWN',node_code:typeof code==='string'&&code.length<=64&&rangeNodeCodes.has(code)?code:'UNKNOWN'};
}
"""
edit('probe-policy.mjs',[("function failureLocation(error,name,message){",range_meta+"function failureLocation(error,name,message,nodeCode){"),("const header=name+(name==='AssertionError'?' [ERR_ASSERTION]':'')+(message?': '+message:'');","const header=name+(name==='AssertionError'?' [ERR_ASSERTION]':name==='RangeError'&&rangeNodeCodes.has(nodeCode)?' ['+nodeCode+']':'')+(message?': '+message:'');"),("return {name,code:failureCodes.has(prefix)?prefix:fallback.code,...failureLocation(error,name,message)};","const range=rangeFailureMetadata(error,name,message);return {name,code:failureCodes.has(prefix)?prefix:fallback.code,...range,...failureLocation(error,name,message,range.node_code)};")])
for name in ['runner-policy.mjs','inert-report-fixture.mjs']:edit(name,[("A18_BOUNDED_OFFER_SWEEPS_03","A18_BOUNDED_OFFER_SWEEPS_04")])
edit('run.mjs',[("p05-v2-layout-producer-a18-03","p05-v2-layout-producer-a18-04")])
ack=json.loads((p/'ROOT_RUN_ACK.json').read_text());ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path=None,independent_review_index_sha256=None,producer_runtime_digest=None,issued_at=None,layout_method_revision='A18_BOUNDED_OFFER_SWEEPS_04',scope='DIAGNOSTIC04_OPERATION_ENUM_AND_SAFE_RANGEERROR_ONLY_PENDING_REVIEW_NO_AUTHORITY');(c/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n',encoding='utf8')
design="""# A18 layout04 — diagnostic operation revision only

Procedure03 grouping/counts/budgets remain unchanged:2x4 normal private_offer,15 fresh preparations/actions per shard,135matrix,27private-session recordcap/max3,all459cells/324typography. This revision adds fixed in-memory operation checkpoint callbacks at existing work boundaries plus bounded stockRangeError/Nodecode/ownedlocation metadata; no save/DOMeval/sample/Tab/clock/scroll/focus/timer/budget/policy added. Unknowntext stays fixedUNKNOWN, no rawerror/stack/privatepayload export. Existing catches retain original failure and save the last enum. CurrentA18source1872/image181f/browser04f/source6ba unchanged; no actual04 acceptance. Earlier procedure descriptions below retain their historical revision names.

---

""";(c/'DESIGN.md').write_text(design+(p/'DESIGN.md').read_text(),encoding='utf8')
for name in ['browser.mjs','measure.mjs','probe-policy.mjs','runner-policy.mjs','inert-report-fixture.mjs','run.mjs','DESIGN.md']:(o/(name+'.diff')).write_text(''.join(difflib.unified_diff((p/name).read_text().splitlines(True),(c/name).read_text().splitlines(True),fromfile='a18-03/'+name,tofile='a18-04/'+name)),encoding='utf8')
print(json.dumps({'status':'PREPARED_DIAGNOSTIC_ONLY_NO_NATIVE','producer':str(c),'operation_enums':ops,'unchanged_procedure_counts':[15,135,27]}))
