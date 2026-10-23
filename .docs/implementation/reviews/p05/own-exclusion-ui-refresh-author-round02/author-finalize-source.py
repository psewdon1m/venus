from pathlib import Path
p=Path('apps/web/src/topic-settings.tsx');s=p.read_bytes().decode()
s=s.replace("loadedBy=useRef<unknown>(null)","loadedBy=useRef<(()=>Promise<void>)|null>(null)")
s=s.replace(" useEffect(()=>{draft.current={allow,excluded,loaded:record!==null};}"," // Preserve only unsaved additions; authoritative saved permissions are never replayed from a stale form.\r\n useEffect(()=>{draft.current={allow:record?allow.filter(id=>!record.own.allow_topic_ids.includes(id)):[],excluded,loaded:record!==null};}")
p.write_bytes(s.encode())
p=Path('apps/web/src/topic-own-exclusion-refresh.test.ts');s=p.read_bytes().decode()
old="const api=apiFor('a',state,reads,posts,async()=>{state.a={...state.a,rev:2,safety_revision:2,allow_topic_ids:[],exclude_topic_ids:['a']};throw new ApiError('TOPIC_SAFE_POOL_EXHAUSTED');});"
new="const api=apiFor('a',state,reads,posts,async(path,body)=>{if(path.endsWith('/private-topics'))return {...state.a,rev:3,allow_topic_ids:body.allow_topic_ids};state.a={...state.a,rev:2,safety_revision:2,allow_topic_ids:[],exclude_topic_ids:['a']};throw new ApiError('TOPIC_SAFE_POOL_EXHAUSTED');});"
assert s.count(old)==1;s=s.replace(old,new)
old="return {a:find(ui,'topic-allow-a').props.checked,disabledA:find(ui,'topic-allow-a').props.disabled,b:find(ui,'topic-allow-b').props.checked,excludeC:find(ui,'topic-exclude-c').props.checked,reads:reads.a,posts:posts.length};"
new="const view={a:find(ui,'topic-allow-a').props.checked,disabledA:find(ui,'topic-allow-a').props.disabled,b:find(ui,'topic-allow-b').props.checked,excludeC:find(ui,'topic-exclude-c').props.checked,reads:reads.a,posts:posts.length};treeFind(ui.tree,node=>node.type==='form').props.onSubmit({preventDefault(){}});await settle();return {...view,allowedSubmitted:posts[1].body.allow_topic_ids,excludedSubmitted:posts[1].body.exclude_topic_ids,postsAfterExplicitSave:posts.length};"
assert s.count(old)==1;s=s.replace(old,new)
s=s.replace("{a:false,disabledA:true,b:true,excludeC:true,reads:2,posts:1}","{a:false,disabledA:true,b:true,excludeC:true,reads:2,posts:1,allowedSubmitted:['b'],excludedSubmitted:['a'],postsAfterExplicitSave:2}")
p.write_bytes(s.encode())
