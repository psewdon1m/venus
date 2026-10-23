from pathlib import Path
import json,collections
w=Path(__file__).resolve().parent;d=json.loads((w/'cpu-profile.json').read_text());p=d['profile'];nodes={n['id']:n for n in p['nodes']};parent={c:n['id']for n in p['nodes']for c in n.get('children',[])};self_us=collections.Counter();total_us=collections.Counter();counts=collections.Counter();frames={}
def key(n):
 f=n['callFrame'];k=(f['functionName'],f['url'],f['lineNumber']+1,f['columnNumber']+1);frames[k]={'function':k[0],'url':k[1],'line':k[2],'column':k[3]};return k
assert len(p['samples'])==len(p['timeDeltas']);assert all(t>=0 for t in p['timeDeltas'])
for nid,delta in zip(p['samples'],p['timeDeltas']):
 k=key(nodes[nid]);self_us[k]+=delta;counts[k]+=1;seen=set()
 while nid in nodes:
  k=key(nodes[nid]);seen.add(k)
  if nid not in parent:break
  nid=parent[nid]
 for k in seen:total_us[k]+=delta
sum_us=sum(p['timeDeltas'])
def rows(counter,n=25):return [{**frames[k],'milliseconds':round(v/1000,3),'sampled_wall_percent':round(v/sum_us*100,3),'self_milliseconds':round(self_us[k]/1000,3),'self_samples':counts[k]}for k,v in counter.most_common(n)]
a={'scope':'MEASURED7S_CPU_SAMPLES_ONLY_NOT_WHOLE_ATTEMPT_LATENCY_CAUSE','requested_ms':d['requested_profile_ms'],'profile_elapsed_ms':round((p['endTime']-p['startTime'])/1000,3),'sampled_ms':round(sum_us/1000,3),'samples':len(p['samples']),'nodes':len(nodes),'top_self':rows(self_us),'top_inclusive':rows(total_us),'capture_exit_code':0,'capture_stderr_bytes':(w/'capture-stderr.txt').stat().st_size,'notes':['Inclusive sums include ancestors and are not additive across functions. Recursive same function counted once per sample.','Idle/native/external frames kept. Sampling percentages are sampled wall distribution, not container CPU utilization.','Signal starts unexposed container-loopback inspector; no heap, arguments, Runtime evaluation, keys, cookies or bodies captured.','This attempt is instrumented and cannot prove uninstrumented performance relative to previous attempts.']}
(w/'AGGREGATES.json').write_text(json.dumps(a,indent=2)+'\n',encoding='utf8')
