from pathlib import Path
import json,hashlib,sqlite3,sys
ROOT=Path(__file__).resolve().parents[5];OUT=Path(__file__).resolve().parent;P=ROOT/'.artifacts/p05-content-expansion-470-r2';OLD=ROOT/'.artifacts/p05-content-expansion-470';load=lambda p:json.loads(p.read_text(encoding='utf8'));sha=lambda b:hashlib.sha256(b).hexdigest();canon=lambda x:json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
assert sha((P/'HANDOFF.json').read_bytes())=='f821611bc39a0f8cbe2a9f2eb2f9deb5a296c2d37213746b2a3d92324117cd63';assert sha((P/'index.json').read_bytes())=='939bd5de862c0d0b761ca57a2f9204c94d2170347eb111b04046e946aa623fd7'
for base,count in [(P,514),(OLD,534)]:
 rows=load(base/'index.json')['files'];assert len(rows)==count
 for row in rows:
  f=base/row['path'];assert f.is_file() and not f.is_symlink();b=f.read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'],str(f)
assert sha((OLD/'index.json').read_bytes())=='2fb5890498bcae0f0bafad35ea17b631976d6ccb96a6381964fc4fb5417b7f57';assert sha((ROOT/'.docs/implementation/reviews/p05/draft470-review-round01/INDEX.json').read_bytes())=='90cf3712b8eec9bb7ec4614a4504be6558ca7bca0d5a5d839ffd48e8ce49e2b4'
input=load(P/'input-receipt.json');assert sha((ROOT/input['source_original_fullR2_ledger']).read_bytes())==input['source_original_fullR2_ledger_sha256']=='99cd8d4e0ef6b8ebf3fd62430e1af5d097585c3fd79183bb981cc6f1cbbaaa83';assert sha((OLD/'authoring/candidate.sqlite').read_bytes())==input['original_working_ledger_sha256']==sha((P/'authoring/rollback-draft470-r1.sqlite').read_bytes())
changes=load(P/'changes.json')['changed_cards'];ids={r['id'] for r in changes};assert ids=={'Q-1180','TD-1177','YB-1178'};cards={f.stem:load(f) for f in (P/'cards').glob('*.json')};assert len(cards)==470;guard_fields=set();unchanged=0
for id,c in cards.items():
 f=P/'cards'/(id+'.json');old=load(OLD/'cards'/(id+'.json'))
 if id not in ids:assert f.read_bytes()==(OLD/'cards'/(id+'.json')).read_bytes();unchanged+=1;continue
 r=next(r for r in changes if r['id']==id);assert c['revision']==2 and old['revision']==1;assert sha(f.read_bytes())==r['after_raw_sha256'];assert sha((OLD/'cards'/(id+'.json')).read_bytes())==r['before_raw_sha256']==sha((P/'revisions'/(id+'-r1.json')).read_bytes())
 for k in old:
  if k not in ['revision','text','authoring']:assert c[k]==old[k],(id,k);guard_fields.add(k)
 for locale in ['ru','en','tr']:assert c['text'][locale]!=old['text'][locale]
 if id=='YB-1178':
  for locale in ['ru','en','tr']:assert c['text'][locale]['responder']==old['text'][locale]['responder']
 assert c['status']=='draft' and c['authoring']['reviewed_by'] is None and c['authoring']['reviewed_at'] is None and c['authoring']['rights_status']=='needs_review'
