import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {MusicCatalog,musicRange} from '../../apps/api/dist/music-catalog.js';
import {createMusicDemo} from '../../tools/music-demo.mjs';
test('Music Range supports suffix/open/overshoot and caps requested transfers',()=>{
 assert.deepEqual(musicRange(undefined,25),{start:0,end:24,partial:false});
 assert.deepEqual(musicRange('bytes=3-',25),{start:3,end:24,partial:true});
 assert.deepEqual(musicRange('bytes=-4',25),{start:21,end:24,partial:true});
 assert.deepEqual(musicRange('bytes=0-900',25),{start:0,end:24,partial:true});
 assert.equal(musicRange('bytes=0-',2000000).end,1048575);
 for(const h of ['bytes=-0','bytes=25-','bytes=7-2','bytes=0-1,3-5','bytes=99999999999999999-','bytes=-','bytes=a-b'])assert.throws(()=>musicRange(h,25));
});
test('Music catalog uses actual own audio bytes, revocation, expiry, digest and filesystem identity',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'venus-p08-unit-')),dir=path.join(root,'music');
 try{createMusicDemo(dir,{seconds:2});const file=path.join(dir,'catalog.json'),catalog=new MusicCatalog(file,true),v=JSON.parse(fs.readFileSync(file));
  assert.equal(catalog.snapshot(Date.now()).tracks.length,2);assert.throws(()=>new MusicCatalog(file,false).snapshot(Date.now()),/Request could not be completed/);
  const asset=catalog.asset('tone-a',Date.now()),fd=fs.openSync(asset.file,'r');
  try{catalog.unchanged(asset,fd,Date.now());v.tracks[0].active=false;fs.chmodSync(file,0o600);fs.writeFileSync(file,JSON.stringify(v));assert.throws(()=>catalog.unchanged(asset,fd,Date.now()));assert.equal(catalog.snapshot(Date.now()).tracks.length,1);}finally{fs.closeSync(fd);}
  v.tracks[1].rights.valid_until='2000-01-01T00:00:00Z';fs.writeFileSync(file,JSON.stringify(v));assert.equal(catalog.available(Date.now()),false);
  v.tracks[0].active=true;v.tracks[0].file='../escape.wav';fs.writeFileSync(file,JSON.stringify(v));assert.throws(()=>catalog.snapshot(Date.now()));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('Music catalog rejects altered media and symlinks rather than trusting declared SHA',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'venus-p08-unit-')),dir=path.join(root,'music');
 try{createMusicDemo(dir,{seconds:1});const file=path.join(dir,'catalog.json'),v=JSON.parse(fs.readFileSync(file)),asset=path.join(dir,v.tracks[0].file);fs.chmodSync(asset,0o600);fs.appendFileSync(asset,'changed');assert.throws(()=>new MusicCatalog(file,true).snapshot(Date.now()));fs.unlinkSync(asset);fs.symlinkSync(path.join(dir,v.tracks[1].file),asset);assert.throws(()=>new MusicCatalog(file,true).snapshot(Date.now()));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
