/** Pure policy negatives and no-side-effect cold checks; not actual supervisor evidence. */
import assert from 'node:assert/strict';
import {planFor} from './host-runner.mjs';
import {validatePlan,validateVolumes,checkSample,policy} from './oci-resource-policy.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
const folder=dirname(fileURLToPath(import.meta.url)),b=JSON.parse(readFileSync(join(folder,'BINDING.json'))),owner='a'.repeat(32),project='venus-p05-oci-'+'b'.repeat(12),p=planFor(b,owner,'b'.repeat(12),resolve('.artifacts/p05',project)),rows=[],clone=x=>JSON.parse(JSON.stringify(x));
function pass(name,fn){fn();rows.push({name,status:'PASS'});}
pass('explicit512/900 plan accepts with320 native/160host/32burst accounting',()=>{validatePlan(p);assert.equal(policy.nativeReserved+policy.hostLimit+policy.burstSafety,policy.total);});
for(const[name,mutate]of [['128MiB silent reuse',v=>v.total_cap_bytes=128*1024**2],['300s silent reuse',v=>v.deadline_ms=300000],['wrong owner',v=>v.owner='bad'],['escaping output',v=>v.output_root=resolve('..')],['PG quota enlarged',v=>v.partitions_mib.PG=257],['private split enlarged',v=>v.private_tmpfs_split_mib.browser=17],['root rollback enabled',v=>v.protected_roots_rollback=true],['global cleanup',v=>v.no_global_cleanup=false]])pass('reject '+name,()=>{const v=clone(p);mutate(v);assert.throws(()=>validatePlan(v));});
const volumes=Object.entries(p.volumes).map(([k,Name])=>({Name,Driver:'local',Labels:{'com.venus.oci.owner':owner,'com.venus.oci.project':project},Options:{type:'tmpfs',device:'tmpfs',o:{db:'size=256m,mode=0700',authority:'size=32m,mode=0700',private:'size=8m,mode=0700,uid=0,gid=0'}[k]}}));
pass('all three exact hard tmpfs quotas accept',()=>validateVolumes(volumes,p));
for(const[name,mutate]of [['unbounded PG',v=>v[0].Options={}],['wrong volume owner',v=>v[1].Labels['com.venus.oci.owner']='c'.repeat(32)],['extra owned resource',v=>v.push({...v[0],Name:'other'})],['duplicate volume',v=>v[1]=v[0]],['wrong driver',v=>v[0].Driver='remote']])pass('reject '+name,()=>{const v=clone(volumes);mutate(v);assert.throws(()=>validateVolumes(v,p));});
const sample={stop_requested:false,host_allocated_bytes:1024,actual_host_free_bytes:String(12*1024**3),actual_native_free_bytes:String(12*1024**3)};
pass('realmetric-shaped reserved ledger accepts',()=>checkSample(sample,100));
for(const[name,mutate]of [['host low',v=>v.actual_host_free_bytes='0'],['native unknown',v=>v.actual_native_free_bytes='unknown'],['host allocation exhausted',v=>v.host_allocated_bytes=policy.hostLimit],['negative allocation',v=>v.host_allocated_bytes=-1],['stop latched',v=>v.stop_requested=true]])pass('reject '+name,()=>{const v=clone(sample);mutate(v);assert.throws(()=>checkSample(v));});
const report={status:'AUTHOR_RESOURCE_POLICY_CONTROLS_PASS_NOT_RUNTIME',checks:rows,Docker_commands:0,actual_supervisor_launches:0,independent_review:false};writeFileSync(join(folder,'oci-resource-author-controls-result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:rows.length}));
