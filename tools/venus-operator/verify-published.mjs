import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha256,requireValue} from './files.mjs';
import {verifyRelease} from './release.mjs';
import {fetchRelease} from './fetch-release.mjs';
const [candidateFile,downloaded,mode]=process.argv.slice(2),candidate=json(candidateFile);
if(mode==='--anonymous'){const trust=json(candidate.trust_file);await fetchRelease('venus-v'+candidate.version,downloaded+'.anonymous',trust,candidate.compose_template);for(const n of ['manifest.json','manifest.sig.json','bundle.tar.gz'])requireValue(sha256(read(path.join(downloaded+'.anonymous',n)))===sha256(read(path.join(candidate.output,n))),'ANONYMOUS_PUBLISHED_ASSET_MISMATCH');}
for(const n of ['manifest.json','manifest.sig.json','bundle.tar.gz'])requireValue(sha256(read(path.join(downloaded,n)))===sha256(read(path.join(candidate.output,n))),'PUBLISHED_ASSET_MISMATCH');
const release=verifyRelease(downloaded,json(candidate.trust_file),{environment:'standalone-local-pilot-v2',schema:1,compose_template:candidate.compose_template,expected_main:candidate.main_sha});
const refs=execFileSync('git',['ls-remote','https://github.com/psewdon1m/venus.git','refs/heads/main','refs/tags/'+release.manifest.tag,'refs/tags/'+release.manifest.tag+'^{}'],{encoding:'utf8',timeout:30000,maxBuffer:65536}).trim().split('\n').map(row=>row.split(/\s+/));
const main=refs.find(r=>r[1]==='refs/heads/main')?.[0],tag=refs.find(r=>r[1]==='refs/tags/'+release.manifest.tag+'^{}')?.[0]??refs.find(r=>r[1]==='refs/tags/'+release.manifest.tag)?.[0];requireValue(main===candidate.main_sha&&tag===main,'PUBLISHED_MAIN_TAG_MISMATCH');
process.stdout.write(JSON.stringify({status:'PUBLISHED_SIGNED_BYTES_AND_MAIN_TAG_VERIFIED',release_id:release.release_id,tag:release.manifest.tag,source:main,anonymous_public_fetch:mode==='--anonymous'})+'\n');
