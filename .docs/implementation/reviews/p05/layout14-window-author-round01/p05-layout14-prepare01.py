from pathlib import Path
import shutil,json
root=Path('C:/.projects/venus');parent=root/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume13';child=parent.with_name('p05-v2-layout-producer-resume14')
if child.exists():
 assert (child/'x11.mjs').read_bytes()==(parent/'x11.mjs').read_bytes() and (child/'run.mjs').read_bytes()==(parent/'run.mjs').read_bytes() and not (child/'ROOT_RUN_ACK.json').exists()
else:shutil.copytree(parent,child,ignore=shutil.ignore_patterns('ROOT_RUN_ACK.json'))
source=(parent/'x11.mjs').read_bytes().decode()
old="""export async function windowFor(page,xserver,budget){
 const title='Venus layout '+randomUUID();await bounded(budget,'window-title',()=>page.evaluate(t=>{document.title=t;},title));
 const windows=await windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name','^'+title+'$'));
 assert.equal(windows.length,1,'EXACT_V2_WINDOW_REQUIRED');const id=windows[0];xdo(xserver.name,'windowraise',id);xdo(xserver.name,'windowfocus','--sync',id);assert.equal(xdo(xserver.name,'getwindowfocus'),id);
 await bounded(budget,'content-focus',()=>page.bringToFront());assert.equal(xdo(xserver.name,'getwindowfocus'),id);return id;
}"""
new=(root/'.artifacts/p05-layout14-window-functions.txt').read_text()
assert source.count(old)==1
(child/'x11.mjs').write_bytes(source.replace(old,new).encode())
(child/'run.mjs').write_bytes((parent/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume13',b'p05-v2-layout-producer-resume14'))
ack=json.loads((parent/'ROOT_RUN_ACK.json').read_text());ack.update(root_run_ack=False,independent_producer_review='PENDING',independent_review_path=None,independent_review_index_sha256=None,producer_runtime_digest=None,issued_at=None,scope='PROSPECTIVE_LAYOUT14_WINDOW_FIX_PENDING_FRESH_NONAUTHOR_REVIEW_AND_ROOT_ACK');ack.pop('concurrent_workload',None)
(child/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PREPARED_NO_RUN','child':str(child),'ACK':False}))
