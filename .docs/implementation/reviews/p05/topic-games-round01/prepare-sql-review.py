from pathlib import Path
import zipfile
r=Path.cwd();d=r/'.docs/implementation/reviews/p05/topic-games-round01'
with zipfile.ZipFile(r/'.docs/implementation/evidence/p05/topic-games-preflight-04/included-source.zip') as z:s=z.read('tests/p05-topic-games/integration.mjs').decode().replace('\r\n','\n')
prefix=s.split("try{\n await check('P05-TG-01'")[0]
assert len(prefix)<len(s)
prefix=prefix.replace("const expectedIds=Array.from({length:18},(_,i)=>'P05-TG-'+String(i+1).padStart(2,'0'));","const expectedIds=Array.from({length:5},(_,i)=>'REVIEW-'+String(i+1));")
prefix=prefix.replace("checks.push({id,status:'FAIL',error:error.message});throw error;","checks.push({id,status:'FAIL',error:error.message});console.log(JSON.stringify({id,status:'FAIL',error:error.message}));")
tail=s.split("}catch(error){process.exitCode=1;process.stderr.write(String(error?.stack??error)+'\\n');}\nfinally{")[1]
body="""try{
 await check('REVIEW-1',async()=>{await migrate(pool);await migrateGames(pool);await migratePrivateTopics(pool);await privateTopicSchemaProbe(pool);return {actual_pg:true,generation:3};});
 await games.bootGate();
 app=Fastify({logger:false});app.setErrorHandler((e,r,p)=>p.code(e instanceof DomainError?e.statusCode:500).send({code:e instanceof DomainError?e.code:'INTERNAL_ERROR'}));registerTopicGameRoutes(app,games,guards);origin=await app.listen({host:'127.0.0.1',port:0});rooms.options.origin=origin;
 const f=await fixture('questions',3),actor=f.plan.primary_member_id,body={request_id:randomUUID(),kind:'skip'};
 const original=await call(f,actor,roundPath(f)+'/response','POST',body);assert.equal(original.status,200,original.raw);
 await check('REVIEW-2',async()=>{const replay=await call(f,actor,roundPath(f)+'/response','POST',body);assert.equal(replay.status,200);assert.deepEqual(replay.body,original.body);return {same_scope_replay:true};});
 await check('REVIEW-3',async()=>{const path=base(f)+`/${f.game}/round/${randomUUID()}/response`,wrong=await call(f,actor,path,'POST',body);console.log(JSON.stringify({case:'wrong-round',actual_status:wrong.status,old_receipt_equal:JSON.stringify(wrong.body)===JSON.stringify(original.body)}));assert.notEqual(wrong.status,200,'Wrong round replay returned prior successful receipt');return {wrong_round_denied:true};});
 await check('REVIEW-4',async()=>{const path=base(f)+`/${randomUUID()}/round/${f.plan.round_id}/response`,wrong=await call(f,actor,path,'POST',body);console.log(JSON.stringify({case:'wrong-session',actual_status:wrong.status,old_receipt_equal:JSON.stringify(wrong.body)===JSON.stringify(original.body)}));assert.notEqual(wrong.status,200,'Wrong session replay returned prior successful receipt');return {wrong_session_denied:true};});
 await check('REVIEW-5',async()=>{const changed=await call(f,actor,roundPath(f)+'/response','POST',{...body,kind:'stop'});assert.equal(changed.status,409);assert.equal(changed.body.code,'IDEMPOTENCY_CONFLICT');return {body_change_denied:true};});
}catch(error){process.exitCode=1;process.stderr.write(String(error?.stack??error)+'\\n');}
finally{"""
new=prefix+body+tail
new=new.replace("'Exactly eighteen component cases must execute'","'Exactly five independent cases must execute'")
(d/'integration-review.mjs').write_text(new)
runner=(r/'.docs/implementation/evidence/p05/topic-games-preflight-04/runner.mjs').read_text()
runner=runner.replace("project='venus-topic-games-'+id,out=resolve('.artifacts/p05',project)","project='venus-topic-games-review-'+id,out=resolve('.docs/implementation/reviews/p05/topic-games-round01/runtime',project)")
runner=runner.replace("command('docker',['build','--target','runtime','--iidfile',join(out,'image-id.txt'),'-f','infra/venus/Dockerfile.p05-tests','.'],'build.txt');","writeFileSync(join(out,'image-id.txt'),'sha256:6f2c41b444f2789c99989a41c6228e5771654a5a307a58a675564c8a0f1059f6');")
runner=runner.replace("volumes:[{type:'bind',source:out,target:'/artifacts'}]","volumes:[{type:'bind',source:out,target:'/artifacts'},{type:'bind',source:resolve('.docs/implementation/reviews/p05/topic-games-round01/integration-review.mjs'),target:'/app/tests/p05-topic-games/integration.mjs',read_only:true}]")
runner=runner.replace("!==18","!==5").replace("if(after.identity!==before.identity||JSON.stringify(after.files)!==JSON.stringify(before.files))throw new Error('Included source changed');","/* Immutable image and pinned source are the review target; live checkout may evolve independently. */")
(d/'run-sql-review.mjs').write_text(runner)
print('Written independent SQL/HTTP producer and immutable image runner')
