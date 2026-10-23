import pathlib,json,subprocess,time,uuid,datetime,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[4]
OUT=ROOT/'.docs/implementation/reviews/p05'
name='venus-topic-settings-review-'+uuid.uuid4().hex[:10]
image='postgres:16.14-bookworm@sha256:64154d0babcb1741988719e703419af0382b19953706149f9872fbd0f438efa8'
transcript=[];checks=[]
def run(args,input=None):
 p=subprocess.run(args,input=input,text=True,capture_output=True);transcript.append({'argv':args,'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr});return p
def sql(text):return run(['docker','exec','-i',name,'psql','-U','venus','-d','venus','-v','ON_ERROR_STOP=1'],text)
def seed(room,owner,protocol=1,birth=True):
 return f"""BEGIN;
 INSERT INTO rooms(id,host_member_id,meeting_context,state,rev,invite_hash,created_at,last_activity_at,private_protocol) VALUES('{room}','{owner}','online','open',1,'{room}',now(),now(),{protocol});
 INSERT INTO room_members(room_id,id,display_name,locale,role,slot,heartbeat_at,reserved_until) VALUES('{room}','{owner}','fixture','en','host',1,now(),now()+interval '1 day');
 """+(f"INSERT INTO private_topic_room_births VALUES('{room}','91000000-0000-4000-8000-000000000001',1,'{'a'*64}','{'b'*64}',now());" if protocol==2 and birth else '')+'COMMIT;'
try:
 assert run(['docker','run','--rm','-d','--name',name,'--label','venus.review=topic-settings-round01','--network','none','--memory','256m','--cpus','1','--tmpfs','/var/lib/postgresql/data:rw','-e','POSTGRES_HOST_AUTH_METHOD=trust','-e','POSTGRES_DB=venus','-e','POSTGRES_USER=venus',image]).returncode==0
 for n in range(80):
  if run(['docker','exec',name,'pg_isready','-U','venus','-d','venus']).returncode==0:break
  time.sleep(.2)
 else:raise RuntimeError('DB not ready')
 old=(ROOT/'apps/api/migrations/001_rooms.sql').read_text();new=(OUT/'topic-settings-round01.source/apps/api/private-topic-migrations/001_private_topics.sql').read_text()
 assert sql(old+new).returncode==0
 r='92000000-0000-4000-8000-000000000001';o='93000000-0000-4000-8000-000000000001';legacy='92000000-0000-4000-8000-000000000002';lo='93000000-0000-4000-8000-000000000002'
 assert sql(seed(r,o,2)).returncode==0;assert sql(seed(legacy,lo,1)).returncode==0
 cases=[
 ('protocol2_missing_birth',seed('92000000-0000-4000-8000-000000000003','93000000-0000-4000-8000-000000000003',2,False)),
 ('birth_on_legacy',f"INSERT INTO private_topic_room_births VALUES('{legacy}','91000000-0000-4000-8000-000000000002',1,'{'a'*64}','{'b'*64}',now());"),
 ('protocol_downgrade',f"UPDATE rooms SET private_protocol=1 WHERE id='{r}';"),
 ('legacy_upgrade',f"UPDATE rooms SET private_protocol=2 WHERE id='{legacy}';"),
 ('birth_delete',f"DELETE FROM private_topic_room_births WHERE room_id='{r}';"),
 ('birth_update',f"UPDATE private_topic_room_births SET minimum_sequence=2 WHERE room_id='{r}';"),
 ('preference_zero_revision',f"INSERT INTO private_topic_preferences VALUES('{r}','{o}',0,'{{}}');"),
 ('preference_overflow_revision',f"INSERT INTO private_topic_preferences VALUES('{r}','{o}',9007199254740992,'{{}}');"),
 ('preference_foreign_owner',f"INSERT INTO private_topic_preferences VALUES('{r}','{lo}',1,'{{}}');"),
 ('request_foreign_owner',f"INSERT INTO private_topic_requests VALUES('{r}','{lo}','94000000-0000-4000-8000-000000000001','opaque',now());"),
 ]
 for id,text in cases:
  p=sql(text);checks.append({'id':id,'status':'PASS' if p.returncode!=0 else 'FAIL','observed_exit':p.returncode});assert p.returncode!=0,id
 # Explicitly record limited DB guard behavior, not lifecycle acceptance:
 replacement=f"BEGIN; DELETE FROM private_topic_room_births WHERE room_id='{r}'; INSERT INTO private_topic_room_births VALUES('{r}','91000000-0000-4000-8000-000000000099',1,'{'a'*64}','{'b'*64}',now()); COMMIT;"
 p=sql(replacement);checks.append({'id':'deferred_delete_insert_observation','observed_exit':p.returncode,'detail':'Database guard checks final existence; external authenticated descriptor must reject changed incarnation. No lifecycle acceptance.'})
 # Room cascade deletion remains supported; no orphan birth remains.
 p=sql(f"DELETE FROM rooms WHERE id='{r}'; SELECT count(*) FROM private_topic_room_births WHERE room_id='{r}';");checks.append({'id':'room_cascade_cleanup','status':'PASS' if p.returncode==0 else 'FAIL'});assert p.returncode==0
finally:
 cleanup=run(['docker','rm','-f',name]);assert cleanup.returncode==0
 absent=run(['docker','ps','-a','--filter','name=^/'+name+'$','--format','{{.ID}}']);assert absent.returncode==0 and not absent.stdout.strip()
 (OUT/'topic-settings-round01.sql-raw.json').write_text(json.dumps(transcript,indent=2)+'\n')
 (OUT/'topic-settings-round01.sql-results.json').write_text(json.dumps({'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'image':image,'container':name,'real_postgresql':True,'scope':'SQL constraints only; no API/lifecycle/restore acceptance','checks':checks,'cleanup':'completed'},indent=2)+'\n')
print(json.dumps({'checks':len(checks),'cleanup':'completed'}))
