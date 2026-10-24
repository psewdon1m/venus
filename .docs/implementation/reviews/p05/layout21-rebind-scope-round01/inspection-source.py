from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,re
w=Path('.artifacts/p05-layout21-scope01');w.mkdir(exist_ok=False);sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'));records=[]
source=Path('.docs/implementation/evidence/p04/review470-r4/source-index470.json');idx=read(source)
for r in idx['cards']:
 p=Path(r['path']);raw=p.read_bytes();assert sha(raw)==r['raw_sha256'];card=json.loads(raw)
 for locale,fields in card['text'].items():
  for field,text in fields.items():
   substituted=text.replace('{P1}','W'*192).replace('{P2}','W'*192);tokens=re.findall(r'\{P[12]\}',text);literal=re.sub(r'\{P[12]\}','',text)
   records.append({'card_id':card['id'],'card_revision':card['revision'],'card_raw_sha256':r['raw_sha256'],'locale':locale,'mode':card['mode'],'interaction':card['interaction'],'surface':'private'if card['interaction']=='pair_private'else'public','field':field,'field_sha256':sha(text.encode()),'codepoints':len(substituted),'utf8_bytes_literal':len(literal.encode()),'placeholders':len(tokens),'longest_unbroken_codepoints':max(map(len,re.split(r'\s+',substituted)),default=0)})
buckets={}
for row in records:buckets.setdefault((row['locale'],row['mode'],row['surface'],row['field']),[]).append(row)
selected={}
for key,rows in sorted(buckets.items()):
 for metric in ['codepoints','longest_unbroken_codepoints']:
  winner=sorted(rows,key=lambda r:(-r[metric],r['card_id']))[0];selected.setdefault((winner['card_id'],winner['locale'],winner['field']),{**winner,'reasons':[]})['reasons'].append({'bucket':list(key),'metric':metric})
old=Path('.artifacts/p05-v2-layout-producer-resume03');method=Path('.artifacts/p05-private-batch-browser-producer21');handoff=read(Path('.docs/implementation/reviews/p05/topic-browser-bundle21-author-round01/HANDOFF.json'));runtime=[]
for name,pin in handoff['runtime_pins'].items():
 assert sha((method/name).read_bytes())==pin;runtime.append({'file':name,'method21_sha256':pin,'layout03_sha256':sha((old/name).read_bytes())if(old/name).exists()else None,'equal_if_present':(old/name).exists()and sha((old/name).read_bytes())==pin})
result={'at_utc':datetime.now(timezone.utc).isoformat(),'scope':'READONLY_REBIND_NEEDS_AND_TEXT_EXTREMES_NOT_LAYOUT_EXECUTION','catalog_digest':idx['catalog_digest'],'source_index_sha256':sha(source.read_bytes()),'cards_raw_verified':len(idx['cards']),'fields':len(records),'buckets':len(buckets),'representative_field_locale_rows':len(selected),'representative_unique_cards':len({r['card_id']for r in selected.values()}),'selected':list(selected.values()),'runtime21_nine_inputs':runtime,'actual_browser_Docker_runs':0,'fixture_implementation_changes':0,'source_changes':0}
(w/'scope-analysis.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in result.items()if k not in ['selected','runtime21_nine_inputs']},indent=2));print(json.dumps(runtime,indent=2))
