import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {gunzipSync} from 'node:zlib';import {isDeepStrictEqual} from 'node:util';
const O=path.dirname(fileURLToPath(import.meta.url)),D='C:/.projects/venus/.artifacts/p05-privacy-matched-runs01/65acd7b620ab363cbda1ea589b4ea0db/export/raw/payload',index=JSON.parse(fs.readFileSync(D+'/FINAL_INDEX.json')),differences=[];
const differingPaths=(a,b,p='')=>{if(isDeepStrictEqual(a,b))return[];if(a&&b&&typeof a==='object'&&typeof b==='object')return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>differingPaths(a[k],b[k],p?`${p}.${k}`:k));return[p];};
for(const part of index.segments)for(const line of gunzipSync(fs.readFileSync(D+'/'+part.file)).toString().trimEnd().split('\n')){
 const row=JSON.parse(line);if(row.kind!=='corpus-case')continue;const r=row.value.result;
 for(const kind of ['exclusion','semantic'])if(!r.comparisons[kind].public_trace_equal){
  const a=r.raw.base.public_frames,b=r.raw[kind].public_frames;let i=0;while(i<Math.min(a.length,b.length)&&isDeepStrictEqual({modeled_tick:a[i].modeled_tick,payload:a[i].payload},{modeled_tick:b[i].modeled_tick,payload:b[i].payload}))i++;
  differences.push({ordinal:r.descriptor.ordinal,cell:r.descriptor.cell,rounds:r.descriptor.rounds,kind,classification:r.comparisons[kind].classification,base_frames:a.length,variant_frames:b.length,first_unequal_frame_index:i,base_modeled_mutation:a[i]?.modeled_mutation??null,variant_modeled_mutation:b[i]?.modeled_mutation??null,unequal_paths:differingPaths(a[i],b[i]),private_safe_empty:{base:r.raw.base.counts.private_safe_empty,variant:r.raw[kind].counts.private_safe_empty},payload_values_exported:false});
 }
}
fs.writeFileSync(O+'/TRACE-DIFFERENCES.json',JSON.stringify({status:'FOUR_UNSUPPORTED_TRACE_DIFFERENCES_RETAINED_NOT_PRIVACY_PASS',differences},null,2)+'\n');console.log(JSON.stringify(differences));
