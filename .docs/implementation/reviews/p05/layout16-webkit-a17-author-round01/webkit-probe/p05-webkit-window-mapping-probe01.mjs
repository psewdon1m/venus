import {webkit} from 'playwright';
import {display,xdo} from '/app/tests/p05/display.mjs';
import {windowInventory} from '/app/tests/p05/window-inventory.mjs';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
const report={scope:'OWNED_WEBKIT_CHILD_PID_WINDOW_DIAGNOSIS_NOT_LAYOUT',status:'FAIL',bound_ms:20000,process_tree:[],samples:[],windows:[],cleanup:'NOT_RUN'};
let xserver,server,browser;const deadline=performance.now()+20000;
function remaining(){return Math.max(1,deadline-performance.now());}
function processInfo(pid){
 const text=readFileSync('/proc/'+pid+'/stat','utf8');if(text.length>8192)throw Error('OWN_PROCESS_METADATA_CAP');const end=text.lastIndexOf(')'),fields=text.slice(end+2).split(' '),ppid=Number(fields[1]),start_ticks=fields[19];
 if(!Number.isSafeInteger(pid)||!Number.isSafeInteger(ppid)||!/^\d{1,20}$/.test(start_ticks))throw Error('OWN_PROCESS_METADATA_INVALID');
 const name=text.slice(text.indexOf('(')+1,end),known=['pw_run.sh','sh','bash','MiniBrowser','WebKitNetworkPr','WebKitWebProces','WebKitGPUProces','WPEWebProcess','WebKitNetworkProcess','WebKitWebProcess'];
 return {pid,ppid,start_ticks,role:known.includes(name)?name:'OTHER_OWNED_PROCESS'};
}
function descendants(rootPID,rootStart){
 const first=processInfo(rootPID);if(first.start_ticks!==rootStart)throw Error('OWN_BROWSER_PID_CHANGED');const nodes=[{...first,depth:0}];
 for(let i=0;i<nodes.length;i++){
  const p=nodes[i];if(p.depth>=4)continue;let children;try{children=readFileSync('/proc/'+p.pid+'/task/'+p.pid+'/children','utf8').trim();}catch{continue;}
  if(!children)continue;for(const value of children.split(/\s+/)){if(!/^\d+$/.test(value))throw Error('OWN_PROCESS_CHILD_INVALID');let child;try{child=processInfo(Number(value));}catch{continue;}if(child.ppid!==p.pid)continue;if(nodes.length>=32)throw Error('OWN_PROCESS_TREE_CAP');nodes.push({...child,depth:p.depth+1});}
 }
 return nodes;
}
function escaped(value){return [...value].map(c=>c.codePointAt(0)>126?'\\u{'+c.codePointAt(0).toString(16)+'}':c).join('');}
function titleMetadata(value,nonce){
 if(typeof value!=='string'||/[\p{Cc}\p{Cf}]/u.test(value))return {kind:'UNSAFE_NOT_RECORDED'};
 const at=value.indexOf(nonce);if(at>=0&&value.indexOf(nonce,at+1)<0){const before=value.slice(0,at),after=value.slice(at+nonce.length);if([...before+after].length<=80)return {kind:'OWN_NONCE_TEMPLATE',normalized_template:escaped(before)+'VENUS_NONCE'+escaped(after)};}
 if(/(?:[a-z]+:\/\/|data:|about:)/i.test(value))return {kind:'URL_LIKE_TITLE_NOT_RECORDED'};
 return [...value].length<=80?{kind:'OWN_FIXED_VENDOR_TITLE_NO_NONCE',vendor_title_escaped:escaped(value)}:{kind:'OVERSIZE_NOT_RECORDED'};
}
try{
 xserver=await display();server=await webkit.launchServer({host:'127.0.0.1',headless:false,timeout:Math.min(15000,remaining()),env:{...process.env,DISPLAY:xserver.name}});
 const rootPID=server.process().pid,rootInfo=processInfo(rootPID);report.launch_process=rootInfo;
 browser=await webkit.connect(server.wsEndpoint(),{timeout:Math.min(15000,remaining())});const page=await browser.newPage();await page.goto('data:text/html,<html><head><title>Venus calibration</title></head><body></body></html>',{timeout:remaining()});
 const nonce='Venus layout '+randomUUID();await page.evaluate(title=>{document.title=title;},nonce);report.page_title_is_own_nonce=(await page.title())===nonce;
 while(performance.now()<deadline){
  const nodes=descendants(rootPID,rootInfo.start_ticks);report.process_tree=nodes;
  const byPID=[];for(const node of nodes){if(performance.now()>=deadline)break;const ids=await windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--pid',String(node.pid)));for(const id of ids)byPID.push({id,process:node});}
  const prefix=await windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name','^'+nonce));
  const ids=[...new Set(byPID.map(x=>x.id))];report.last_sample={elapsed_ms:Math.round(20000-remaining()),own_descendant_count:nodes.length,own_PID_visible_count:ids.length,own_nonce_prefix_count:prefix.length};if(report.samples.length<8)report.samples.push(report.last_sample);
  if(ids.length){
   for(const id of ids.slice(0,8)){
    const pid=Number(xdo(xserver.name,'getwindowpid',id)),owner=nodes.find(n=>n.pid===pid);if(!owner)throw Error('OWN_WINDOW_PID_MISMATCH');const fresh=processInfo(pid);if(fresh.start_ticks!==owner.start_ticks)throw Error('OWN_WINDOW_PID_REUSED');
    report.windows.push({window_id:id,window_pid:pid,owner_role:owner.role,owner_depth:owner.depth,root_PID_match:pid===rootPID,verified_owned_descendant:true,...titleMetadata(xdo(xserver.name,'getwindowname',id),nonce),own_nonce_prefix_match:prefix.includes(id)});
   }
   report.status=ids.length===1?'MEASURED_OWN_SINGLE_WINDOW_NOT_LAYOUT_PASS':'AMBIGUOUS_OWN_WINDOWS_NOT_ADAPTER_PASS';break;
  }
  await delay(Math.min(75,Math.max(0,deadline-performance.now())));
 }
 if(report.status==='FAIL')report.status='UNRESOLVED_NO_OWN_PID_WINDOW';
}catch(error){report.failure_kind=error?.name==='TimeoutError'?'TimeoutError':'Error';}
finally{
 const failures=[];for(const [name,operation]of [['browser',()=>browser?.close()],['server',()=>server?.close()],['display',()=>xserver?.close()]])try{await operation();}catch{failures.push(name);}
 report.cleanup=failures.length?'FAIL':'PASS';report.cleanup_failed=failures;if(failures.length)report.status='FAIL';
}
console.log(JSON.stringify(report,null,2));process.exitCode=report.status==='MEASURED_OWN_SINGLE_WINDOW_NOT_LAYOUT_PASS'&&report.cleanup==='PASS'?0:1;
