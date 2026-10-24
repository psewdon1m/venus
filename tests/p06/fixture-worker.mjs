/** Test producer only: durable-phase process death, no production fault flag. */
import fs from 'node:fs';
import {json} from '../../tools/venus-operator/files.mjs';
import {DockerDriver} from '../../tools/venus-operator/driver.mjs';
import {UpdateEngine} from '../../tools/venus-operator/engine.mjs';
import {workerServer} from '../../tools/venus-operator/http.mjs';
const config=json('/data/executor.json');
const engine=new UpdateEngine(config,new DockerDriver(config),{phase:phase=>{if(process.env.FIXTURE_BACKUP_READ_ONLY==='true'&&phase==='QUIESCED')fs.chmodSync('/data/backups',0o500);if(process.env.FIXTURE_KILL_PHASE===phase)process.kill(process.pid,'SIGKILL');}});
if(fs.existsSync(config.socket))fs.unlinkSync(config.socket);
workerServer(engine).listen(config.socket,()=>fs.chmodSync(config.socket,0o660));
