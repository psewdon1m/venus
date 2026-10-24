from pathlib import Path
p=Path('apps/api/src/topic-round-view.test.ts');t=p.read_text(encoding='utf-8')
old='Math.min(invitation.active_until!,action.deadline)';assert old in t;t=t.replace(old,'Math.min(data.invitation.active_until??data.invitation.deadline,data.action?.active_until??data.action?.deadline??Infinity)')
old='const reconcile=vi.fn(async()=>true);Object.assign(f.games,{conversation:async()=>null,reconcile});await f.run();';assert old in t;t=t.replace(old,'const reconcile=vi.fn(async()=>true);Object.assign(f.games,{conversation:async()=>null,reconcile});f.setNow(45000);await f.run();')
marker=" it('rejects a stale requested session or round"
extra=" it('still fails closed when a chosen TD side is missing its expected projection',async()=>{const f=fixture();storage.values.delete('projection:alice');await f.run();expect(f.packet).toMatchObject({target:null,conversation:null,chat:null,own:{round_actions:{choose_truth:false,choose_dare:false,accept_action:false,finish:false},conversation_actions:{chat:false,respond_topic:false}}});});\n"
assert marker in t;t=t.replace(marker,extra+marker);p.write_text(t,encoding='utf-8')
