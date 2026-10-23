from pathlib import Path
import json,hashlib,sqlite3,sys,collections
ROOT=Path(__file__).resolve().parents[5];OUT=Path(__file__).resolve().parent;P=ROOT/'.artifacts/p05-content-expansion-470';sys.path.insert(0,str(ROOT/'tools'));from stage_inventory import inventory,identity
sha=lambda b:hashlib.sha256(b).hexdigest();load=lambda p:json.loads(p.read_text(encoding='utf8'));canon=lambda x:json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
input=load(P/'input-receipt.json');idx=load(P/'index.json');assert sha((P/'HANDOFF.json').read_bytes())=='efe1edee5d3fb78ae4b5533e7387290f332d2974304a3f595530f989e0dbb376';assert sha((P/'index.json').read_bytes())=='2fb5890498bcae0f0bafad35ea17b631976d6ccb96a6381964fc4fb5417b7f57'
for row in idx['files']:
 f=P/row['path'];assert not f.is_symlink();b=f.read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256']
assert len(idx['files'])==534;ledger=ROOT/input['original_ledger_path'];original_sha=sha(ledger.read_bytes());assert original_sha=='99cd8d4e0ef6b8ebf3fd62430e1af5d097585c3fd79183bb981cc6f1cbbaaa83';assert sha((P/input['rollback_raw_copy']).read_bytes())==original_sha
for field in ['original_final_export','source_manifest','source_450_map']:
 path=input.get(field+'_path',input.get(field));assert sha((ROOT/path).read_bytes())==input[{'original_final_export':'original_final_export_sha256','source_manifest':'source_manifest_raw_sha256','source_450_map':'source_450_map_sha256'}[field]]
for path,digest in input['established_tool_pins'].items():assert sha((ROOT/path).read_bytes())==digest,path
receipt=load(P/'materialization-receipt.json');original=load(ROOT/input['original_final_export_path']);before=load(P/'authoring/before-export.json');reserved=load(P/'authoring/reserved-before-materialization-export.json');after=load(P/'authoring/after-export.json');assert before==original;assert after['events'][:138]==original['events'];assert reserved['events']==after['events'][:143];assert len(after['events'])==148
previous='0'*64
for i,e in enumerate(after['events'],1):assert e['seq']==i and e['previous']==previous and e['hash']==sha(canon({'kind':e['kind'],'body':e['body'],'previous':previous}));previous=e['hash']
assert after['head']==previous;assert [e['kind'] for e in after['events'][138:]]==['RESERVED']*5+['DRAFT_RECORDED']*5
connect=lambda p:sqlite3.connect(p.resolve().as_uri()+'?mode=ro&immutable=1',uri=True)
with connect(P/'authoring/candidate.sqlite') as db,connect(ledger) as orig,connect(P/'authoring/reserved-rollback.sqlite') as resdb:
 counts={t:db.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ['batches','reservations','revisions','events']};assert counts=={'batches':41,'reservations':547,'revisions':841,'events':148}
 for t in ['reservations','revisions','events']:
  rows=orig.execute('SELECT * FROM '+t+' ORDER BY 1,2').fetchall();actual=db.execute('SELECT * FROM '+t+' ORDER BY 1,2').fetchall();assert set(rows)<=set(actual),t
 assert db.execute('SELECT * FROM batches WHERE id NOT LIKE ? ORDER BY id',('P05-EXP470-%',)).fetchall()==orig.execute('SELECT * FROM batches ORDER BY id').fetchall()
 assert resdb.execute('SELECT count(*) FROM revisions').fetchone()[0]==816 and resdb.execute('SELECT count(*) FROM events').fetchone()[0]==143
 reservation_receipt=load(P/'authoring/reservation-receipt.json');record_receipt=load(P/'authoring/record-receipt.json');assert sha((P/'authoring/reservation-receipt.json').read_bytes())==receipt['reservation_receipt_sha256'];assert sha((P/'authoring/reserved-before-materialization-export.json').read_bytes())==receipt['reserved_export_before_materialization_sha256'];assert len(reservation_receipt['operations'])==len(record_receipt['operations'])==5
 all_ids=[]
 for i,r in enumerate(input['requests']):
  request=load(ROOT/r['path']);assert sha((ROOT/r['path']).read_bytes())==r['request_raw_sha256'];event=after['events'][138+i];assert event['body']['batch_id']==r['batch_id'] and event['body']['request_sha256']==r['request_raw_sha256'];expected=[{'questions':'Q','truth_or_dare':'TD','yes_but':'YB'}[r['mode']]+'-'+str(n).zfill(4) for n in range(r['id_range'][0],r['id_range'][1]+1)];assert len(expected)==r['count'];op=reservation_receipt['operations'][i];assert op['actual_reserved_ids']==expected and op['exit_code']==0 and op['reserved_before_any_card_materialization'] is True;assert json.loads((P/'authoring'/ (r['batch_id']+'-reservation.txt')).read_text(encoding='utf8').strip().splitlines()[-1])==expected
  assert sorted(row[0] for row in resdb.execute('SELECT card_id FROM reservations WHERE batch_id=?',(r['batch_id'],)))==expected
  assert db.execute('SELECT request FROM batches WHERE id=?',(r['batch_id'],)).fetchone()[0]==canon(event['body']).decode()
  assert record_receipt['operations'][i]['exit_code']==0;export=load(P/'authoring'/('after-record-'+str(i+1)+'.json'));assert export['events']==after['events'][:144+i];assert sha((P/'authoring'/('after-record-'+str(i+1)+'.json')).read_bytes())==record_receipt['operations'][i]['export_sha256'];all_ids.extend(expected)
 assert len(all_ids)==len(set(all_ids))==25;cards={f.stem:load(f) for f in sorted((P/'cards').glob('*.json'))};assert len(cards)==470
 for id,c in cards.items():
  row=db.execute('SELECT hash,body FROM revisions WHERE card_id=? AND revision=?',(id,c['revision'])).fetchone();assert row and row[0]==sha(canon(c)) and json.loads(row[1])==c;assert c['status']=='draft' and c['authoring']['reviewed_by'] is None and c['authoring']['rights_status']=='needs_review'
 for r in receipt['retained_exact_raw445']+receipt['quarantined_whole_mixed5']:
  assert sha((ROOT/r['source']).read_bytes())==sha((ROOT/r['candidate_path']).read_bytes())==r['raw_sha256'];assert sha(canon(load(ROOT/r['candidate_path'])))==r['canonical_sha256']
 assert len(receipt['retained_exact_raw445'])==445 and len(receipt['quarantined_whole_mixed5'])==5;assert set(cards)=={r['id'] for r in receipt['retained_exact_raw445']}|set(all_ids)
 assert set(f.stem for f in (ROOT/input['source_cards']).glob('*.json'))=={r['id'] for r in receipt['retained_exact_raw445']+receipt['quarantined_whole_mixed5']}
 modes=collections.Counter(c['mode'] for c in cards.values());categories={m:dict(collections.Counter(c['category'] for c in cards.values() if c['mode']==m)) for m in modes};assert dict(modes)=={'questions':160,'truth_or_dare':160,'yes_but':150}
 for m,groups in categories.items():assert len(groups)==5 and all(n*5==modes[m] for n in groups.values());assert sum(c['interaction']=='pair_private' for c in cards.values() if c['mode']==m)==50
 publicpair={m:sorted(c['id'] for c in cards.values() if c['mode']==m and c['interaction']=='pair_public') for m in ['questions','truth_or_dare']};assert len(publicpair['questions'])==6 and len(publicpair['truth_or_dare'])==9
 for id in sum(publicpair.values(),[]):assert (P/'cards'/(id+'.json')).read_bytes()==(ROOT/input['source_cards']/(id+'.json')).read_bytes()
 for new,old in [('YB-1179','YB-1113'),('YB-1180','YB-1133')]:
  a=cards[new];b=load(ROOT/input['source_cards']/(old+'.json'))
  for field in ['mode','category','interaction','participants_required','meeting_contexts','relationship_scope','min_comfort','min_progression_stage','consent','requires_physical_contact','requires_going_away','required_capabilities']:assert a[field]==b[field],(new,field)
