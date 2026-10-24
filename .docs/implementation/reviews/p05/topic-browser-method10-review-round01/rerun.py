from pathlib import Path
import subprocess,re,json
base=Path('.artifacts/p05-topic-browser-method10-review-round01');src=Path('.artifacts/p05-topic-browser/author-checks')
rows=[]
for name in ['topic-phases10-controls.mjs','corrections.mjs','delivery-controls.mjs','metadata-corrections.mjs','round-races.mjs']:
 text=(src/name).read_text('utf-8')
 # Only actual import lines change; finite source expectation literals remain exact.
 text=re.sub(r"(?m)^(import[^\n]*from ')\.\./",r"\1../p05-topic-browser/",text)
 target=(base/(name+'.json')).as_posix()
 text,n=re.subn(r"writeFileSync\([^,\n]+,JSON.stringify\(report|writeFileSync\([^,\n]+,JSON.stringify\(result",lambda m:"writeFileSync('"+target+"',JSON.stringify("+('result' if m.group().endswith('(result') else 'report'),text)
 assert n==1,(name,n)
 (base/name).write_text(text,'utf-8')
 p=subprocess.run(['C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe',str(base/name)],capture_output=True,text=True,encoding='utf-8')
 (base/(name+'.txt')).write_text(p.stdout+p.stderr,'utf-8');assert p.returncode==0,(name,p.stdout,p.stderr)
 result=json.loads(Path(target).read_text('utf-8'));assert all(x['status']=='PASS' for x in result['rows']);rows.append({'file':name,'exit_code':p.returncode,'PASS':len(result['rows'])})
(base/'rerun-results.json').write_text(json.dumps(rows,indent=2)+'\n','utf-8');print(json.dumps(rows))
