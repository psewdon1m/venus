from pathlib import Path
import hashlib,json,subprocess
R=Path('C:/.projects/venus');O=Path(__file__).parent;A=R/'.docs/implementation/reviews/p05/a19-layout02-webkit-window-lookup-author-round01';S=R/'.artifacts/p05-pilot-bundle-source16';P=S/'.artifacts/p05-v2-layout-producer-a19-02';Q=S/'.artifacts/p05-v2-layout-producer-a19-01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));dump=lambda n,x:(O/n).write_text(json.dumps(x,indent=2)+'\n',encoding='utf8');pins={}
def pin(p,h=None):
 v=sha(p)
 if h:assert v==h,(str(p),v,h)
 pins[p.relative_to(R).as_posix()]={'bytes':p.stat().st_size,'sha256':v};return v
pin(A/'INDEX.json','37bb5fe637260f0e5fdf5edc4a7d734bf6a92b53229f18a0722f67f196be01c1')
for n,v in load(A/'INDEX.json')['files'].items():assert sha(A/n)==v['sha256']and(A/n).stat().st_size==v['bytes']
for n,v in load(A/'INPUT-PINS.json').items():pin(R/n,v['sha256'])
pin(P/'INDEX.json','a93cda0b7d9ce52156512e274e398dbbb66eaf69a10fde3490896b37c7908415');pin(P/'ROOT_RUN_ACK.json','aa1337546f7b94435d5bdcadcdad2f2626a69254c8d5d6142f542729059c18fe')
for n,v in load(P/'INDEX.json')['files'].items():assert sha(P/n)==v['sha256']and(P/n).stat().st_size==v['bytes']
mjs=[p.name for p in P.glob('*.mjs')];assert len(mjs)==27;changed=[n for n in mjs if(P/n).read_bytes()!=(Q/n).read_bytes()];assert sorted(changed)==['run.mjs','x11.mjs']
assert(P/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-a19-02',b'p05-v2-layout-producer-a19-01')==(Q/'run.mjs').read_bytes()
old="const windows=await readyOwnedWindow(()=>windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name',pattern)),budget);"
new="const windows=await readyOwnedWindow(engine==='webkit'?async()=>{const ids=await windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name','.'));return ids.filter(id=>{budget.check();return xdo(xserver.name,'getwindowname',id).includes(title);});}:()=>windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name',pattern)),budget);"
x=(P/'x11.mjs').read_text();y=(Q/'x11.mjs').read_text();assert x.count(new)==1 and x.replace(new,old)==y
assert(P/'binding.json').read_bytes()==(Q/'binding.json').read_bytes();binding=load(P/'binding.json');assert binding['source_identity']=='d1804e3e560e9879a19914ea1eccdc77cc69c1f9547808100d3849f4296c81b2'and binding['included_files']==1873 and binding['image']=='sha256:ecdcc558940c70ed6ed83345f8e331f51fd2eb440c6b3f59937dd2dd0d0fe252';ack=load(P/'ROOT_RUN_ACK.json');assert ack['root_run_ack']is False and ack['issued_at']is None and ack['producer_runtime_digest']is None
parent=R/'.docs/implementation/reviews/p05/a19-layout-actual-independent-round01/INDEX.json';pin(parent,'66f0f1c31ec8e282b74a8667d8ee13082440c2d12f7a5627bf558753d9ba595c');actual=load(parent);assert actual['accepted_components'][0]['cells']==51 and actual['accepted_components'][0]['typography']==36 and actual['matrix_counts']=={'PASS':51,'FAIL':1,'NOT_RUN':407,'total':459}
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';results=[]
for name,cmd,cwd,expected in [('focused-controls',[node,str(A/'controls.mjs')],R,0),('runtime',[node,str(A/'runtime.mjs')],R,0),('falseACK',[node,str(P/'run.mjs')],S,1)]:
 p=subprocess.run(cmd,cwd=cwd,capture_output=True,timeout=30);(O/(name+'.stdout.txt')).write_bytes(p.stdout);(O/(name+'.stderr.txt')).write_bytes(p.stderr);assert p.returncode==expected,(name,p.stderr.decode());results.append({'name':name,'exit':p.returncode,'expected':expected})
 if name=='focused-controls':assert json.loads(p.stdout)['groups']==4
 if name=='runtime':assert json.loads(p.stdout)['producer_runtime_digest']=='276ab8558bc349c086602c77541e83e5ada844305fdb0eec1ca5fb9d24104395'
 if name=='falseACK':assert b'ROOT_RUN_ACK_REQUIRED'in p.stderr
dump('PINS.json',pins);dump('AUDIT.json',{'status':'PASS_METHOD_ONLY_METADATA_AND_FOUR_EXISTING_HELPER_GROUPS','author_children':25,'producer_children':len(load(P/'INDEX.json')['files']),'changed_MJS':sorted(changed),'other25_raw_exact01':True,'x11_complete_single_query_inverse_exact':True,'run_complete_dirname_inverse_exact':True,'binding_source_image_exact01':True,'WebKit_only_readback_fullnonce_candidate':True,'Chromium_Firefox_complete_command_traces_exact':True,'same_original_full_UTF8_title_unique_and_focus_oracles':True,'unknown_prefix_suffix_duplicate_partial_wrong_focus_refusal':True,'same_original_error_identity_and_37ms_absolute_readiness_25plus12':True,'same_budget_check_before_each_readback_no_timer_or_export':True,'all51x9_324type_15x9actions_27cap_sharedmodules_exact':True,'Chrome51_36type_qualified_carry_allowed_only_nonWebKit_unchanged_path':True,'oldChrome_runtime_must_remain_5d820':True,'generic_aggregate_unchanged_not_claimed_PASS':True,'future_independent_composite459_requires_remaining8actuals_original_matrix_text_assertions':True,'checks':results,'new_native_Docker_model_APP_source_producer_ACK_Git_actions':0});print(json.dumps({'status':'PASS_METHOD_ONLY','checks':results,'changed_MJS':changed,'raw_exact':25}))
