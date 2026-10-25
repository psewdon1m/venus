import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync} from 'node:crypto';
import {createRelease} from '../../tools/venus-operator/create-release.mjs';
import {keyIdentity,verifyRelease} from '../../tools/venus-operator/release.mjs';
import {distributionMetadata,parseDistribution,verifyDistribution} from '../../tools/venus-operator/distribution.mjs';
import {PRESENTATIONS_ENVIRONMENT} from '../../tools/venus-operator/presentations-profile.mjs';
test('new service-v4 signature binds all three source assets and denies tampering/missing material',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'venus-dist-unit-'));
 try{const pair=generateKeyPairSync('ed25519'),pem=pair.publicKey.export({type:'spki',format:'pem'}),trust={environment:'service',owner_approved:true,key_id:keyIdentity(pem).id,public_key_pem:pem},source=path.join(root,'sources');fs.mkdirSync(source);for(const name of ['sources.tar','SOURCE-INDEX.json','THIRD-PARTY-NOTICES.md'])fs.writeFileSync(path.join(source,name),'SYNTHETIC UNIT '+name);
 fs.writeFileSync(path.join(root,'trust.json'),JSON.stringify(trust));fs.writeFileSync(path.join(root,'key.pem'),pair.privateKey.export({type:'pkcs8',format:'pem'}));const input={version:'0.0.2',main_sha:'a'.repeat(40),source_identity:'b'.repeat(64),image_reference:'ghcr.io/psewdon1m/venus@sha256:'+'c'.repeat(64),oci_digest:'sha256:'+'c'.repeat(64),config_digest:'sha256:'+'d'.repeat(64),trust_file:path.join(root,'trust.json'),private_key_file:path.join(root,'key.pem'),environment:PRESENTATIONS_ENVIRONMENT,compose_template:'infra/venus/compose.presentations.standalone.yml',output:path.join(root,'release'),distribution_directory:source};
 createRelease(input);const policy={environment:PRESENTATIONS_ENVIRONMENT,schema:1,compose_template:input.compose_template,expected_main:input.main_sha},verified=verifyRelease(input.output,trust,policy);assert.deepEqual(verified.distribution_assets,distributionMetadata(source));assert.equal(verifyDistribution(input.output,verified.distribution_assets),true);
 fs.appendFileSync(path.join(input.output,'sources.tar'),'tamper');assert.throws(()=>verifyDistribution(input.output,verified.distribution_assets));
 assert.throws(()=>createRelease({...input,output:path.join(root,'missing'),distribution_directory:undefined}),/DISTRIBUTION_REQUIRED/);
 assert.throws(()=>parseDistribution(Buffer.from('plain'),true),/DISTRIBUTION_REQUIRED/);
 assert.throws(()=>parseDistribution(Buffer.from('\nVENUS_DISTRIBUTION_ASSETS_JSON\n{}')));
 }finally{assert.equal(path.dirname(root),os.tmpdir());assert(path.basename(root).startsWith('venus-dist-unit-'));fs.rmSync(root,{recursive:true,force:true});}
});
