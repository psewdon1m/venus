import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeError} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer21/bound-profile.mjs';
const source=readFileSync('C:/.projects/venus/.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer21/browser-child.mjs','utf8');
const body=source.slice(source.indexOf('/** OCI21 public diagnostic only:'),source.indexOf('/** Browser-native transport hold only;')).replaceAll('export function ','function ');
function fixture(mode){
 let stage='initial',file=null,opened=false,timer=null,unrefs=0,writes=0,closes=0;
 const read=path=>path.endsWith('events')?path.endsWith('pids.events')?'max 0\n':'oom 0\noom_kill 0\n':'1\n';
 const statfs=path=>({blocks:8192n,bsize:4096n,bavail:path==='/evidence'&&stage==='fail'&&mode==='reserve'?1n:4096n});
 const lease={assert(n){assert.equal(n,4096);if(stage==='fail'&&mode==='lease')throw Error('private lease detail');},write(root,name,data){assert.equal(root,'/evidence');assert.equal(name,'browser-diagnostic.json');assert.equal(data.length,4096);assert.equal(file,null);file=Buffer.from(data);}};
 const api=new Function('assert','readFileSync','statfsSync','openSync','constants','fstatSync','writeSync','closeSync','setInterval','clearInterval','safeError',body+'\nreturn createBrowserDiagnostic;')(
  assert,read,statfs,(path,flags)=>{assert.equal(path,'/evidence/browser-diagnostic.json');assert.equal(flags,3);opened=true;return 9;},{O_WRONLY:1,O_NOFOLLOW:2},()=>({isFile:()=>true}),
  (fd,data,start,length,position)=>{assert.equal(fd,9);assert.equal(start,0);assert.equal(position,0);assert.equal(length,4096);writes++;file=Buffer.from(data);return mode==='short'?4095:4096;},
  fd=>{assert.equal(fd,9);closes++;opened=false;if(mode==='close')throw Error('private close detail');},
  (cb,ms)=>{assert.equal(ms,1000);timer={cb,unref(){unrefs++;}};return timer;},t=>{assert.equal(t,timer);timer=null;},safeError);
 return {d:api(lease,[]),fail(){stage='fail';},tick(){assert(timer);timer.cb();},get state(){return{file,opened,timer,unrefs,writes,closes};}};
}
const checks=[];
for(const mode of ['short','reserve','lease']){
 const f=fixture(mode);await assert.rejects(f.d.awaiting('B2','B2_HOST_CONTEXT_CLOSE',async()=>{assert(f.state.file);f.fail();f.tick();assert.equal(f.state.timer,null);}),/BROWSER_DIAGNOSTIC_WRITE_FAILED/);
 assert.equal(f.d.close(),false);assert.equal(f.state.opened,false);assert.equal(f.state.closes,1);assert.equal(f.state.unrefs,1);checks.push({name:mode+'_failure_latches_FAIL_and_clears_timer_fd',status:'PASS'});
}
{
 const f=fixture('close');await f.d.awaiting('B2','B2_OBSERVER_PAGE_OPEN',async()=>{});assert.equal(f.d.close(),false);assert.equal(f.state.timer,null);assert.equal(f.state.closes,1);assert.equal(f.d.close(),false);assert.equal(f.state.closes,1);checks.push({name:'close_failure_latches_FAIL_and_no_repeat_close',status:'PASS'});
}
console.log(JSON.stringify({status:'PASS_COLD_IO_NEGATIVES_ONLY',checks,count:checks.length,DB_connections:0,Docker_allocations:0,browser_launches:0}));