for row in load(P/'source-index470.json')['cards']:
 c=cards[row['id']];assert sha((ROOT/row['source_path']).read_bytes())==row['raw_sha256'] and sha(canon(c))==row['canonical_sha256']
oldmap=load(ROOT/input['source_450_map']);oldentries={r['card_id']:r for r in oldmap['entries']};oldmanifest=load(ROOT/input['source_manifest']);oldrefs={r['id']:r for r in oldmanifest['cards']}
for f in (ROOT/input['source_cards']).glob('*.json'):
 c=load(f);assert c['revision']==oldentries[c['id']]['card_revision']==oldrefs[c['id']]['revision'];assert sha(canon(c))==oldentries[c['id']]['card_sha256']==oldrefs[c['id']]['sha256']
quarantine_ids={r['id'] for r in receipt['quarantined_whole_mixed5']};mixed={r['card_id'] for r in oldmap['entries'] if set(r['semantic_family_ids'])&{'P04-SEM-17','P04-SEM-18'}};assert mixed==quarantine_ids and len(mixed)==5
catalog=sha(canon(sorted([{'id':c['id'],'revision':c['revision'],'sha256':sha(canon(c))} for c in cards.values()],key=lambda r:r['id'])));assert catalog=='87bb60f870c8bb352fa06dbf14a0f863ef298f16fe3d4c377f15512b57f3441c'
assert sha(ledger.read_bytes())==original_sha;current=inventory();ident=identity(current);assert ident=='e9b9d97223ab38721255c67d041638f99594d0536b719a82a1531e58e137e6d4' and len(current)==1813
report={'status':'INDEPENDENT_READ_ONLY_LEDGER_AND_COMPOSITION_PASS_NOT_CONTENT_APPROVAL','indexed_children':534,'all450_original_map_and_manifest_bindings':True,'mixed17_18_complete_quarantine':True,'catalog_digest':catalog,'retained_raw_exact':445,'quarantined_raw_exact':5,'new_actual_reserved_and_recorded_ids':all_ids,'original138_events_exact':True,'all148_events_hashchain':True,'ledger_counts':counts,'mode_counts':dict(modes),'categories':categories,'public_pairs_exact':publicpair,'new_private_guard_copies_exact':True,'source_identity':ident,'included_files':len(current),'original_ledger_sha256':original_sha,'ledger_open_mode':'ro+immutable; no AuthoringLedger constructor','human_approval':False,'runtime_activation':False,'statistics_RUN':False}
OUT.joinpath('ledger-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps({'status':report['status'],'counts':counts,'source':ident}))
