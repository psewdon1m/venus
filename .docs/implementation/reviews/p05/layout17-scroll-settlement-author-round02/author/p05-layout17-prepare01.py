from pathlib import Path
import shutil,json,hashlib
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume16';c=p.with_name('p05-v2-layout-producer-resume17');assert not c.exists();shutil.copytree(p,c,ignore=shutil.ignore_patterns('ROOT_RUN_ACK.json','INDEX.json'))
f=c/'real-text-probe.mjs';s=f.read_bytes().decode();nl='\r\n'if'\r\n'in s else'\n'
helper="""/** Observe keyboard-scroll settlement without scrolling or extending the cell budget. */
export async function awaitTextBottom(page,budget){
 await bounded(budget,'text-bottom-reachable',async()=>{
  const handle=await page.waitForFunction(()=>{
   const hosts=document.querySelectorAll('[data-venus-owner-text-probe]');if(hosts.length!==1)return false;
   const last=[...hosts[0].querySelectorAll('p')].at(-1);if(!last)return false;
   const rect=last.getBoundingClientRect();return rect.bottom>0&&rect.bottom<=window.innerHeight+2;
  },null,{polling:'raf',timeout:budget.remaining()});
  await handle.dispose();
 });
}
""".replace('\n',nl)
assert s.count('export async function measureOwnerText(')==1;s=s.replace('export async function measureOwnerText(',helper+'export async function measureOwnerText(')
old="   const geometry=await bounded(budget,'text-geometry'";new="   await awaitTextBottom(page,budget);"+nl+old;assert s.count(old)==1;f.write_bytes(s.replace(old,new).encode())
f=c/'run.mjs';s=f.read_bytes();assert s.count(b'p05-v2-layout-producer-resume16')==1;f.write_bytes(s.replace(b'p05-v2-layout-producer-resume16',b'p05-v2-layout-producer-resume17'))
(c/'ROOT_RUN_ACK.json').write_text(json.dumps({'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d','image':'sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2','status':'NOT_AUTHORIZED_PENDING_NEW_INDEPENDENT_REVIEW'},indent=2)+'\n')
print(json.dumps({'path':str(c),'real_text_sha256':hashlib.sha256((c/'real-text-probe.mjs').read_bytes()).hexdigest(),'ACK':False,'native':False}))
