/** Exact AST bodies in inert environments; no Docker commands or supervisor fork. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateFinalGuardReceipt} from './contract.mjs';
import {planFor} from './host-runner.mjs';
const folder=dirname(fileURLToPath(import.meta.url)),require=createRequire(resolve('package.json')),ts=require('typescript'),source=readFileSync(join(folder,'oci-resource-supervisor.mjs'),'utf8'),ast=ts.createSourceFile('supervisor.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),fn=name=>ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name).getText(ast),b=JSON.parse(readFileSync(join(folder,'BINDING.json'))),plan=planFor(b,'a'.repeat(32),'b'.repeat(12),resolve('.artifacts/p05/venus-p05-oci-'+'b'.repeat(12))),checks=[];
async function check(name,work){await work();checks.push({name,status:'PASS'});}
const row=(role,id)=>({Id:id.repeat(64),Name:'/'+plan.project+'-'+role.toLowerCase(),Image:plan.images.A,Config:{Entrypoint:['node'],Cmd:['-e','setInterval(()=>{},1000);'],Labels:{'com.venus.oci.owner':plan.owner,'com.venus.oci.role':role}},State:{Running:true},HostConfig:{NetworkMode:'none',ReadonlyRootfs:true},Mounts:[{RW:false},{RW:false},{RW:false}]});
async function simulate(rows,ids=rows.map(r=>r.Id)){
 const calls=[];let inspections=0;const bounded=async(command,args)=>{calls.push(args);assert.equal(command,'docker');if(args[0]==='ps')return{stdout:ids.join('\n')};assert.equal(args[0],'kill');return{stdout:''};};const docker=async args=>{assert.equal(args[0],'inspect');inspections++;return rows.map(r=>({...r,State:{Running:inspections===1||r.Config.Labels['com.venus.oci.role']==='keeper'}}));};
 const work=new Function('assert','plan','bounded','docker',fn('stopPrimary')+';return stopPrimary;')(assert,plan,bounded,docker);return{work,calls};
}
await check('exact supervisor stops owned API while retaining readonly memory keeper on FAIL',async()=>{const t=await simulate([row('A1','1'),row('keeper','2')]);await t.work();assert.deepEqual(t.calls.at(-1),['kill','1'.repeat(64)]);});
await check('empty exact owner inventory causes no kill',async()=>{const t=await simulate([]);await t.work();assert.equal(t.calls.length,1);});
for(const[name,mutate]of [['wrong owner',r=>r[0].Config.Labels['com.venus.oci.owner']='other'],['wrong image',r=>r[0].Image=plan.images.B],['wrong role',r=>r[0].Config.Labels['com.venus.oci.role']='foreign'],['wrong name',r=>r[0].Name='/unrelated'],['reordered inspect IDs',r=>r[0].Id='3'.repeat(64)]])await check('reject '+name+' before any kill',async()=>{const r=[row('A1','1')],ids=r.map(v=>v.Id);mutate(r);const t=await simulate(r,ids);await assert.rejects(t.work());assert(!t.calls.some(a=>a[0]==='kill'));});
for(const[name,ids]of [['short ID',['1'.repeat(12)]],['duplicate IDs',['1'.repeat(64),'1'.repeat(64)]]])await check('reject '+name+' before any kill',async()=>{const t=await simulate([row('A1','1')],ids);await assert.rejects(t.work());assert(!t.calls.some(a=>a[0]==='kill'));});
const receipt={owner:plan.owner,status:'PASS_OWNED_RESOURCE_GUARD_FINAL',external_native_probe_cleanup:'completed',failure:null,elapsed_ms:123};
await check('final root receipt accepts only complete independent helper cleanup',()=>validateFinalGuardReceipt(receipt,{owner:plan.owner}));
for(const[name,delta]of [['wrong owner',{owner:'b'.repeat(32)}],['pending cleanup',{external_native_probe_cleanup:'PENDING'}],['active snapshot',{status:'PASS_OWNED_RESOURCE_GUARD'}],['failure latched',{failure:'SPACE'}],['receipt could not persist',{receipt_persisted:false}],['900s exceeded',{elapsed_ms:900001}]])await check('reject final '+name,()=>assert.throws(()=>validateFinalGuardReceipt({...receipt,...delta},{owner:plan.owner})));
const result={status:'AUTHOR_EXACT_SUPERVISOR_BODY_CONTROLS_PASS_NOT_RUNTIME',checks,Docker_commands:0,supervisor_forks:0,actual_OCI_switches:0};writeFileSync(join(folder,'oci-supervisor-author-controls-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:checks.length}));
