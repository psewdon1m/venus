from pathlib import Path
import json,hashlib
root=Path('C:/.projects/venus'); here=Path(__file__).resolve().parent
author=root/'.docs/implementation/reviews/p05/compatible-rollback-author-round19'
old=root/'.artifacts/p05-pilot-bundle-source12/.artifacts/p05-compatible-rollback-producer18'
new=old.with_name('p05-compatible-rollback-producer19')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
assert sha(author/'INDEX.json')=='fd2dd8fd4ade18d681ddf7f0ec2dd2c14f0dbbec9a08583136c3f316676a92c3'
assert sha(new/'INDEX.json')=='30d1da8e05af7264c6445381f7dfe7e2f278169195b767e97ba41cc87bfe1bff'
for folder in [author,new]:
    index=read(folder/'INDEX.json')
    for name,pin in index['files'].items():
        p=folder/name; assert sha(p)==pin['sha256'] and p.stat().st_size==pin['bytes'],name
assert len(read(author/'INDEX.json')['files'])==26 and len(read(new/'INDEX.json')['files'])==368
before=(old/'browser-child.mjs').read_bytes(); after=(new/'browser-child.mjs').read_bytes()
addition=b"diagnosticStep='B2_HOST_CONTEXT_CLOSE';gates[2].dispose();await host.context().close();"
assert after.count(addition)==1 and after.replace(addition,b'')==before
assert sha(new/'browser-child.mjs')=='9ddc1a9b097375e355cef8f222e52f6d910a5f9b6c14870f9c5e2481cf438799'
mjs=[name for name in read(old/'INDEX.json')['files'] if name.endswith('.mjs') and name!='browser-child.mjs']
assert len(mjs)==39
for name in mjs: assert (old/name).read_bytes()==(new/name).read_bytes(),name
ob=read(old/'BINDING.json'); nb=read(new/'BINDING.json'); delta=[k for k in set(ob)|set(nb) if ob.get(k)!=nb.get(k)]
assert delta==['operational_binding_revision'],delta
for name in ['PROFILE.json','CONTROL_MATRIX.md','ROOT_RUN_ACK_TEMPLATE.json','actual-image-maps.json','included-inputs.json','previous-B-runtime-pins.json']:
    assert (old/name).read_bytes()==(new/name).read_bytes(),name
assert nb['root_run_ack'] is False and read(new/'ROOT_RUN_ACK_TEMPLATE.json')['status']=='NOT_AUTHORIZED'
assert nb['source_identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de' and nb['included_files']==1869
out={'status':'PASS_OCI19_METHOD_ONLY_NATIVE_PENDING','author_children_verified':26,'producer_children_verified':368,'other_recursive_mjs_exact18':39,'runtime_delta':'One explicit awaited completed-host context cleanup after successful game-state proof; byteinverse to18 when removed.','binding_delta':delta,'new_controls':11,'prior_quiescence_controls':16,'native_actions':0,'APP_writes':False,'underlying_actual18_cause':'UNKNOWN'}
(here/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
paths=[author/'INDEX.json',new/'INDEX.json',author/'HANDOFF.md',new/'browser-child.mjs',new/'BINDING.json',new/'OPERATIONAL_REVISION19.json',author/'controls.mjs',author/'prior-quiescence-controls.mjs']
(here/'INPUT-PINS.json').write_text(json.dumps({'files':[{'path':str(p.relative_to(root)).replace('\\','/'),'sha256':sha(p),'bytes':p.stat().st_size} for p in paths]},indent=2)+'\n',encoding='utf-8')
print(json.dumps(out))
