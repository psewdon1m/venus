from pathlib import Path
import json,shutil
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume20';c=p.with_name('p05-v2-layout-producer-resume21');assert not c.exists();shutil.copytree(p,c)
b=(p/'run.mjs').read_bytes();assert b.count(b'pids_limit:256')==1
b=b.replace(b'p05-v2-layout-producer-resume20',b'p05-v2-layout-producer-resume21').replace(b'pids_limit:256',b'pids_limit:512')
ackGate=b"assert.equal(ack.operational_resource_profile,'LAYOUT21_BROWSER_PID512','EXACT_OPERATIONAL_RESOURCE_PROFILE_REQUIRED');assert.equal(ack.browser_pids_limit,512,'EXACT_BROWSER_PID_LIMIT_REQUIRED');"
reviewGate=b"assert.equal(independentReview.operational_resource_profile,'LAYOUT21_BROWSER_PID512','REVIEW_OPERATIONAL_RESOURCE_PROFILE_REQUIRED');assert.equal(independentReview.browser_pids_limit,512,'REVIEW_BROWSER_PID_LIMIT_REQUIRED');"
b=b.replace(b'assertBinding(binding,ack);',b'assertBinding(binding,ack);'+ackGate)
needle=b"assert.equal(independentReview.source_identity,binding.source_identity,'REVIEW_SOURCE_BINDING_MISMATCH');";assert b.count(needle)==1;b=b.replace(needle,needle+reviewGate)
needle=b'producer_runtime_digest:runtimeDigest(initialProducer),scope:';assert b.count(needle)==1;b=b.replace(needle,b'producer_runtime_digest:runtimeDigest(initialProducer),operational_resource_profile:ack.operational_resource_profile,browser_pids_limit:compose.services.browser.pids_limit,scope:')
(c/'run.mjs').write_bytes(b)
binding=json.loads((c/'binding.json').read_text());ack={'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':binding['source_identity'],'image':binding['image'],'scope':'A17_LAYOUT21_PID512_PROFILE_PENDING_NONAUTHOR_REVIEW','operational_resource_profile':'LAYOUT21_BROWSER_PID512','browser_pids_limit':512}
(c/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n')
profile={'status':'PROSPECTIVE_PREREG_NOT_AUTHORIZED_NOT_RUN','id':'LAYOUT21_BROWSER_PID512','parent':'LAYOUT20_BROWSER_PID256','browser_pids_limit':512,'parent_browser_pids_limit':256,'unchanged':{'browser_mem_limit':'3g','browser_cpus':2,'browser_shm_size':'1gb','browser_tmpfs':['/tmp:size=1g,mode=1777,exec','/home/node:size=64m,uid=1000,gid=1000'],'all459_oracles':True,'all_timeouts_rate_retry_rules':True,'APP_source_image':True},'authority':'New exact rootACK plus independent INDEX must both state profileID and512; runtimeDigest binds same runbody; runner.json records configured profile/composePID, not a measured cgroup observation','native_runs':0,'root_run_ack':False,'reversion':'Use immutable producer20/256 with separately valid matching authority; no oldFAIL promotion or data mutation'}
(c/'RESOURCE_PROFILE21.json').write_text(json.dumps(profile,indent=2)+'\n')
print(json.dumps({'status':'PREPARED_NO_RUN_AWAIT_DIAGNOSIS_PIN','producer':str(c),'operational_resource_profile':profile['id'],'browser_pids_limit':512}))
