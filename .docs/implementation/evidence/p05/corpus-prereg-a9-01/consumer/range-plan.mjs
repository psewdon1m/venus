import assert from 'node:assert/strict';
import {cells} from './c2/consumer.mjs';
import {caseAt} from './m3/descriptor.mjs';
export const counts=Object.freeze({'c2-static':47040,'c2-trajectory':37072,'c2-canary':336,'m3-invariants':70000,'m3-fairness':84000,'m3-gf':1000000,'m3-inference':126000});
export function validateRange(section,start,count){
 assert(Object.hasOwn(counts,section));assert(Number.isSafeInteger(start)&&start>=0);assert(Number.isSafeInteger(count)&&count>0&&count<=10000);assert(start+count<=counts[section]);return {section,start,count,end:start+count};
}
export function parseRange(args){assert.equal(args.length,4);assert.equal(args[0],'range');assert(/^(0|[1-9]\d*)$/.test(args[2]));assert(/^[1-9]\d*$/.test(args[3]));return validateRange(args[1],Number(args[2]),Number(args[3]));}
export function* descriptors(range){
 validateRange(range.section,range.start,range.count);
 if(range.section.startsWith('c2-')){let ordinal=0;for(const cell of cells(range.section.slice(3))){if(ordinal>=range.end)break;if(ordinal>=range.start)yield {ordinal,cell};ordinal++;}}
 else for(let ordinal=range.start;ordinal<range.end;ordinal++)yield {ordinal,descriptor:caseAt(range.section.slice(3),ordinal)};
}
export function assertCoverage(section,ranges){
 assert(Object.hasOwn(counts,section));assert(Array.isArray(ranges)&&ranges.length>0);
 let next=0;for(const r of [...ranges].sort((a,b)=>a.start-b.start)){validateRange(section,r.start,r.count);assert.equal(r.section,section);assert.equal(r.start,next,'RANGE_GAP_OR_OVERLAP');next+=r.count;}
 assert.equal(next,counts[section],'FULL_SECTION_COUNT_REQUIRED');return next;
}
