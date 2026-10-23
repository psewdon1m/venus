from pathlib import Path
import shutil,re,json
r=Path.cwd();work=r/'.artifacts/p05-private-batch-browser-producer16';assert not work.exists();shutil.copytree(r/'.artifacts/p05-private-batch-browser-producer15',work)
source=(work/'private-batch-observer.mjs').read_text(encoding='utf-8');reasons=sorted(set(re.findall(r"'([A-Z][A-Z0-9_]{0,127})'",source)))
helper="""/** Bounded passive-model evidence. Never copies DTOs, tokens or arbitrary error text. */
const reasons=new Set(REASONS);
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)?value:null;
export function safeFailedReadiness(value,{actor,expected}={}){
 const x=value&&typeof value==='object'?value:{},out={reason:reasons.has(x.reason)?x.reason:'UNLISTED_OR_UNAVAILABLE',actor_locale:['ru','en','tr'].includes(actor?.locale)?actor.locale:null,member_id:uuid(actor?.id),expected_scope:{room:uuid(expected?.room),member:uuid(expected?.member),session:uuid(expected?.session),round:uuid(expected?.round),min_rev:Number.isSafeInteger(expected?.minRev)&&expected.minRev>=0?expected.minRev:null},observer_model_only:true,cache_accept_observed:false,auth_generation_observed:false};
 for(const n of ['cycle_id','accepted_cycle_id','lease_remaining_ms','minimum_remaining_ms','pending_observers','dropped','body_errors','invalidations'])out[n]=Number.isFinite(x[n])&&x[n]>=0&&x[n]<=1e9?x[n]:null;
 for(const n of ['ready','observer_overflow','complete'])out[n]=typeof x[n]==='boolean'?x[n]:null;
 out.parts=Object.fromEntries(['own','target','conversation','chat','chat_required'].map(n=>[n,typeof x.parts?.[n]==='boolean'?x.parts[n]:null]));
 out.http=Object.fromEntries(['own','target','conversation','chat'].map(n=>[n,Number.isSafeInteger(x.http?.[n])&&x.http[n]>=100&&x.http[n]<=599?x.http[n]:null]));
 return out;
}
""".replace('REASONS',json.dumps(reasons))
(work/'readiness-diagnostics.mjs').write_text(helper,encoding='utf-8',newline='\n')
p=work/'browser.mjs';s=p.read_text(encoding='utf-8');s="import {safeFailedReadiness} from './readiness-diagnostics.mjs';\n"+s
old="}finally{row.finished_monotonic_ms=performance.now();row.last_snapshot=last;save();}"
new="}catch(error){row.failed_readiness=safeFailedReadiness(error.readiness??last,{actor:a,expected:wanted});throw error;}finally{row.finished_monotonic_ms=performance.now();row.last_snapshot=last;save();}"
assert s.count(old)==1;s=s.replace(old,new)
i=s.index('async function acceptActionsUi(');j=s.index('\nasync function ',i+1);before=s[i:j];after=before.replace('started+8000','started+12000').replace('budget_ms:8000','budget_ms:12000');assert before!=after and before.count('8000')==2;s=s[:i]+after+s[j:]
p.write_text(s,encoding='utf-8',newline='\n')
print(json.dumps({'status':'AUTHORED_NOT_TESTED','changes':'two function bodies + sanitized helper import; existing method15 error helper unchanged'}))
