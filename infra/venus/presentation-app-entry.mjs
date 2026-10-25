/** Profile4 bootstrap waits for the static guardian; no Docker API or auto-provision. */
import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
const health='/run/venus-presentations/spool/health.json',deadline=Date.now()+15000;
let ready=false;
while(Date.now()<deadline){
 try{const s=fs.lstatSync(health);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.uid!==0||(s.mode&0o777)!==0o444||s.size>4096)throw Error('UNSAFE');const fd=fs.openSync(health,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let h;try{h=JSON.parse(fs.readFileSync(fd));}finally{fs.closeSync(fd);}if(h.schema_version===1&&['idle','busy'].includes(h.state)&&Date.now()-s.mtimeMs<5000&&s.mtimeMs<=Date.now()+1000){ready=true;break;}}catch{/* bounded wait, no private diagnostics */}
 await delay(100);
}
if(!ready){process.stderr.write('{"code":"PRESENTATION_GUARDIAN_UNAVAILABLE"}\n');process.exitCode=1;}else await import('../../apps/api/dist/server.js');
