from pathlib import Path
p=Path('apps/api/src/topic-games.ts');s=p.read_text(encoding='utf-8')
assert 'async dispatchRoundView(' not in s
before=Path('.artifacts/p05-round-view-author01/before');before.mkdir(parents=True,exist_ok=True)
for name in ['apps/api/src/topic-games.ts','apps/api/src/topic-game-routes.ts','apps/web/src/topic-games-panel.tsx','packages/contracts/src/topic-games.ts']:
 out=before/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(Path(name).read_bytes())
s=s.replace('TopicChatView,TopicGameSelfActions}', 'TopicChatView,TopicGameSelfActions,TopicRoundView,TopicRoundTarget}')
s=s.replace('interface ChatState {',"interface SelfActionsContext {g:TopicGameRow|null;r:{row:TopicRoundRow;data:TopicRoundData}|null;member:boolean;host:boolean;role:string|null|undefined;ordinary:boolean;l:Loaded|null;conv:ConversationLoaded|null;presence:((()=>void)&{deadline:number})|null}\ninterface ChatState {")
start=s.index(' async dispatchSelfActions(');end=s.index('\n private async chatReplayFence',start);original=s[start:end]
context=original[original.index('  const g='):original.index('  const fence=await this.finalAuth')]
value=original[original.index('  const now=this.now;'):original.index('  fence();enqueue(value);')]
value=value.replace('  const now=this.now;',"  const room=a.room.id,{g,r,member,host,role,l,conv,presence}=context,now=this.now;")
helper=''' private async selfActionsContext(c:pg.PoolClient,a:Auth):Promise<SelfActionsContext>{const room=a.room.id;
'''+context+'''  return {g,r,member,host,role,ordinary,l,conv,presence};
 }
 private ordinaryCurrent(context:SelfActionsContext){let {ordinary}=context;const {l,presence}=context;
  try{if(ordinary&&l){this.options.source.assertCurrent(l.map.pins);this.options.safety.assertCurrent(l.game.room_id,l.safety);presence?.();requireThat(!['pending','active'].includes(l.data.state)||this.privateTransportAvailable(l.snapshot,l.data),'PRIVATE_CHAT_UNAVAILABLE',404);}}
  catch(e){if(!(e instanceof DomainError||e instanceof EngineError))throw e;ordinary=false;}return ordinary;
 }
 private selfActionsValue(a:Auth,context:SelfActionsContext,ordinary:boolean):TopicGameSelfActions{
'''+value+'''  return value;
 }
 async dispatchSelfActions(room:string,session:string|undefined,enqueue:(v:TopicGameSelfActions)=>void){return this.rooms.transaction(async c=>{
  const a=await this.rooms.access(c,room,session,true,true);await this.protocol(c,room);const context=await this.selfActionsContext(c,a);
  const fence=await this.finalAuth(c,a,true);fence();const value=this.selfActionsValue(a,context,this.ordinaryCurrent(context));fence();enqueue(value);
 });}
'''
s=s[:start]+helper+s[end:]
# The bundle implementation is kept separate so the existing methods retain their external contracts.
bundle=Path('.artifacts/p05-round-view-author01/bundle-method.txt').read_text(encoding='utf-8')
position=s.index(' private async chatReplayFence');s=s[:position]+bundle+'\n'+s[position:]
p.write_text(s,encoding='utf-8')
