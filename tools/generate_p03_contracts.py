"""Additive P03 websocket snapshots and host abort; original P00 bytes remain immutable."""
import hashlib
import json
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'.docs/contracts/api.v1.openapi.json';api=json.loads(path.read_text('utf-8'));base={'path':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
schemas=api['components']['schemas'];defs={}
def include(name):
    if name in defs:return
    value=schemas[name];defs[name]=value
    def walk(x):
        if isinstance(x,dict):
            if '$ref' in x:include(x['$ref'].split('/')[-1])
            for v in x.values():walk(v)
        if isinstance(x,list):
            for v in x:walk(v)
    walk(value)
include('GameView')
def event(kind,stream,payload,private=False):
    fields={'schema':{'const':1},'event_id':{'type':'string','format':'uuid'},'room_id':{'type':'string','format':'uuid'},'room_rev':{'type':'integer','minimum':0,'maximum':9007199254740991},'stream':{'const':stream},'stream_rev':{'type':'integer','minimum':0,'maximum':9007199254740991},'type':{'const':kind},'server_time':{'type':'string','format':'date-time'},'audience':{'const':'member' if private else 'room'},'payload':payload}
    if private:fields['target_member_id']={'type':'string','format':'uuid'}
    return dict(type='object',additionalProperties=False,required=list(fields),properties=fields)
clear=dict(type='object',additionalProperties=False,required=['session_id','round_id','private_available'],properties={'session_id':{'type':'string','format':'uuid'},'round_id':{'type':'string','format':'uuid'},'private_available':{'const':False}})
events={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://venus.example.invalid/schemas/p03.events.json','title':'P03 additive safe game snapshot and own private-clear events','x-base-contract':base,'x-revision-semantics':'game.snapshot stream_rev=committed room revision (monotonic across game sessions); payload.game_rev=session CAS. Private stream_rev is per-room authenticated member monotonic across sessions.','oneOf':[event('game.snapshot','game',{'$ref':'#/$defs/GameView'}),event('game.private_cleared','private',clear,True)],'$defs':json.loads(json.dumps(defs).replace('#/components/schemas/','#/$defs/'))}
params=[dict(name=n,**{'in':'path'},required=True,schema={'type':'string','format':'uuid'}) for n in ['room_id','session_id']]
operation=dict(operationId='host_abort_game',summary='Host terminates the game and revokes private scopes; does not accept for another actor',security=[{'RoomSession':[]}],parameters=params,**{'x-authorization':'host','x-origin-check-required':True,'x-csrf-required':True,'x-safety-no-stale-revision':True},requestBody={'required':True,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/SafetyStop'}}}},responses={status:dict(description=description,content={'application/json':{'schema':{'$ref':'#/components/schemas/'+name}}}) for status,description,name in [('200','Aborted or already terminal','MutationResult'),('default','Sanitized error','Error')]})
addon={'openapi':'3.1.0','info':{'title':'P03 additive host game abort','version':'P03-1'},'x-base-contract':base,'x-runtime-schema':{'core_generation':1,'engine_generation':1,'readiness':'Both independently checksummed streams and all required tables must be ready'},'paths':{'/api/v1/rooms/{room_id}/game/{session_id}/abort':{'post':operation}},'components':{'schemas':{k:schemas[k] for k in ['SafetyStop','MutationResult','Error']},'securitySchemes':{'RoomSession':{'type':'apiKey','in':'cookie','name':'venus_room_session'}}}}
for name,value in [('p03.events.schema.json',events),('p03.additions.openapi.json',addon)]:
    target=ROOT/'.docs/contracts'/name;data=json.dumps(value,ensure_ascii=False,indent=2)+'\n'
    if '--check' in sys.argv:
        if not target.exists() or target.read_text('utf-8')!=data:raise SystemExit('Stale P03 contract: '+name)
    else:target.write_text(data,encoding='utf-8')
