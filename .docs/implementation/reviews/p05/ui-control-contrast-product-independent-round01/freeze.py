from pathlib import Path
import json,hashlib,datetime
p=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
handoff={
 'status':'PASS_STATIC_PRODUCT_SOURCE_ONLY_NATIVE_PENDING','writes':'COMPLETE_STOP',
 'author_index':'.docs/implementation/reviews/p05/ui-control-contrast-author-round01/INDEX.json',
 'author_index_sha256':'a5db598bb2ef54a8d4ab8a4b6bfaf22a369450519d153f13083f1d9c1c330ef5',
 'source_identity':'93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d',
 'included_files':1871,'unchanged_parent_paths':1869,
 'changed':['apps/web/src/style.css'],
 'added':['.docs/implementation/p05-source-revision-ui-control-contrast-01.json'],
 'findings':[],'own_audit_exit':0,'native_after_fix':'NOT_RUN',
 'next':'Root freeze/build A17, then original browser16/layout459; no actual UI acceptance from this packet.'}
(p/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files={f.relative_to(p).as_posix():{'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())} for f in sorted(p.iterdir()) if f.is_file() and f.name!='INDEX.json'}
index={'status':handoff['status'],'writes':'COMPLETE_STOP','created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
       'source_identity':handoff['source_identity'],'included_files':1871,'findings':[],
       'native_after_fix':'NOT_RUN','stage_PASS':False,'files':files}
b=(json.dumps(index,indent=2)+'\n').encode();(p/'INDEX.json').write_bytes(b)
print(json.dumps({'index':str(p/'INDEX.json'),'bytes':len(b),'sha256':sha(b),'children':len(files)}))
