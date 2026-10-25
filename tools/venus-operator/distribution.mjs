/** Signed README binds corresponding-source assets without changing immutable release formats. */
import fs from 'node:fs';
import path from 'node:path';
import {canonical,exactKeys,fileHash,HEX,regular,requireValue} from './files.mjs';
export const distributionNames=['sources.tar','SOURCE-INDEX.json','THIRD-PARTY-NOTICES.md'];
const marker='\nVENUS_DISTRIBUTION_ASSETS_JSON\n';
export function validateDistribution(value){
 exactKeys(value,['format','assets']);requireValue(value.format==='VENUS-DISTRIBUTION-1'&&Array.isArray(value.assets)&&value.assets.length===3,'DISTRIBUTION_PROFILE');
 for(const [i,asset]of value.assets.entries()){exactKeys(asset,['name','sha256','bytes']);requireValue(asset.name===distributionNames[i]&&HEX.test(asset.sha256)&&Number.isSafeInteger(asset.bytes)&&asset.bytes>0&&asset.bytes<=(i===0?2*1024**3:16*1024**2),'DISTRIBUTION_ASSET');}
 return value;
}
export function distributionMetadata(directory){return validateDistribution({format:'VENUS-DISTRIBUTION-1',assets:distributionNames.map((name,i)=>{const file=path.join(directory,name),s=regular(file,i===0?2*1024**3:16*1024**2);return {name,bytes:s.size,sha256:fileHash(file)};})});}
export function distributionReadme(directory){return marker+canonical(distributionMetadata(directory))+'\n';}
export function parseDistribution(bytes,required=false){const text=bytes.toString('utf8'),parts=text.split(marker);requireValue(parts.length<=2,'DISTRIBUTION_METADATA');if(parts.length===1){requireValue(!required,'DISTRIBUTION_REQUIRED');return null;}const raw=parts[1].trim();requireValue(raw.length<16384,'DISTRIBUTION_METADATA');const value=validateDistribution(JSON.parse(raw));requireValue(canonical(value)===raw,'DISTRIBUTION_CANONICAL');return value;}
export function verifyDistribution(directory,metadata){for(const asset of validateDistribution(metadata).assets){const file=path.join(directory,asset.name);requireValue(regular(file,asset.bytes).size===asset.bytes&&fileHash(file)===asset.sha256,'DISTRIBUTION_ASSET_MISMATCH');}return true;}
export function copyDistribution(source,destination){const value=distributionMetadata(source);for(const asset of value.assets){const target=path.join(destination,asset.name);fs.copyFileSync(path.join(source,asset.name),target,fs.constants.COPYFILE_EXCL);fs.chmodSync(target,0o644);}verifyDistribution(destination,value);return value;}
