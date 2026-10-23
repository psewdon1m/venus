from pathlib import Path
import importlib.util,json,os,tempfile
root=Path.cwd();base=root/'.artifacts/p05-topic-measurements-method05'
spec=importlib.util.spec_from_file_location('review_method05_guard',base/'host-output-guard.py');g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
owned=Path(tempfile.mkdtemp(prefix='fs-',dir=root/'.artifacts/p05-method05-review-round01')).resolve();assert owned.is_relative_to((root/'.artifacts/p05-method05-review-round01').resolve());results=[]
def fixture():
 p=owned/str(len(results));p.mkdir();(p/'archive').mkdir();state={'free':12*1024**3,'seq':0,'clock':0.,'advance':True,'owner':'a'*32}
 config={'method_revision':'METHOD05-HOST-OUTPUT-FENCES','global_owned_cap_bytes':g.CAP,'reserve_bytes':g.RESERVE,'kind':'ROOT_R100_V3_OPERATIONAL_DIAGNOSTIC_ACK','status':'AUTHORIZED','owner':'a'*32,'host_output_path':str(p),'control_directory':str(p/'control')}
 def sample():
  if state['advance']:state['seq']+=1
  return {'owner':state['owner'],'counter':state['seq'],'available_bytes':str(12*1024**3),'host_output_allowed':True,'capacity_fault':None}
 guard=g.HostOutputGuard(config,space_probe=lambda:state['free'],read_sample=sample,clock=lambda:state['clock'],wait=lambda seconds:state.update(clock=state['clock']+seconds))
 return p,state,guard
def deny(fn,contains):
 try:fn()
 except Exception as e:assert contains in str(e),(contains,str(e));return str(e)
 raise AssertionError('unexpected acceptance')
def check(name,fn):results.append({'name':name,'status':'PASS','detail':fn()})
def positive():
 p,state,guard=fixture();data=b'SYNTHETIC'*17000;target=p/'archive/positive.bin';guard.partition(p/'archive',20*1024**2).write(target,data);assert target.read_bytes()==data;return{'bytes':len(data),'real_Windows_allocation':g.allocation.windows_allocation(target),'initial_counter_advanced':state['seq']>1}
check('positive actual Windows chunked exact output',positive)
def fault(kind):
 p,state,guard=fixture();target=p/'archive/prefix.bin';partition=guard.partition(p/'archive',20*1024**2);original=os.write;writes=[]
 def writing(fd,b):
  count=original(fd,b);writes.append(count)
  if kind=='free':state['free']=0
  elif kind=='owner':state['owner']='foreign'
  elif kind=='counter':state['advance']=False;state['seq']=1
  elif kind=='stale':state['advance']=False;state['clock']+=2.001
  return count
 os.write=writing
 try:reason=deny(lambda:partition.write(target,b'X'*140000),'HOST_OUTPUT_STOP_NOT_ACCEPTED')
 finally:os.write=original
 assert writes==[65536] and target.stat().st_size==65536
 state.update(free=12*1024**3,owner='a'*32,advance=True);deny(lambda:guard.before(),'HOST_OUTPUT_STOP_NOT_ACCEPTED');assert target.stat().st_size==65536
 return{'prefix_bytes':65536,'further_allocations':0,'fault_latched':True,'reason':reason}
for kind in ('free','owner','counter','stale'):check('actual prefix stops after one chunk on '+kind,lambda kind=kind:fault(kind))
def zero():
 p,s,guard=fixture();s['free']=0;deny(lambda:guard.partition(p/'archive',20*1024**2),'ACTUAL_HOST_SPACE_LOW');assert not list((p/'archive').iterdir());return{'created_files':0}
check('actual free0 prevents first create despite cached high sample',zero)
def noadvance():
 p,s,guard=fixture();s['seq']=10;s['advance']=False;deny(lambda:guard.partition(p/'archive',20*1024**2),'SUPERVISOR_');assert not list((p/'archive').iterdir());return{'initial_counter_not_fresh':True}
check('fresh writer cannot rearm from frozen counter',noadvance)
def scope():
 p,s,guard=fixture();deny(lambda:guard.partition(p/'inputs',16*1024**2),'HOST_WRITE_PARTITION_SCOPE');return{'immutable_inputs_not_writable':True}
check('global partitions cannot add hidden input writer',scope)
output={'status':'PASS','controls':len(results),'results':results,'owned_root':str(owned),'remaining_owned_paths':[p.relative_to(owned).as_posix()for p in owned.rglob('*')],'max_written_bytes':sum(p.stat().st_size for p in owned.rglob('*')if p.is_file()),'space_counter_inputs_injected':True,'actual_Windows_filesystem':True,'Docker_calls':0,'prepare_calls':0,'selector_calls':0}
(root/'.artifacts/p05-method05-review-round01/filesystem.json').write_text(json.dumps(output,indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':'PASS','controls':len(results),'max_written_bytes':output['max_written_bytes']}))
