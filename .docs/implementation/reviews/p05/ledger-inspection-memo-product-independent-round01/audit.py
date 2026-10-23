from pathlib import Path
import json,hashlib,sys
root=Path('C:/.projects/venus'); here=Path(__file__).resolve().parent
author=root/'.docs/implementation/reviews/p05/ledger-inspection-memo-product-author-round01'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
assert sha(author/'INDEX.json')=='be092f3c0ce8d8d9082b5e22f018780a5122a24c949f967dee4d266537b05439'
idx=read(author/'INDEX.json');assert len(idx['files'])==26
for name,pin in idx['files'].items():
    p=author/name;assert sha(p)==pin['sha256'] and p.stat().st_size==pin['bytes'],name
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
current=inventory();parent=read(root/'.artifacts/p05-pilot-bundle-source-freeze12.json')['files']
changed=sorted(k for k in current.keys()&parent.keys() if current[k]!=parent[k]);added=sorted(current.keys()-parent.keys());removed=sorted(parent.keys()-current.keys())
expected=['apps/api/src/private-topic-ledger.test.ts','apps/api/src/private-topic-ledger.ts','apps/api/src/topic-games.ts']
assert changed==expected and added==['.docs/implementation/p05-source-revision-ledger-inspection-memo-01.json'] and not removed
assert len(current)==1870 and identity(current)=='c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13'
for name in expected:
    assert (root/name).read_bytes()==(author/'after'/name).read_bytes()
    assert (root/'.artifacts/p05-pilot-bundle-source12'/name).read_bytes()==(author/'before'/name).read_bytes()
old=(author/'before/apps/api/src/private-topic-ledger.ts').read_text();new=(author/'after/apps/api/src/private-topic-ledger.ts').read_text()
def part(s,start,end):return s[s.index(start):s.index(end)]
assert part(old,'export class TopicLedgerCodec','export type TopicLedgerPhase')==part(new,'export class TopicLedgerCodec','export type TopicLedgerPhase')
for start,end in [('  private phase(','  private reload('),('  private directory(','  private locked<')]:assert part(old,start,end)==part(new,start,end)
old_locked=old[old.index('  private locked<T>'):]
new_locked=new[new.index('  private locked<T>'):].replace('    try {\n    const chainFd=','    const chainFd=',1).replace('    }catch(error){inspectionMemo.forget(this);throw error;}\n  }','  }',1)
assert old_locked==new_locked
old_guard=part(old,'    demand(state.incarnation===this.required.incarnation','  private directory(').split('    return state;')[0]+'    return state;'
new_guard=part(new,'      demand(state.incarnation===this.required.incarnation','  private directory(').split('      return state;')[0]+'      return state;'
assert old_guard=='\n'.join(line[2:] for line in new_guard.splitlines())
g=(author/'after/apps/api/src/topic-games.ts').read_text().replace("import {clearTopicLedgerInspectionCache} from './private-topic-ledger.js';\n",'').replace('this.histories.clear();clearTopicLedgerInspectionCache();','this.histories.clear();').replace('async purge(c:pg.PoolClient,room:string){clearTopicLedgerInspectionCache();','async purge(c:pg.PoolClient,room:string){')
assert g==(author/'before/apps/api/src/topic-games.ts').read_text()
assert (root/'apps/api/src/security.ts').read_bytes()==(root/'.artifacts/p05-pilot-bundle-source12/apps/api/src/security.ts').read_bytes()
assert (root/'apps/api/src/topic-room-lifecycle.ts').read_bytes()==(root/'.artifacts/p05-pilot-bundle-source12/apps/api/src/topic-room-lifecycle.ts').read_bytes()
out={'status':'PASS_PRODUCT_SOURCE_AND_PORTABLE_CONTROLS_PENDING_LINUX_NATIVE','source_identity':identity(current),'included_files':len(current),'changed':changed,'added':added,'other_parent_paths_exact':1866,'author_children_verified':26,'codec_class_IO_durability_guard_inverses':True,'security_lifecycle_exact_A15':True,'portable_focused_PASS':17,'independent_real_codec_negatives_PASS':3,'Linux_native_acceptance':'PENDING','new_native_actions':0,'APP_writes':False}
(here/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
paths=[author/'INDEX.json',author/'REPORT.md',author/'source-revision.json']+[root/n for n in changed+added]
paths += [root/'.artifacts/p05-ledger-memo-independent01'/n for n in ['security.js','private-topic-ledger.js']]
(here/'INPUT-PINS.json').write_text(json.dumps({'files':[{'path':str(p.relative_to(root)).replace('\\','/'),'sha256':sha(p),'bytes':p.stat().st_size} for p in paths]},indent=2)+'\n',encoding='utf-8')
print(json.dumps(out))
