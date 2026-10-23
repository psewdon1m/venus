from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,sys
sys.stdout.reconfigure(encoding='utf-8');r=Path(__file__).parent;label=sys.argv[1];argv=sys.argv[2:];p=subprocess.run(argv,capture_output=True,text=True,encoding='utf-8',timeout=150)
(r/(label+'.stdout.txt')).write_text(p.stdout,encoding='utf-8');(r/(label+'.stderr.txt')).write_text(p.stderr,encoding='utf-8');row={'at_utc':datetime.now(timezone.utc).isoformat(),'label':label,'argv':argv,'exit_code':p.returncode};file=r/'COMMANDS.json';rows=json.loads(file.read_text())if file.exists()else[];rows.append(row);file.write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row));print(p.stdout[-8000:]);print(p.stderr[-5000:]);sys.exit(p.returncode)
