/** Read-only inventory of the exact distributed binary and container OS.
 * Reads Go build-info bytes; never executes third-party media code. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const binary=fs.readFileSync('/usr/local/bin/venus-media-server'),magic=Buffer.concat([Buffer.from([255]),Buffer.from(' Go buildinf:')]),offset=binary.indexOf(magic);
if(offset<0||!(binary[offset+15]&2))throw Error('MEDIA_GO_BUILD_INFO_UNAVAILABLE');
let cursor=offset+32;
function string(){let length=0,shift=0;for(let i=0;i<5;i++){const v=binary[cursor++];length+=(v&127)*2**shift;if(!(v&128)){if(length>4*1024*1024||cursor+length>binary.length)throw Error('MEDIA_GO_BUILD_INFO_INVALID');const value=binary.subarray(cursor,cursor+length);cursor+=length;return value;}shift+=7;}throw Error('MEDIA_GO_BUILD_INFO_INVALID');}
const goVersion=string().toString(),module=string(),text=module.length>=32?module.subarray(16,-16).toString():module.toString(),rows=text.split('\n').filter(Boolean);
const inventory={format:1,media_binary_sha256:createHash('sha256').update(binary).digest('hex'),media_binary_bytes:binary.length,go_version:goVersion,go_build_information:rows,node_version:process.version,os_release:fs.readFileSync('/etc/os-release','utf8'),os_packages:execFileSync('dpkg-query',['-W','-f','${binary:Package}\t${Version}\t${Architecture}\n'],{encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n'),scope:'exact image invocation; no automatic vulnerability or license clearance'};
process.stdout.write(JSON.stringify(inventory,null,2)+'\n');
