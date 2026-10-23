/** External observer of the unchanged production app's network namespace.
 * TCP sampling is supporting evidence, never an absolute no-listen proof. */
import net from 'node:net';
import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {join} from 'node:path';
const directory=process.env.RUNTIME_ARTIFACT_DIRECTORY;
if(!directory)throw Error('RUNTIME_ARTIFACT_DIRECTORY required');
let phase=null,state=null,stopping=false;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function save(){if(state){const file=join(directory,'monitor-'+phase+'.json');writeFileSync(file+'.tmp',JSON.stringify(state,null,2)+'\n');renameSync(file+'.tmp',file);}}
process.once('SIGTERM',()=>{stopping=true;});process.once('SIGINT',()=>{stopping=true;});
async function listening(){return new Promise(resolve=>{let done=false;const socket=net.createConnection({host:'127.0.0.1',port:4300});function end(value){if(done)return;done=true;socket.destroy();resolve(value);}socket.once('connect',()=>end(true));socket.once('error',()=>end(false));socket.setTimeout(100,()=>end(false));});}
while(!stopping){
 const command=join(directory,'monitor-phase.json');
 if(existsSync(command)){
  const next=JSON.parse(readFileSync(command,'utf8'));
  if(typeof next.phase!=='string'||!/^[a-z0-9-]+$/.test(next.phase))throw Error('Invalid monitor phase');
  if(next.phase!==phase){save();phase=next.phase;state={schema_version:1,phase,started_at:new Date().toISOString(),attempts:0,connections:0,first_connection_at:null,last_observation_at:null,minimum_poll_pause_ms:5,connection_timeout_ms:100,absolute_no_listen_proof:false};}
  const open=await listening();state.attempts++;state.last_observation_at=new Date().toISOString();if(open){state.connections++;state.first_connection_at??=state.last_observation_at;}save();
 }
 await pause(5);
}
save();
