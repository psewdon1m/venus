from pathlib import Path
import hashlib
r=Path.cwd();p=r/'.artifacts/p05-private-batch-browser-producer12/browser.mjs';assert p.read_bytes()==(r/'.artifacts/p05-method12-before-chat-freshness01/browser.mjs.bytes').read_bytes();s=p.read_bytes().decode('utf8');nl='\r\n' if '\r\n' in s else '\n'
def once(a,b):
    global s
    assert s.count(a)==1,a[:100];s=s.replace(a,b)
once("const privateBatches=createPrivateBatchObserver({sourceRoot:'/app'});","const observedOwnStarts=new WeakMap();"+nl+"const privateBatches=createPrivateBatchObserver({sourceRoot:'/app',onProjection:(actor,{kind,value})=>{if(kind==='own'&&Number.isFinite(value.started_monotonic_ms))observedOwnStarts.set(actor,value.started_monotonic_ms);}});")
once('minRev:expected.minRev??view.game_rev};','minRev:expected.minRev??view.game_rev,afterMonotonic:expected.afterMonotonic??null};')
once('last=ready;'+nl+'   const observed=a.lastGameView;',"last=ready;"+nl+"   if(wanted.afterMonotonic!==null&&(observedOwnStarts.get(a)??-Infinity)<wanted.afterMonotonic){await delay(Math.min(20,Math.max(1,deadline-performance.now())));continue;}"+nl+'   const observed=a.lastGameView;')
once('async function topicUiReady(a,f,minRev,control,stage,step){','async function topicUiReady(a,f,minRev,control,stage,step,afterMonotonic=null){')
once('expected:{session:f.session,round:f.plan.round_id,minRev}});','expected:{session:f.session,round:f.plan.round_id,minRev,afterMonotonic}});')
once('async function adviceUiReady(participants,f,minRev,control,label){','async function adviceUiReady(participants,f,minRev,control,label,afterMonotonic=null){')
once("topicUiReady(a,f,minRev,control,stage,'advice_'+label)","topicUiReady(a,f,minRev,control,stage,'advice_'+label,afterMonotonic)")
once("'pair-chat-messages','chat_committed');","'pair-chat-messages','chat_committed',performance.now());")
once("'pair-chat-messages','clock_chat_committed');","'pair-chat-messages','clock_chat_committed',performance.now());")
p.write_bytes(s.encode('utf8'));print(hashlib.sha256(p.read_bytes()).hexdigest())
