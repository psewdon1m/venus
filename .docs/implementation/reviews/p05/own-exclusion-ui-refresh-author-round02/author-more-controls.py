from pathlib import Path
p=Path('apps/web/src/topic-own-exclusion-refresh.test.ts');s=p.read_bytes().decode()
s=s.replace("find(ui,'topic-allow-b').props.onChange({target:{checked:true}});ui=mountedSettings(i,ui);await tick();", "find(ui,'topic-allow-b').props.onChange({target:{checked:true}});find(ui,'topic-exclude-b').props.onChange({target:{checked:true}});ui=mountedSettings(i,ui);await tick();",1)
s=s.replace("draft:find(ui,'topic-allow-b').props.checked});}return results;", "draft:find(ui,'topic-allow-b').props.checked,excludedDraft:find(ui,'topic-exclude-b').props.checked});}return results;",1)
s=s.replace("{mode:'failed',reads:2,posts:1,draft:true},{mode:'ordinary',reads:1,posts:1,draft:true}","{mode:'failed',reads:2,posts:1,draft:true,excludedDraft:true},{mode:'ordinary',reads:1,posts:1,draft:true,excludedDraft:true}")
start=s.index(" it('a late old-identity command cannot trigger a new member refresh'");end=s.index(" it('an own committed exclusion",start)
extra=s[start:end].replace("a late old-identity command cannot trigger a new member refresh", "a failed late old-identity exclusion cannot refresh or erase the new member draft").replace("new Promise(resolve=>release=resolve)","new Promise((_resolve,reject)=>release=reject)").replace("release({});", "release(new ApiError('SERVICE_UNAVAILABLE'));")
s=s[:end]+extra+s[end:]
p.write_bytes(s.encode())
p=Path('apps/web/src/topic-settings.tsx');s=p.read_bytes().decode();s=s.replace("...held?.allow??[]", "...(held?.allow??[])");p.write_bytes(s.encode())
