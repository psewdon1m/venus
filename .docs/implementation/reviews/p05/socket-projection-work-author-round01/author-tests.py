from pathlib import Path
import datetime
r=Path.cwd();(r/'.history/agents/2026-10-21-p05-socket-projection01-author.md').write_text('# V2 unused socket projection correction\n\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — Root ACK4production paths rooms.ts/room-routes.ts/room-games.ts/topic-games.ts; internal defaultfull V2-only options skip unused publicprojection, heartbeat nochild with all credential/offer/finaloriginalexpiry fences intact. Poll privateprepare/refs maintained. No authcache/timers/DBpool/maintenance change. Sourceaudit3aaf21cf causeWS_FAILURE unproved. Add existing-style path regressions then RED before code.\n',encoding='utf-8')
p=r/'apps/api/src/room-games.test.ts';s=p.read_bytes().decode();at=s.rfind('});');s=s[:at]+''' for(const protocol of [1,2])it(`internal private-only projection option forwards only to V2, protocol${protocol}`,async()=>{
  const f=fixture(protocol);await f.router.socketView(f.c,'room','member','en',0,{includePublicGame:false});
  expect((protocol===2?f.topics:f.legacy).socketView).toHaveBeenCalledWith(...(protocol===2?[f.c,'room','member','en',0,{includePublicGame:false}]:[f.c,'room','member','en',0]));
 });
'''+s[at:];p.write_bytes(s.encode())
p=r/'apps/api/src/room-socket-poll.test.ts';s=p.read_bytes().decode();s=s.replace("expect(f.service.socketState).toHaveBeenCalledTimes(2);","expect(f.service.socketState).toHaveBeenCalledTimes(2);\n   expect(f.service.socketState).toHaveBeenNthCalledWith(1,expect.anything(),false,0,{projection:'private'});\n   expect(f.service.socketState).toHaveBeenNthCalledWith(2,expect.anything(),false,0,{projection:'private'});",1);p.write_bytes(s.encode())
