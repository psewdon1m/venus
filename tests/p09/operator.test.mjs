import test from 'node:test';
import assert from 'node:assert/strict';
import {DockerDriver} from '../../tools/venus-operator/driver.mjs';
test('backup and restore cannot run while a media container survives API stop',async()=>{
 const driver=Object.create(DockerDriver.prototype);driver.inspect=async service=>({State:{Running:service==='media'}});await assert.rejects(driver.requireQuiesced(),/QUIESCE_REQUIRED/);
 const calls=[];driver.container=async service=>service;driver.docker=async args=>{calls.push(args);};driver.inspect=async()=>({State:{Running:false}});await driver.stop();assert.deepEqual(calls.map(v=>v.at(-1)),['media','app']);
});
