/** Bounded one-volume bootstrap/probe. Default is inert; launcher owns Docker labels. */
import assert from 'node:assert/strict';
import {constants,lstatSync,realpathSync,readdirSync,chmodSync,chownSync,openSync,writeSync,readSync,fsyncSync,fstatSync,closeSync,unlinkSync,statfsSync} from 'node:fs';
import {createHash,randomBytes} from 'node:crypto';
import {resolve,join} from 'node:path';
const root='/venus-output',cap=128n*1024n**2n,reserve=10n*1024n**3n;
function header(){assert.equal(process.platform,'linux');assert.equal(realpathSync(root),root);const s=lstatSync(root);assert(s.isDirectory()&&!s.isSymbolicLink());return s;}
function free(){const s=statfsSync(root,{bigint:true}),available=s.bavail*s.bsize;assert(available>=reserve+cap,'NATIVE_VOLUME_PREFLIGHT_SPACE_STOP');return available.toString();}
function args(){const owner=process.argv.find(a=>a.startsWith('--owner='))?.slice(8),volume=process.argv.find(a=>a.startsWith('--volume='))?.slice(9),image=process.argv.find(a=>a.startsWith('--image='))?.slice(8);assert(/^[a-f0-9]{32}$/.test(owner));assert(/^venus-r100-v3-[a-f0-9]{12}-output$/.test(volume));assert(/^sha256:[a-f0-9]{64}$/.test(image));return{owner,volume,image};}
if(!process.argv.includes('--bootstrap')&&!process.argv.includes('--probe'))console.log(JSON.stringify({status:'NOT_RUN',Linux_volume_only:true,root_write_or_probe_executed:false}));
else{
 const binding=args();assert.equal(resolve(root),root);header();assert.deepEqual(readdirSync(root),[],'NEW_NOCOPY_VOLUME_MUST_BE_EMPTY');
 if(process.argv.includes('--bootstrap')){
  assert(!process.argv.includes('--probe'));assert.equal(process.getuid(),0);chmodSync(root,0o700);chownSync(root,1000,1000);const s=header();assert.equal(s.uid,1000);assert.equal(s.gid,1000);assert.equal(s.mode&0o777,0o700);console.log(JSON.stringify({...binding,status:'EMPTY_VOLUME_CHOWN_PASS',uid:s.uid,gid:s.gid,mode:s.mode&0o777,native_available_bytes:free()}));
 }else{
  assert.equal(process.getuid(),1000);assert.equal(process.getgid(),1000);const s=header();assert.equal(s.uid,1000);assert.equal(s.gid,1000);assert.equal(s.mode&0o777,0o700);assert(constants.O_NOFOLLOW&&constants.O_DIRECTORY,'LINUX_NOFOLLOW_DIRECTORY_FLAGS_REQUIRED');
  const path=join(root,'probe-'+binding.owner),bytes=Buffer.concat([Buffer.from(binding.owner),randomBytes(4096)]),expected=createHash('sha256').update(bytes).digest('hex');let fd,dir;
  try{
   fd=openSync(path,constants.O_RDWR|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);const before=fstatSync(fd);assert(before.isFile()&&before.nlink===1);let offset=0;while(offset<bytes.length){const n=writeSync(fd,bytes,offset,bytes.length-offset,offset);assert(n>0);offset+=n;}fsyncSync(fd);const observed=Buffer.alloc(bytes.length);offset=0;while(offset<observed.length){const n=readSync(fd,observed,offset,observed.length-offset,offset);assert(n>0);offset+=n;}
   assert.equal(createHash('sha256').update(observed).digest('hex'),expected);const after=fstatSync(fd),located=lstatSync(path);assert.equal(after.size,bytes.length);assert.equal(after.dev,located.dev);assert.equal(after.ino,located.ino);assert(!located.isSymbolicLink());closeSync(fd);fd=undefined;unlinkSync(path);dir=openSync(root,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);fsyncSync(dir);closeSync(dir);dir=undefined;assert.deepEqual(readdirSync(root),[]);
   console.log(JSON.stringify({...binding,status:'WRITE_FSYNC_READ_DELETE_EMPTY_PASS',uid:process.getuid(),gid:process.getgid(),probe_bytes:bytes.length,probe_sha256:expected,native_available_bytes:free(),volume_nocopy_and_labels_verified_by:'external launcher required; not inspectable in this helper',statistics_RUN:false}));
  }finally{if(fd!==undefined)closeSync(fd);if(dir!==undefined)closeSync(dir);}
 }
}
