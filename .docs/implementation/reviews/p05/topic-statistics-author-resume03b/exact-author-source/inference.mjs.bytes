import assert from 'node:assert/strict';
import {trainLDA,aucCI} from '../p05-topic-measurements/statistics.mjs';
import {classIndex,dense,sha,featureHash} from './protocol.mjs';
export function deterministicDecoders(training,holdout,names){
 const hits=[];for(let feature=0;feature<names.length;feature++){
  const a=new Set(training[0].map(row=>row[feature])),b=new Set(training[1].map(row=>row[feature]));if([...a].some(v=>b.has(v)))continue;
  if(holdout[0].every(row=>a.has(row[feature]))&&holdout[1].every(row=>b.has(row[feature])))hits.push(names[feature]);
 }return hits;
}
export function evaluateCell(rows,names){
 assert.equal(sha(names),featureHash);const train=[[],[]],holdout=[[],[]],seen=new Set();let refused=0;
 for(const row of rows){const d=row.descriptor,c=classIndex(d);assert(c===0||c===1);assert(['train','holdout'].includes(d.split));const key=[c,d.split,d.index].join('/');assert(!seen.has(key),'DUPLICATE_INFERENCE_INDEX');seen.add(key);assert(Number.isInteger(d.index)&&d.index>=0&&d.index<(d.split==='train'?100:400),'INFERENCE_INDEX_RANGE');(d.split==='train'?train:holdout)[c].push(dense(row));refused+=Number(row.summary.status==='SAFE_REFUSAL');}
 assert(train.every(x=>x.length===100)&&holdout.every(x=>x.length===400),'INFERENCE_SPLIT_COUNTS');
 const model=trainLDA(...train),scores=holdout.map(rows=>rows.map(model.score)),metric=aucCI(...scores),decoders=deterministicDecoders(train,holdout,names);
 return{status:metric.status==='PASS'&&!decoders.length&&!refused?'PASS':'FAIL',train_per_class:100,holdout_per_class:400,refusals_retained:refused,metric,heldout_scores:scores,coefficient_sha256:sha(Buffer.from(model.weights.buffer)),intercept:model.intercept,structural_deterministic_decoders:decoders,weights:Array.from(model.weights)};
}
/** Pooled LDA learns its own coefficients from raw training rows; cell scores never enter it. */
export async function evaluatePooled(replay,names,{expectedCells,guard=()=>{}}={}){
 assert.equal(sha(names),featureHash);assert(Number.isInteger(expectedCells)&&expectedCells>0);const n=[0,0],sum=[new Float64Array(names.length),new Float64Array(names.length)],sq=[new Float64Array(names.length),new Float64Array(names.length)],hasZero=[new Uint8Array(names.length),new Uint8Array(names.length)];let refused=0;
 for await(const row of replay()){guard();const c=classIndex(row.descriptor);assert(c===0||c===1);if(row.descriptor.split!=='train')continue;const v=dense(row);n[c]++;for(let i=0;i<v.length;i++){sum[c][i]+=v[i];sq[c][i]+=v[i]**2;if(v[i]===0)hasZero[c][i]=1;}}
 assert(n.every(x=>x===expectedCells*100),'POOLED_TRAIN_COUNTS');
 const means=sum.map((v,c)=>Float64Array.from(v,x=>x/n[c])),variances=sq.map((v,c)=>Float64Array.from(v,(x,i)=>Math.max(0,(x-n[c]*means[c][i]**2)/(n[c]-1)))),weights=Float64Array.from(means[0],(_,i)=>(means[1][i]-means[0][i])/((variances[0][i]+variances[1][i])/2+1e-9)),intercept=-weights.reduce((s,w,i)=>s+w*(means[0][i]+means[1][i])/2,0),scores=[[],[]];
 for await(const row of replay()){guard();refused+=Number(row.summary.status==='SAFE_REFUSAL');if(row.descriptor.split!=='holdout')continue;const c=classIndex(row.descriptor),v=dense(row);scores[c].push(v.reduce((s,x,i)=>s+x*weights[i],intercept));}
 assert(scores.every(s=>s.length===expectedCells*400),'POOLED_HOLDOUT_COUNTS');
 // Exact single-feature decoder, one feature at a time: bounded retained RAM,
 // additional replay I/O stated explicitly rather than silently omitting pooled decoder.
 const decoders=[];
 const scalar=(row,i)=>row.sparse.find(([j])=>j===i)?.[1]??0;
 for(let i=0;i<names.length;i++){
  guard();if(hasZero[0][i]&&hasZero[1][i])continue;
  const sets=[new Set(),new Set()];for await(const row of replay()){guard();if(row.descriptor.split==='train')sets[classIndex(row.descriptor)].add(scalar(row,i));}
  if([...sets[0]].some(v=>sets[1].has(v)))continue;
  let exact=true;for await(const row of replay()){guard();if(row.descriptor.split==='holdout'&&!sets[classIndex(row.descriptor)].has(scalar(row,i))){exact=false;break;}}
  if(exact)decoders.push(names[i]);
 }
 const metric=aucCI(...scores);return{status:metric.status==='PASS'&&!decoders.length&&!refused?'PASS':'FAIL',train_per_class:n,holdout_per_class:scores.map(s=>s.length),refusals_retained:refused,metric,heldout_scores:scores,weights:Array.from(weights),coefficient_sha256:sha(Buffer.from(weights.buffer)),intercept,structural_deterministic_decoders:decoders,pooling:'independently trained pooled classifier, never pooled cell scores',decoder_io:'one training replay per feature; disjoint candidate adds holdout replay; resource guard checked per row'};
}