assert unchanged==467
before=load(P/'authoring/before-export.json');old=load(OLD/'authoring/after-export.json');after=load(P/'authoring/after-export.json');assert before==old;assert after['events'][:148]==old['events'] and len(after['events'])==151
previous='0'*64
for i,e in enumerate(after['events'],1):assert e['seq']==i and e['previous']==previous and e['hash']==sha(canon({'kind':e['kind'],'body':e['body'],'previous':previous}));previous=e['hash']
assert after['head']==previous;assert [(e['kind'],e['body']['batch_id']) for e in after['events'][148:]]==[('DRAFT_RECORDED','P05-EXP470-Q-01'),('DRAFT_RECORDED','P05-EXP470-TD-02'),('DRAFT_RECORDED','P05-EXP470-YB-03')]
connect=lambda p:sqlite3.connect(p.resolve().as_uri()+'?mode=ro&immutable=1',uri=True)
with connect(P/'authoring/candidate.sqlite') as db,connect(OLD/'authoring/candidate.sqlite') as ob:
 counts={t:db.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ['batches','reservations','revisions','events']};assert counts=={'batches':41,'reservations':547,'revisions':844,'events':151};assert db.execute('PRAGMA quick_check').fetchone()[0]=='ok'
 for t in ['batches','reservations']:assert db.execute('SELECT * FROM '+t+' ORDER BY 1').fetchall()==ob.execute('SELECT * FROM '+t+' ORDER BY 1').fetchall()
 assert set(ob.execute('SELECT * FROM revisions'))<=set(db.execute('SELECT * FROM revisions'))
 for id,c in cards.items():
  row=db.execute('SELECT hash,body FROM revisions WHERE card_id=? AND revision=?',(id,c['revision'])).fetchone();assert row[0]==sha(canon(c)) and json.loads(row[1])==c
 for id in ids:assert [r[0] for r in db.execute('SELECT revision FROM revisions WHERE card_id=? ORDER BY revision',(id,))]==[1,2]
 for i in [1,2]:assert load(P/('authoring/after-record-'+str(i)+'.json'))['events']==after['events'][:148+i]
receipt=load(P/'authoring/record-receipt.json');assert receipt['cli_exit_codes']==[0,0,0] and receipt['new_reservations']==0 and receipt['added_events']==after['events'][148:]
material=load(OLD/'materialization-receipt.json')
for r in material['retained_exact_raw445']:assert sha((P/'cards'/(r['id']+'.json')).read_bytes())==r['raw_sha256']==sha((ROOT/r['source']).read_bytes())
for r in material['quarantined_whole_mixed5']:assert sha((P/'quarantine'/(r['id']+'.json')).read_bytes())==r['raw_sha256'];assert r['id'] not in cards
catalog=sha(canon(sorted([{'id':c['id'],'revision':c['revision'],'sha256':sha(canon(c))} for c in cards.values()],key=lambda r:r['id'])));assert catalog=='2de569e1088e591bf8f9d1f89200c914a0ce6b16306d592ad420904d6f2975ee'
for r in load(P/'source-index470.json')['cards']:assert sha((ROOT/r['source_path']).read_bytes())==r['raw_sha256'] and sha(canon(cards[r['id']]))==r['canonical_sha256']
sys.path.insert(0,str(ROOT/'tools'));from stage_inventory import inventory,identity
files=inventory();ident=identity(files);assert ident=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad' and len(files)==1813
oldpins=load(ROOT/'.docs/implementation/reviews/p05/draft470-review-round01/capacity-audit.json')['source_pins'];newpins=load(OUT/'capacity-audit.json')['source_pins'];assert oldpins==newpins
for path,v in oldpins.items():assert sha((ROOT/path).read_bytes())==v
for path,v in load(OLD/'input-receipt.json')['established_tool_pins'].items():assert sha((ROOT/path).read_bytes())==v
report={'status':'INDEPENDENT_R2_HISTORY_RAW_GUARD_COMPOSITION_PASS','new_packet_pins':514,'previous_packet_pins':534,'previous_failed_review_index_unchanged':True,'new_revision_ids':sorted(ids),'new_revisions':3,'new_events':3,'all151_events_hashchain_verified':True,'prefix148_exact':True,'unchanged_active_raw':467,'retained445_raw_exact':True,'quarantined5_exact':True,'guard_fields_exact':sorted(guard_fields),'YB_responder_all3_exact':True,'no_new_reservations':True,'sqlite_counts':counts,'catalog_digest':catalog,'all470_active_revisions_bound_to_real_history':True,'original_fullR2_ledger_unchanged':True,'original_r1_ledger_unchanged':True,'source_identity':ident,'assignment_expected_source':'13b24714f3dd2d6e2ea08e911042defb4ce0161b956a9bcc74af533d3795120e','source_context_transition':'ROOT_CONFIRMED_WEB_ONLY_13b_TO_1274; initial13bguardFAILED retained ascoordinationqualification, no global13bstabilityclaim','included_files':1813,'SQLite_mode':'ro+immutable','human_approval':False,'source_written':False}
OUT.joinpath('history-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');print(json.dumps({'status':report['status'],'counts':counts,'catalog':catalog,'source':ident}))
