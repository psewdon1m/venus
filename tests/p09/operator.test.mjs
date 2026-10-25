import test from 'node:test';
import assert from 'node:assert/strict';
import {DockerDriver} from '../../tools/venus-operator/driver.mjs';
import path from 'node:path';
import {fixture} from '../p06/helpers.mjs';
import {createRelease} from '../../tools/venus-operator/create-release.mjs';
import {verifyRelease} from '../../tools/venus-operator/release.mjs';
test('backup and restore cannot run while a media container survives API stop',async()=>{
 const driver=Object.create(DockerDriver.prototype);driver.c={release_environment:'standalone-local-media-v3'};driver.inspect=async service=>({State:{Running:service==='media'}});await assert.rejects(driver.requireQuiesced(),/QUIESCE_REQUIRED/);
 const calls=[];driver.container=async service=>service;driver.docker=async args=>{calls.push(args);};driver.inspect=async()=>({State:{Running:false}});await driver.stop();assert.deepEqual(calls.map(v=>v.at(-1)),['media','app']);
});
test('signed media-v3 profile is explicit and cannot be imported as original v2',{skip:process.platform!=='linux'},()=>{
 const c=fixture();try{const compose=path.resolve('infra/venus/compose.media.standalone.yml'),output=path.join(c.base,'media-v3'),digest='c'.repeat(64);createRelease({trust_file:c.trustFile,private_key_file:c.privateFile,version:'0.0.9003',main_sha:'1'.repeat(40),source_identity:'2'.repeat(64),image_reference:'ghcr.io/psewdon1m/venus@sha256:'+digest,oci_digest:'sha256:'+digest,config_digest:'sha256:'+digest,compose_template:compose,environment:'standalone-local-media-v3',output});assert.equal(verifyRelease(output,c.trust,{environment:'standalone-local-media-v3',schema:1,compose_template:compose}).manifest.environment,'standalone-local-media-v3');assert.throws(()=>verifyRelease(output,c.trust,{environment:'standalone-local-pilot-v2',schema:1,compose_template:c.compose}),/ENV_SCHEMA/);assert.throws(()=>new DockerDriver({project:'venus-test',local_root:c.root,host_root:c.root,compose_template:c.compose,release_environment:'standalone-local-media-v3'}),/MEDIA_TEMPLATE_REQUIRED/);}
 finally{c.cleanup();}
});
