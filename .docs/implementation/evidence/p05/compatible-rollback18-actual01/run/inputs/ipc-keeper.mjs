/** Inert bounded readonly mount keeper; no application/server or writable mount. */
import {verifyOwnIPC} from './ipc-policy.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {setInterval} from 'node:timers';
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--keep')){const receipt=verifyOwnIPC('keeper');console.log(JSON.stringify({status:'KEEPER_IPC_NONE',...receipt}));setInterval(()=>{},1000);}
 else console.log(JSON.stringify({status:'NOT_RUN',Docker_calls:0,intervals:0}));
}
