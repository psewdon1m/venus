/** Initialize only explicitly registered fresh tmpfs/authority mounts. */
import assert from 'node:assert/strict';
import {verifyOwnIPC} from './ipc-policy.mjs';
import {mkdirSync,readdirSync,readFileSync,lstatSync,chmodSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ResourceLease} from './resource-lease.mjs';
export async function initialize(config){verifyOwnIPC('bootstrap');assert.equal(process.platform,'linux');assert.equal(process.getuid(),1000);assert.equal(process.getgid(),1000);const lease=new ResourceLease({...config,privateRoot:'/private'});await lease.initial();for(const root of ['/private','/authority']){assert(lstatSync(root).isDirectory()&&!lstatSync(root).isSymbolicLink());assert.deepEqual(readdirSync(root),[]);}
 const privateStat=lstatSync('/private');assert.equal(privateStat.uid,1000);assert.equal(privateStat.gid,999);assert.equal(privateStat.mode&0o7777,0o2710);
 for(const n of ['birthDirectory','personalChainDirectory','personalWitnessDirectory','lifecycleChainDirectory','lifecycleWitnessDirectory']){lease.assert(4096);mkdirSync('/authority/'+n,{mode:0o700});}
 lease.write('/private','db-password',randomBytes(32).toString('hex'),{privateFile:true});assert.equal(lstatSync('/private/db-password').gid,999);chmodSync('/private/db-password',0o640);lease.write('/private','keyring.json',JSON.stringify({current:'test',keys:{test:randomBytes(32).toString('base64')}}),{privateFile:true});
 for(const phase of ['A1','B2','A3']){const c={owner:config.owner,resource_profile:'QRB_BOUND_ONLY_2_BROWSER_PIDS256',whole_deadline_epoch_ms:config.whole_deadline_epoch_ms,phase,privateRoot:'/private',directory:'/authority',keyringFile:'/private/keyring.json',stateFile:'/private/state.json',guardFile:'/control/bound-profile.json',origin:'https://localhost:8443',caFile:config.caFile,now:{A1:1000000,B2:1001000,A3:1002000}[phase]};lease.write('/private','config-'+phase+'.json',JSON.stringify(c),{privateFile:true});}
 console.log(JSON.stringify({status:'FRESH_REGISTERED_ROOTS_INITIALIZED',secrets_exported:false}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const p=process.argv.find(x=>x.startsWith('--initialize='));if(p)await initialize(JSON.parse(readFileSync(p.slice(13))));else console.log(JSON.stringify({status:'NOT_RUN',private_mutations:0}));}
