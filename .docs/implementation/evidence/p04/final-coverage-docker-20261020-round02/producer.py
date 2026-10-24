from pathlib import Path
import json,subprocess,hashlib,datetime,shutil
r=Path.cwd();out=r/'.artifacts/p04-final-coverage02';assert not out.exists();out.mkdir();cards=r/'.docs/implementation/evidence/p04/review470-r4/candidate/cards';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();before={p.name:sha(p) for p in sorted(cards.glob('*.json'))};assert len(before)==470
image='sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5';name='venus-p04-final-coverage-20261020-02'
script="""import{readFileSync,readdirSync,writeFileSync}from'node:fs';import{analyze,coverageReport}from'/app/packages/card-catalog/dist/index.js';import{FrozenPack}from'/app/packages/relationship-engine/dist/index.js';const cards=readdirSync('/candidate').filter(n=>n.endsWith('.json')).sort().map(n=>JSON.parse(readFileSync('/candidate/'+n)));const analysis=analyze(cards);if(analysis.catalog_digest!=='dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270')throw Error('CATALOG_DIGEST_MISMATCH');const pack=FrozenPack.load(cards,analysis.manifest,true);for(const[name,value]of[['analysis',analysis],['coverage',coverageReport(pack)],['coverage-private-chat',coverageReport(pack,['private_text_chat'])]])writeFileSync('/artifacts/'+name+'.json',JSON.stringify(value,null,2)+'\\n',{flag:'wx'});console.log(JSON.stringify({status:'DRAFT_COVERAGE_COMPUTED_NOT_RELEASE_APPROVAL',cards:cards.length,digest:analysis.catalog_digest}));"""
(out/'command.mjs').write_text(script,encoding='utf-8',newline='\n')
args=['docker','run','--rm','--name',name,'--label','venus.p04.final=20261020-02','--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','1536m','--cpus','1','--pids-limit','64','--log-driver','none','--mount',f'type=bind,src={cards},dst=/candidate,readonly','--mount',f'type=bind,src={out},dst=/artifacts','--entrypoint','node',image,'--input-type=module','-e',script]
assert subprocess.run(['docker','ps','-aq','--filter','name=^/'+name+'$'],capture_output=True,check=True).stdout.strip()==b''
q=subprocess.run(args,capture_output=True,timeout=600);(out/'stdout.txt').write_bytes(q.stdout);(out/'stderr.txt').write_bytes(q.stderr)
after={p.name:sha(p) for p in sorted(cards.glob('*.json'))};assert after==before
receipt={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'image':image,'source_scope':'CURRENT_FROZEN_B244_1819_COMPILED_CARD_CATALOG_AND_ENGINE','catalog_digest':'dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270','exit_code':q.returncode,'input_unchanged':True,'input_raw_sha256':before,'human_approval':False,'runtime_activation':False,'full_stage_pass':False}
assert not subprocess.run(['docker','ps','-aq','--filter','label=venus.p04.final=20261020-02'],capture_output=True,check=True).stdout.strip();receipt['container_cleanup']='completed'
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
assert q.returncode==0,('DRAFT_CHECK_EXECUTION_FAILED',q.returncode)
summary={}
for n in ['coverage','coverage-private-chat']:
 row=json.loads((out/(n+'.json')).read_text());summary[n]={'neutral20':row['neutral20'],'private_coverage':row['private_coverage'],'cells':len(row['cells']),'sessions':len(row['sessions']),'private_sessions':len(row['private_sessions'])}
print(json.dumps({'exit_code':q.returncode,'input_unchanged':True,'summary':summary}))
