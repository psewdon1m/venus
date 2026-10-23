from pathlib import Path
import shutil,json
r=Path.cwd();work=r/'.artifacts/p05-private-batch-browser-producer17';assert not work.exists();shutil.copytree(r/'.artifacts/p05-private-batch-browser-producer16',work)
p=work/'browser.mjs';s=p.read_text(encoding='utf-8')
old="const l=a.page.getByTestId(id);await expect(l).toBeVisible();await expect(l).toBeEnabled();if(ticket)assertPrivateTicket(a,id,ticket);await l.click("
new="const l=a.page.getByTestId(id);if(!ticket){await expect(l).toBeVisible();await expect(l).toBeEnabled();}if(ticket)assertPrivateTicket(a,id,ticket);await l.click("
assert s.count(old)==1;s=s.replace(old,new)
old="""function assertPrivateTicket(a,id,ticket){
 assert(ticket&&ticket.control===id,'METHOD12_PRIVATE_TICKET_REQUIRED');assert(performance.now()<ticket.deadline_monotonic_ms,'METHOD12_PRIVATE_TICKET_EXPIRED');const current=privateBatches.snapshot(a,{control:id,expectedScope:ticket.expected});assert(current.ready&&current.cycle_id===ticket.cycle_id,'METHOD12_PRIVATE_BATCH_CHANGED_BEFORE_CLICK');
}"""
new="""function assertPrivateTicket(a,id,ticket){
 let current=null,checkedAt=null;
 try{assert(ticket&&ticket.control===id,'METHOD12_PRIVATE_TICKET_REQUIRED');checkedAt=performance.now();assert(checkedAt<ticket.deadline_monotonic_ms,'METHOD12_PRIVATE_TICKET_EXPIRED');current=privateBatches.snapshot(a,{control:id,expectedScope:ticket.expected});assert(current.ready&&current.cycle_id===ticket.cycle_id,'METHOD12_PRIVATE_BATCH_CHANGED_BEFORE_CLICK');}
 catch(error){const rows=report.private_ticket_failures??=[];if(rows.length>=128)report.private_ticket_failure_overflow=true;else rows.push({control:normalPrivateControls.has(id)?id:'UNLISTED',checked_monotonic_ms:checkedAt,failed_monotonic_ms:performance.now(),prepared_cycle_id:Number.isSafeInteger(ticket?.cycle_id)&&ticket.cycle_id>=0?ticket.cycle_id:null,ticket_deadline_monotonic_ms:Number.isFinite(ticket?.deadline_monotonic_ms)?ticket.deadline_monotonic_ms:null,reason:!ticket||ticket.control!==id?'TICKET_MISSING_OR_WRONG_CONTROL':checkedAt>=ticket.deadline_monotonic_ms?'TICKET_EXPIRED':'BATCH_NOT_READY_OR_CHANGED',current:safeFailedReadiness(current,{actor:a,expected:{...ticket?.expected,minRev:ticket?.expected?.rev}})});save();throw error;}
}"""
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s,encoding='utf-8',newline='\n')
print(json.dumps({'status':'AUTHORED_NOT_TESTED','only_functions':['assertPrivateTicket','click'],'all_case_bodies':'UNCHANGED'}))
