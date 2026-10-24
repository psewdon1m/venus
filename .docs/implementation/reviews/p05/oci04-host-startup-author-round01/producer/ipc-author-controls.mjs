/** Exact source constructor/inspection tests, declared inert inputs only; zero Docker. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire,} from 'node:module';
import vm from 'node:vm';
import {ipcArguments,validateIPC,verifyIPCObservation,noneRoles,pgWritable,keeperCommand} from './ipc-policy.mjs';
import {planFor} from './host-runner.mjs';
import {policy,validatePlan} from './oci-resource-policy.mjs';
const folder=dirname(fileURLToPath(import.meta.url)),require=createRequire(resolve('package.json')),ts=require('typescript'),binding=JSON.parse(readFileSync(join(folder,'BINDING.json'))),host=readFileSync(join(folder,'host-runner.mjs'),'utf8'),supervisor=readFileSync(join(folder,'oci-resource-supervisor.mjs'),'utf8'),owner='a'.repeat(32),plan=planFor(binding,owner,'b'.repeat(12),resolve('.artifacts/p05/venus-p05-oci-'+'b'.repeat(12))),rows=[];
const parse=(text,name='source.mjs')=>ts.createSourceFile(name,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),find=(root,predicate)=>{let result;function visit(n){if(!result&&predicate(n))result=n;if(!result)ts.forEachChild(n,visit);}visit(root);assert(result,'EXACT_AST_NODE_REQUIRED');return result;},clone=x=>JSON.parse(JSON.stringify(x));
async function check(name,fn){await fn();rows.push({name,status:'PASS'});}
const hostAst=parse(host),fn=name=>find(hostAst,n=>ts.isFunctionDeclaration(n)&&n.name?.text===name).getText(hostAst),superAst=parse(supervisor);
await check('PG256 now includes248data+8SHM and global512/native320 unchanged',()=>{assert.deepEqual(pgWritable,{data_mib:248,shm_mib:8});assert.equal(pgWritable.data_mib+pgWritable.shm_mib,plan.partitions_mib.PG);assert.equal(policy.nativeReserved,320*1024**2);assert.equal(policy.total,512*1024**2);validatePlan(plan);});
for(const role of ['db',...noneRoles]){
 await check('explicit IPC argv '+role,()=>assert.deepEqual(ipcArguments(role),role==='db'?['--ipc','private','--shm-size','8m']:['--ipc','none']));
 const good={HostConfig:{IpcMode:role==='db'?'private':'none',ShmSize:role==='db'?8*1024**2:64*1024**2,Tmpfs:{}},Mounts:[]};
 await check('inspection exact mode '+role,()=>validateIPC(role,good));
 for(const bad of ['', 'host','shareable','container:foreign'])await check('inspection rejects default/foreign '+role+'/'+bad,()=>{const r=clone(good);r.HostConfig.IpcMode=bad;assert.throws(()=>validateIPC(role,r));});
 await check('inspection rejects hidden explicit SHM tmpfs '+role,()=>{const r=clone(good);r.HostConfig.Tmpfs['/dev/shm']='size=1g';assert.throws(()=>validateIPC(role,r));});
 await check('inspection rejects SHM bind overlay '+role,()=>{const r=clone(good);r.Mounts=[{Destination:'/dev/shm',RW:true}];assert.throws(()=>validateIPC(role,r));});
}
for(const n of [undefined,0,64*1024**2,9*1024**2])await check('PG inspection rejects missing/zero/default/enlarged SHM '+n,()=>assert.throws(()=>validateIPC('db',{HostConfig:{IpcMode:'private',ShmSize:n},Mounts:[]})));
const rootMount='10 1 0:1 / / rw - overlay overlay rw',shmMount='11 10 0:2 / /dev/shm rw - tmpfs shm rw,size=8192k';
await check('actual-observation parser permits no SHM for IPCnone',()=>verifyIPCObservation('A1',rootMount));
await check('actual-observation parser rejects mounted SHM on second line for IPCnone',()=>assert.throws(()=>verifyIPCObservation('A1',rootMount+'\n'+shmMount)));
await check('PG actual-observation parser requires8MiB capacity',()=>verifyIPCObservation('db',rootMount+'\n'+shmMount,{blocks:'2048',block_size:'4096'}));
for(const cap of [null,{blocks:'16384',block_size:'4096'},{blocks:'unknown',block_size:'4096'}])await check('PG actual-observation parser rejects unavailable/enlarged capacity',()=>assert.throws(()=>verifyIPCObservation('db',rootMount+'\n'+shmMount,cap)));
const captured=[],names=new Map(),volume=(key,destination,{readonly=false}={})=>['--mount','type=volume,src='+plan.volumes[key]+',dst='+destination+',volume-nocopy'+(readonly?',readonly':'')],label=['--label','com.venus.oci.owner='+owner,'--label','com.venus.oci.project='+plan.project],output=resolve('.artifacts/p05/INERT');
const construct=new Function('assert','plan','names','label','join','output','command','inspect','ipcArguments',fn('create')+';return create;')(assert,plan,names,label,join,output,async args=>captured.push(args),async role=>({role}),ipcArguments);
for(const role of ['keeper','tls','browser','initialize','bootstrap','erase','A1','B2','A3'])await check('exact generic constructor disables IPC '+role,async()=>{await construct(role,[...volume('private','/private',{readonly:true}),...volume('authority','/authority',{readonly:true}),...volume('db','/retained-db',{readonly:true}),'--entrypoint','node',binding.images.A,...keeperCommand]);const args=captured.at(-1);assert.deepEqual(args.slice(0,3),['create','--ipc','none']);if(role==='keeper'){const mounts=args.flatMap((v,i)=>v==='--mount'?[args[i+1]]:[]);assert.equal(mounts.length,6);assert(mounts.every(v=>v.endsWith('readonly')));}});
const databaseArray=find(hostAst,n=>ts.isArrayLiteralExpression(n)&&n.elements.some(e=>ts.isSpreadElement(e)&&e.expression.getText(hostAst)==="ipcArguments('db')"));
await check('exact independent PG constructor sets private SHM8',()=>{const args=new Function('ipcArguments','dbName','label','plan','volume','PG','return '+databaseArray.getText(hostAst))(ipcArguments,plan.project+'-db',label,plan,volume,plan.roles.db);assert.deepEqual(args.slice(0,5),['create','--ipc','private','--shm-size','8m']);});
const nativeArray=find(superAst,n=>ts.isArrayLiteralExpression(n)&&n.elements.some(e=>ts.isSpreadElement(e)&&e.expression.getText(superAst)==="ipcArguments('native-free')"));
await check('exact independent resource-probe constructor disables IPC',()=>{const args=new Function('ipcArguments','name','plan','script','return '+nativeArray.getText(superAst))(ipcArguments,'INERT',plan,'INERT');assert.deepEqual(args.slice(0,3),['create','--ipc','none']);});
const py=JSON.parse(readFileSync(join(folder,'ipc-probe-python-ast.json')));
await check('exact Python image-probe constructor disables IPC',()=>assert.deepEqual(py.constructor_arguments.slice(0,3),['create','--ipc','none']));
const nativeScriptNode=find(superAst,n=>ts.isVariableDeclaration(n)&&n.name.getText(superAst)==='script'),nativeScript=new Function('return '+nativeScriptNode.initializer.getText(superAst))();
function inlinePrefix(code){const a=parse(code,'inline.js'),guard=find(a,n=>ts.isExpressionStatement(n)&&n.getText(a).includes('/proc/self/mountinfo'));return code.slice(0,guard.end);}
for(const[name,code]of [['native-free',nativeScript],['image-byte-probe',py.code]])for(const present of [false,true])await check('exact inline runtime mount fence '+name+'/SHM='+present,()=>{const prefix=inlinePrefix(code),context={require:n=>n==='fs'?{readFileSync:()=>rootMount+(present?'\n'+shmMount:'')}:require(n)};if(present)assert.throws(()=>vm.runInNewContext(prefix,context));else vm.runInNewContext(prefix,context);});
for(const[file,role]of [['api-child.mjs','config.phase'],['browser-child.mjs',"'browser'"],['gateway.mjs',"'tls'"],['bootstrap.mjs',"'bootstrap'"],['volume-admin.mjs',"kind==='initialize'?'initialize':'erase'"],['ipc-keeper.mjs',"'keeper'"]])await check('runtime entrypoint invokes actual mount check '+file,()=>assert(readFileSync(join(folder,file),'utf8').includes('verifyOwnIPC('+role+')')));
const result={status:'AUTHOR_IPC_CONSTRUCTOR_INSPECTION_AND_RUNTIME_MODEL_CONTROLS_PASS_NOT_ACTUAL_QUOTA',checks:rows,Docker_commands:0,actual_mount_inspections:0,actual_PG_boot:0,actual_OCI_switches:0,global_cap_bytes:policy.total,deadline_ms:900000};writeFileSync(join(folder,'ipc-author-controls-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:rows.length}));
