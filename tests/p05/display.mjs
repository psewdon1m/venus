import {spawn,execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {once} from 'node:events';
import {setTimeout,clearTimeout} from 'node:timers';
async function waitExit(child,timeout){
  if(child.exitCode!==null||child.signalCode!==null)return true;let timer;
  try{return await Promise.race([once(child,'exit').then(()=>true),new Promise(done=>{timer=setTimeout(()=>done(false),timeout);})]);}finally{clearTimeout(timer);}
}
export async function display(){
  const name=':99',process=spawn('Xvfb',[name,'-screen','0','1920x1200x24','-nolisten','tcp','-ac'],{stdio:'ignore'});
  for(let i=0;i<100&&!existsSync('/tmp/.X11-unix/X99');i++)await delay(30);
  if(!existsSync('/tmp/.X11-unix/X99')){process.kill('SIGTERM');throw new Error('Xvfb startup failed');}
  return {name,async close(){if(process.exitCode!==null||process.signalCode!==null)return;process.kill('SIGTERM');if(await waitExit(process,3000))return;process.kill('SIGKILL');await waitExit(process,3000);throw new Error('Xvfb graceful close timed out; forced process termination');}};
}
export function xdo(displayName,...args){return execFileSync('xdotool',args,{env:{...process.env,DISPLAY:displayName},encoding:'utf8',timeout:10000}).trim();}
