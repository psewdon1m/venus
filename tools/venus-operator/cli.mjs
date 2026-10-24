import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {json,requireValue} from './files.mjs';
import {DockerDriver} from './driver.mjs';
import {UpdateEngine} from './engine.mjs';
import {workerServer,operatorServer} from './http.mjs';
async function main(){
 const [mode,configFile,arg]=process.argv.slice(2);requireValue(['worker','operator','import','install','recover','status'].includes(mode)&&configFile,'CLI_ARGUMENTS');const config=json(configFile);
 if(mode==='operator'){requireValue(process.getuid?.()===1002,'OPERATOR_UID_REQUIRED');requireValue((config.bind_host??'127.0.0.1')==='127.0.0.1'||config.bind_host==='0.0.0.0'&&config.container_loopback_published===true,'OPERATOR_LOOPBACK_REQUIRED');operatorServer(config).listen(config.port??4310,config.bind_host??'127.0.0.1');return;}
 requireValue(process.getuid?.()===1001,'EXECUTOR_UID_REQUIRED');const engine=new UpdateEngine(config,new DockerDriver(config));
 if(mode==='worker'){
  engine.driver.expireBackups();const retention=setInterval(()=>{try{engine.driver.expireBackups();}catch{process.stderr.write('{"code":"BACKUP_RETENTION_UNAVAILABLE"}\n');}},3600000);retention.unref();
  if(fs.existsSync(config.socket)){requireValue(fs.lstatSync(config.socket).isSocket(),'EXECUTOR_SOCKET_UNSAFE');await new Promise((resolve,reject)=>{const c=net.createConnection(config.socket);c.on('connect',()=>{c.destroy();reject(new Error('EXECUTOR_ALREADY_RUNNING'));});c.on('error',error=>{if(error.code==='ECONNREFUSED'){fs.unlinkSync(config.socket);resolve();}else reject(error);});});}
  const server=workerServer(engine);server.listen(config.socket,()=>fs.chmodSync(config.socket,0o660));return;
 }
 const result=mode==='import'?engine.import(path.resolve(arg)):mode==='install'?await engine.install(arg):mode==='recover'?await engine.recover(arg):engine.status(arg);process.stdout.write(JSON.stringify(result)+'\n');
}
void main().catch(error=>{process.stderr.write(JSON.stringify({code:/^[A-Z][A-Z0-9_]{1,80}$/.test(error.message)?error.message:'OPERATION_REJECTED'})+'\n');process.exitCode=1;});
