from pathlib import Path
import json,shutil
r=Path.cwd();work=r/'.artifacts/p05-topic-measurements-method10';assert not work.exists();shutil.copytree(r/'.artifacts/p05-topic-measurements-method09',work)
p=work/'r100-v3-watchdog.mjs';s=p.read_text(encoding='utf-8');old='const terminalWritten=guardedAtomic(terminalFile,report);if(capacityFault)';assert s.count(old)==1;s=s.replace(old,'const terminalWritten=guardedAtomic(terminalFile,report);report.io_failure=ioFailure;if(capacityFault)');p.write_text(s,encoding='utf-8',newline='\n')
for p in work.iterdir():
 if p.is_file() and p.suffix in ['.mjs','.json']:
  s=p.read_text(encoding='utf-8').replace('.artifacts/p05-topic-measurements-method09','.artifacts/p05-topic-measurements-method10').replace('METHOD09-FAIL-CLOSED-SUPERVISOR-DIAGNOSTICS','METHOD10-TERMINAL-IO-RECONCILIATION').replace('EXACT_METHOD09_LAUNCHER_REQUIRED','EXACT_METHOD10_LAUNCHER_REQUIRED').replace('p05-method09-terminal-controls01.json','p05-method10-terminal-controls01.json');p.write_text(s,encoding='utf-8',newline='\n')
for name in ['p05-method09-supervisor-controls01.mjs','p05-method09-package-controls01.py']:
 source=r/'.artifacts'/name;s=source.read_text(encoding='utf-8').replace('method09','method10');(r/'.artifacts'/name.replace('method09','method10')).write_text(s,encoding='utf-8',newline='\n')
print(json.dumps({'status':'AUTHORED_NOT_TESTED','only_behavior_change':'post-terminal-write io_failure synchronization','other_changes':'candidate and excluded producer paths/output names'}))
