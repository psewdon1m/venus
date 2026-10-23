from pathlib import Path
import datetime
r=Path.cwd();(r/'.history/agents/2026-10-21-p05-own-exclusion-refresh03-author.md').write_text('# Own exclusion refresh03 one-use draft handoff\n\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — Root ACK independent round02 newP2 stale preserved draft resurrects user-removed unsaved addition after failed Save then Refresh. Preserve02packet/revision; only settings.tsx/existing test and additive revision03. No API/native/producer writes. Add exact counterexample RED before minimal correction.\n',encoding='utf-8')
ind=(r/'.docs/implementation/reviews/p05/own-exclusion-refresh-independent-round02/controls.mjs').read_bytes().decode()
start=ind.index("await check('withdrawn unsaved addition")
code=ind[start:].split('String.raw`',1)[1].split('`,{b:false,posts:2,reads:3});',1)[0]
p=r/'apps/web/src/topic-own-exclusion-refresh.test.ts';s=p.read_bytes().decode();at=s.rfind('});')
test=" it('consumes preserved draft after a successful reload so later failed Save and Refresh cannot resurrect a removed addition',async()=>{expect(await scenario(String.raw`"+code+"`)).toEqual({b:false,posts:2,reads:3});});\n"
p.write_bytes((s[:at]+test+s[at:]).encode())
