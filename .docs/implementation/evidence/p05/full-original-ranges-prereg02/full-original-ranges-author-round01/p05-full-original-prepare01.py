from pathlib import Path
import json,hashlib,datetime,uuid,copy
root=Path('C:/.projects/venus');out=root/'.artifacts/p05-full-original-ranges01'
out.mkdir(exist_ok=False)
read=lambda p:json.loads(Path(p).read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
dump=lambda p,o:Path(p).write_text(json.dumps(o,indent=2)+'\n',encoding='utf8')
cost=read(root/'.artifacts/p05-fixedrange-cost-acks01/MANIFEST.json')
base=read(cost['rows'][0]['ack_path'])
for key in ['owner','range','issued_at']:base.pop(key,None)
base.update(status='PENDING_ROOT_ACTIVATION_NOT_RUN_ACK',no_actual_approval=True,scope='FULL_ORIGINAL_FIXED_DISJOINT_RANGE_DOMAIN_ONLY_NO_RETRY_NOT_STATISTICAL_ACCEPTANCE')
counts=read(root/'.artifacts/p05-pilot-corpus-ranges02/RANGE-PREREG.json')['counts']
chunks=dict(zip(counts,[5000,100,100,100,500,10000,100]))
inputs={
 'C:/.projects/venus/.artifacts/p05-fixedrange-host03.mjs':'744966465fe74b704e170db8674cd0a85832ca6eefbe58638b706fb6d6b33af1',
 'C:/.projects/venus/.docs/implementation/reviews/p05/pilot-corpus-ranges-independent-round02/INDEX.json':'41ab613a870ec80186f6990a969be914172b3d9f82010032dcce8823472e3143',
 'C:/.projects/venus/.docs/implementation/reviews/p05/fixedrange-host03-independent-round01/INDEX.json':'12b49de8895c5c715ab8578d647242be510300bafc6e1faa39df09e97baedb11',
 'C:/.projects/venus/.docs/implementation/reviews/p05/cost-clean-prereg-independent-round01/INDEX.json':'26ee04e8bf326d7afafa4424dfcd148af2454cf2c96c02747c4b49158e3c95be',
 'C:/.projects/venus/.docs/implementation/reviews/p05/privacy-matched-independent-round01/INDEX.json':'f1b675aab1cf71d7a781cbe7c479f0289b2e3f4292ca4ad25156db8894fccbcd'
}
for p,h in inputs.items():assert sha(p)==h,p
prefixes=[]
for row in cost['rows']:
 r=copy.deepcopy(row);report=root/'.artifacts/p05-fixedranges'/r['owner']/'host-report.json';r.update(report_path=report.as_posix(),report_sha256=sha(report));rr=read(report)
 assert rr['cleanup']=='COMPLETE' and rr['status']=='RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE' and rr['range']==r['range']
 prefixes.append(r)
jobs=[]
for section,total in counts.items():
 for start in range(1000 if section=='m3-gf' else 100,total,chunks[section]):
  n=len(jobs);job={'ordinal':n,'lane':n%8,'owner':uuid.uuid4().hex,'range':{'section':section,'start':start,'count':min(chunks[section],total-start),'end':min(start+chunks[section],total)}}
  ack={**base,'status':'ROOT_RUN_ACK','no_actual_approval':False,'owner':job['owner'],'range':job['range']}
  # JS JSON.stringify is identical here for ASCII-only2-space formatted fixed scalar objects.
  job['ack_sha256']=hashlib.sha256((json.dumps(ack,indent=2)+'\n').encode()).hexdigest();jobs.append(job)
assert len(jobs)==2609
plan={'schema':1,'status':'PREASSIGNED_ORIGINAL_RANGES_PENDING_ROOT_ACTIVATION','prepared_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_scope':'IMMUTABLE_A9_PURE_DOMAIN_COMPONENT_ONLY_NOT_CURRENT_APPLICATION_AUTH_WIRE_OR_STAGE','counts':counts,'chunks':chunks,'lanes':8,'worker_profile':{'cpu':1,'memory_bytes':1610612736,'pids':64,'worker_ms':1200000,'host_attach_ms':1205000,'native_free_reserve_bytes':34359738368,'payload_bytes':209715200,'export_bytes':268435456},'git_prereg':{'head':'f40b9a73c01a59bb40be453925f6922404956c3a','tag':'p05-corpus-a9-prereg-20261020','worktree':'C:/Users/pc/.codex/worktrees/p05-corpus-prereg/venus','clean_core_review_sha256':inputs['C:/.projects/venus/.docs/implementation/reviews/p05/cost-clean-prereg-independent-round01/INDEX.json']},'cwd':root.as_posix(),'host_runner':'C:/.projects/venus/.artifacts/p05-fixedrange-host03.mjs','oneoff_runner':'C:/.projects/venus/.artifacts/p05-full-original-lanes01.mjs','oneoff_sha256':sha(root/'.artifacts/p05-full-original-lanes01.mjs'),'consumer_review':'C:/.projects/venus/.docs/implementation/reviews/p05/pilot-corpus-ranges-independent-round02/INDEX.json','output_parent':'C:/.projects/venus/.artifacts/p05-fixedranges','run_root':'C:/.projects/venus/.artifacts/p05-full-original-execution01','inputs':inputs,'ack_base':base,'prefixes':prefixes,'jobs':jobs,'lane_jobs':[[j['ordinal'] for j in jobs if j['lane']==l] for l in range(8)],'execution_policy':{'root_activation_required':True,'first_observed_failure':'atomicSTOP+memorylatch; no new jobs, alreadyinflight host finally cleanup completes','retries':0,'adaptive_chunking':False,'adaptive_scheduling':False,'per_job_ack_hash':'projected exact bytes, materialized only after independent review/root activation','raw_retention':'ignored .artifacts only; exact raw chains/export pins retained, no GB Git copies','all_execution_is_not_statistical_acceptance':True}}
dump(out/'MANIFEST.json',plan)
dump(out/'ROOT-ACTIVATION.template.json',{'status':'PENDING_ROOT_BATCH_RUN_ACK','no_actual_approval':True,'manifest_sha256':sha(out/'MANIFEST.json'),'oneoff_sha256':plan['oneoff_sha256'],'maximum_workers':8,'operational_review_path':'ROOT_MUST_FILL_AFTER_INDEPENDENT_REVIEW','operational_review_sha256':'ROOT_MUST_FILL_AFTER_INDEPENDENT_REVIEW'})
print(json.dumps({'manifest_sha256':sha(out/'MANIFEST.json'),'jobs':len(jobs),'remaining_cases':sum(j['range']['count'] for j in jobs),'prefix_cases':1600,'total_cases':sum(counts.values()),'oneoff_sha256':plan['oneoff_sha256'],'no_RUN':True}))
