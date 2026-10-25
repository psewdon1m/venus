import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import https from 'node:https';
import http from 'node:http';
import {once} from 'node:events';
import {clearTimeout} from 'node:timers';
import pg from 'pg';
import {Keyring} from '../../apps/api/dist/security.js';
export async function runtime({server='tests/p05/server.mjs'}={}){
  if(process.env.VENUS_P05_ISOLATED_FIXTURE!=='1')throw new Error('Owned Docker fixture required');
  const directory=mkdtempSync(join(tmpdir(),'venus-p05-runtime-'));
  const env={...process.env,KEYRING_FILE:join(directory,'keys.json'),DELETION_LEDGER_FILE:join(directory,'deletions.jsonl'),P05_CLOCK_FILE:join(directory,'clock')};
  writeFileSync(env.KEYRING_FILE,JSON.stringify({current:'v1',keys:{v1:randomBytes(32).toString('base64')}}));
  writeFileSync(env.DELETION_LEDGER_FILE,'');let clock=0;writeFileSync(env.P05_CLOCK_FILE,String(clock));
  const keys=Keyring.fromFile(env.KEYRING_FILE),pool=new pg.Pool({host:env.DB_HOST,user:'venus',database:'venus',password:readFileSync(env.DB_PASSWORD_FILE,'utf8').trim()});
  let port=0,child,failed=false,logs='',logsTruncated=false;const sockets=new Set();
  function capture(bytes){logs+=bytes.toString();if(logs.length>1024*1024){logsTruncated=true;logs=logs.slice(-1024*1024);}}
  const edge=https.createServer({cert:readFileSync('tests/fixtures/p02-test-cert.pem'),key:readFileSync('tests/fixtures/p02-test-key.pem')},(request,reply)=>{
    if(!port||failed){reply.writeHead(502);reply.end();return;}
    const upstream=http.request({host:'127.0.0.1',port,path:request.url,method:request.method,headers:request.headers,agent:false},response=>{reply.writeHead(response.statusCode,response.headers);response.pipe(reply);});
    upstream.on('error',()=>{if(!reply.headersSent)reply.writeHead(502);reply.end();});request.pipe(upstream);
  });
  edge.on('upgrade',(request,socket,head)=>{
    sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});
    if(!port||failed){socket.destroy();return;}
    const upstream=http.request({host:'127.0.0.1',port,path:request.url,method:'GET',headers:request.headers,agent:false});
    upstream.on('upgrade',(response,remote,remoteHead)=>{
      socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(response.headers).map(([key,value])=>key+': '+value+'\r\n').join('')+'\r\n');
      if(head.length)remote.write(head);if(remoteHead.length)socket.write(remoteHead);remote.pipe(socket);socket.pipe(remote);
      socket.on('error',()=>remote.destroy());remote.on('error',()=>socket.destroy());socket.on('close',()=>remote.destroy());remote.on('close',()=>socket.destroy());
    });upstream.on('error',()=>socket.destroy());upstream.on('response',response=>{response.resume();socket.destroy();});upstream.end();
  });
  edge.listen(0,'127.0.0.1');await once(edge,'listening');env.APP_ORIGIN=`https://127.0.0.1:${edge.address().port}`;
  async function boot(){
    child=spawn(process.execPath,[server],{env,stdio:['ignore','pipe','pipe','ipc']});
    let errors='';child.stderr.on('data',bytes=>{errors=(errors+bytes.toString()).slice(-2000);capture(bytes);});child.stdout.on('data',capture);
    port=await new Promise((done,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Fixture server startup timed out')),30000);let output='',startupDone=false;
      child.stdout.on('data',bytes=>{if(startupDone)return;output+=bytes.toString();for(const line of output.split('\n')){try{const row=JSON.parse(line);if(row.test_server_port){startupDone=true;clearTimeout(timer);done(row.test_server_port);}}catch{/* Partial line. */}}});
      child.once('exit',code=>{clearTimeout(timer);reject(new Error('Fixture server exited '+code+': '+errors));});
    });
  }
  async function stop(){
    for(const socket of sockets)socket.destroy();port=0;if(!child||child.exitCode!==null||child.signalCode!==null)return;
    const exit=once(child,'exit');if(child.connected)child.send({type:'shutdown'});else child.kill('SIGTERM');let timer;
    try{await Promise.race([exit,new Promise((_,reject)=>{timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Fixture graceful stop timed out'));},15000);})]);}finally{clearTimeout(timer);}
  }
  function cleanupDirectory(){if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.startsWith(join(tmpdir(),'venus-p05-runtime-')))throw new Error('Unsafe owned cleanup');rmSync(directory,{recursive:true,force:true});}
  async function close(){const errors=[];try{await stop();}catch(error){errors.push(error);}try{await pool.end();}catch(error){errors.push(error);}try{edge.closeAllConnections();await new Promise((done,reject)=>edge.close(error=>error?reject(error):done()));}catch(error){errors.push(error);}try{cleanupDirectory();}catch(error){errors.push(error);}if(errors.length)throw new AggregateError(errors,'Fixture cleanup failed');}
  try{await boot();}catch(error){try{await close();}catch(cleanupError){throw new AggregateError([error,cleanupError],'Fixture startup and cleanup failed',{cause:cleanupError});}throw error;}
  return {origin:env.APP_ORIGIN,logs:()=>({text:logs,truncated:logsTruncated}),fixtureConfig:{keyringFile:env.KEYRING_FILE,deletionLedgerFile:env.DELETION_LEDGER_FILE,now:()=>Date.now()+clock},async snapshot(gameId){const row=(await pool.query('SELECT * FROM game_sessions WHERE id=$1',[gameId])).rows[0];return keys.decrypt(row.snapshot_cipher,`game-snapshot:${row.room_id}:${row.id}:1`);},async plan(gameId){const row=(await pool.query('SELECT r.* FROM game_rounds r JOIN game_sessions g ON g.id=r.session_id AND r.round_index=g.current_round WHERE g.id=$1',[gameId])).rows[0];if(!row)throw new Error('Fixture round missing');return keys.decrypt(row.cipher,`game-round:${row.room_id}:${row.session_id}:${row.id}:1`).plan;},tick(ms){clock+=ms;writeFileSync(env.P05_CLOCK_FILE,String(clock));},disconnect(){for(const socket of sockets)socket.destroy();},fault(value){failed=value;if(value)for(const socket of sockets)socket.destroy();},async restart(){await stop();await boot();},async crash(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const exit=once(child,'exit');child.kill('SIGKILL');await exit;port=0;for(const socket of sockets)socket.destroy();},close};
}
