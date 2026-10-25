/** Read-only actual-image inventory. Does not certify license/security readiness. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const declared=JSON.parse(fs.readFileSync('/app/infra/venus/presentation-dependencies.json'));
const packages=execFileSync('/usr/bin/dpkg-query',['-W','-f=${binary:Package}\t${Version}\t${source:Package}\t${source:Version}\n'],{encoding:'utf8',timeout:10000,maxBuffer:2*1024*1024});
const installed=new Map(packages.trim().split('\n').map(line=>{const [name,version]=line.split('\t');return [name.split(':')[0],version];}));
const pin_checks=Object.entries(declared.debian_bookworm_pins).map(([name,expected])=>({package:name,expected,actual:installed.get(name)??null,match:installed.get(name)===expected}));
const binaries=['/usr/bin/pdfinfo','/usr/bin/pdftoppm','/usr/bin/python3'].map(file=>{const actual=fs.realpathSync(file),bytes=fs.readFileSync(actual);return {path:file,resolved_path:actual,bytes:bytes.length,sha256:digest(bytes)};});
const license_files=Object.keys(declared.debian_bookworm_pins).map(name=>{const file='/usr/share/doc/'+name+'/copyright';try{const actual=fs.realpathSync(file),bytes=fs.readFileSync(actual);return {package:name,path:file,resolved_path:actual,bytes:bytes.length,sha256:digest(bytes),available:true};}catch{return {package:name,path:file,available:false};}});
const poppler=spawnSync('/usr/bin/pdfinfo',['-v'],{encoding:'utf8',timeout:5000,maxBuffer:4096});if(poppler.error||poppler.status!==0)throw Error('PRESENTATION_INVENTORY_UNAVAILABLE');
const build=fs.existsSync('/app/build-metadata.json')?JSON.parse(fs.readFileSync('/app/build-metadata.json')):null;
process.stdout.write(JSON.stringify({format:'VENUS-PRESENTATION-INVENTORY-1',declared,pinned_availability_verified:pin_checks.every(row=>row.match),pin_checks,python:execFileSync('/usr/bin/python3',['--version'],{encoding:'utf8',timeout:5000,maxBuffer:4096}).trim(),poppler:((poppler.stdout??'')+(poppler.stderr??'')).trim(),binaries,packages_tsv:packages,license_files,build,build_metadata_present:build!==null,fixture:fs.existsSync('/app/tests/p05'),declared_source_revision:build?.source_revision??null,source_attestation:false,runtime_isolation_proof:false,public_distribution_clearance:false})+'\n');
