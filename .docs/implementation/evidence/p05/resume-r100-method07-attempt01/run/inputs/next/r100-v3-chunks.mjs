/** Versioned copy: same bytes/flush semantics, gzip call timing only. */
import {diagnosticTimings} from './r100-v3-timing.mjs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
export class ChunkWriter{
 constructor(store,prefix,{maxBytes=4*1024*1024}={}){this.store=store;this.prefix=prefix;this.maxBytes=maxBytes;this.pending=[];this.pendingBytes=0;this.records=0;this.chunks=[];}
 append(value){const bytes=Buffer.from(JSON.stringify(value)+'\n');assert(bytes.length<=this.maxBytes,'SINGLE_RECORD_CAPACITY');if(this.pendingBytes+bytes.length>this.maxBytes)this.flush();this.pending.push(bytes);this.pendingBytes+=bytes.length;this.records++;}
 flush(){if(!this.pendingBytes)return;const raw=Buffer.concat(this.pending),compressed=diagnosticTimings.sync('gzip6',()=>gzipSync(raw,{level:6})),name=this.prefix+'/'+String(this.chunks.length).padStart(6,'0')+'.ndjson.gz';this.store.write(name,compressed);this.chunks.push({path:name,records:this.pending.length,bytes:compressed.length,raw_bytes:raw.length,sha256:createHash('sha256').update(compressed).digest('hex'),raw_sha256:createHash('sha256').update(raw).digest('hex')});this.pending=[];this.pendingBytes=0;}
 finish(){this.flush();return{records:this.records,chunks:this.chunks};}
}
export function decodeChunk(bytes,row){assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0&&row.bytes<=8*1024*1024,'CHUNK_COMPRESSED_BOUND');assert(Number.isSafeInteger(row.raw_bytes)&&row.raw_bytes>0&&row.raw_bytes<=4*1024*1024,'CHUNK_RAW_BOUND');assert(Number.isSafeInteger(row.records)&&row.records>0&&row.records<=row.raw_bytes,'CHUNK_COUNT_BOUND');assert.equal(bytes.length,row.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);const raw=gunzipSync(bytes,{maxOutputLength:4*1024*1024});assert.equal(raw.length,row.raw_bytes);assert.equal(createHash('sha256').update(raw).digest('hex'),row.raw_sha256);const lines=raw.toString('utf8').trimEnd().split('\n');assert.equal(lines.length,row.records);return lines.map(line=>JSON.parse(line));}
