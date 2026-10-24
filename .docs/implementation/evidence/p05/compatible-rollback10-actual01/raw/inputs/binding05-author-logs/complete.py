from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
root=Path('.artifacts/p05-engine3-bundle-source01');p=root/'.artifacts/p05-compatible-rollback-producer05';work=Path(__file__).parent
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda path:json.loads(path.read_text(encoding='utf-8'))
write=lambda path,v:path.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
script=p/'author-rebind-controls.mjs'
text=script.read_text(encoding='utf-8').replace('previous03-BINDING.json.bytes','historical04-BINDING.json.bytes').replace('historical C454','historical source732')
old="assert.deepEqual(maps.maps.B.files,read(join(folder,'pinned-inputs/previous03-actual-image-maps.json.bytes')).maps.B.files);"
new="for(const key of ['A','B']){const receipt=read(join(folder,`pinned-inputs/current-${key}3-receipt.json.bytes`));assert.equal(Object.keys(maps.maps[key].files).length,76);for(const[k,h]of Object.entries(maps.maps[key].files))assert.equal(receipt.image_files_sha256[k],h);assert.equal(receipt.image,binding.images[key]);assert.equal(receipt.build_metadata_absent,true);}"
assert old in text;text=text.replace(old,new).replace('expanded file hash/images/A64/B64 and unchangedB76 exact','expanded file hash/images/A64/B64 and current A3/B3 full76 actual receipt anchors exact')
old="assert.equal(current,old.per_image_compiled.A['apps/api/dist/topic-games.js']);"
assert old in text;text=text.replace(old,"assert.equal(current,read(join(folder,'pinned-inputs/current-A3-receipt.json.bytes')).compiled_files['apps/api/dist/topic-games.js']);")
script.write_text(text,encoding='utf-8')
b=read(p/'BINDING.json');profile=read(p/'PROFILE.json')
readme=f'''# OCI05 author: engine3 same-policy live14 binding

AUTHOR_READY_FOR_NONAUTHOR_REVIEW_NOT_RUN. Root ACK is false. This author also wrote the A3 bundled application and cannot accept that change or this binding.

A3 is immutable materialized source `{b['source_identity']}` /1835 in `.artifacts/p05-engine3-bundle-source01`, image `{b['images']['A']}`. Genuine B3 is prebundle source `{b['prior_source_identity']}` /1830, image `{b['images']['B']}`. Both run RE-1.P05-TOPIC-3 / ROOM-TOPIC-2. All engine compiled files and seven migrations are exact across A/B; the two changed API compiled files are topic-games.js and topic-game-routes.js, with the actual served UI independently pinned per image. Full76 image anchors per A/B derive from actual root276/272 receipt bytes. This is no whole-image equivalence assertion.

The accepted02 method23 modules and original14 controls are unchanged, including the export-fault correction. Live D on A1 must be revoked by actual B2 bootGate before listen; fresh bilateral E on B2 must be revoked by actual A3 bootGate. Strong D/E is not replaced by old-engine2 unsupported-snapshot abort. Functional flagON permits the synthetic live14 drill; operational fallback is separately quiesced with new startsOFF. B3 already contains the earlier action-timing/poll/cache corrections but retains separate private-read freshness limits. It is not known-good GA and is not presented as a fully passed browser application.

## Execution prerequisites

No build, Docker, DB, browser or functional RUN was performed by this author binding. Inert describe, unauthorized ACK refusal, exact-source inventory and nine binding controls are the only new execution checks. Historical finite173 and all earlier failed controls remain source-qualified carry, not new actual acceptance. Current r4 has owner U019 provisional local-pilot acceptance; synthetic fixture cards in this unchanged drill do not constitute multilingual review or production approval.

Unchanged source-proof resolves workspace two parents above producer, hence producer05 deliberately lives inside the materialized A3 `.artifacts`. Excluded `.venv` junction points to the existing host Python environment. Source remains exact1835. Independent current A3 application and producer review indexes must be copied byte-exact into materialized A3 `.docs/implementation/reviews/p05/` before authorized run; this path restriction belongs to the unchanged driver. Do not substitute author reports for independent PASS. The external ACK template remains NOT_AUTHORIZED with null review/index pins. Root supplies exact review paths/hashes and producer INDEX only after acceptance.

Run from materialized A3, only after root ACK:

```powershell
& 'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe' --max-old-space-size=192 .artifacts/p05-compatible-rollback-producer05/driver.mjs --run --ack=C:/ABSOLUTE/EXTERNAL/ROOT_ACK.json
```

## Unchanged limits and failure policy

QRB_BOUND_ONLY_1 retains root900s/useful780s/phase120s/export30s/cleanup60s, original512MiB ceiling, native380+host96=476MiB conservative allocation, host/native reserve10GiB, no ports/external network, exact ownership and native readonly/IPC/quota checks. It does not claim the superseded advancing2s Windows guard. Host heap192MiB/sampledRSS256MiB is not an OS hardRSS cap. Images/daemon/VHD are excluded, scratch and SHM included. PG UID999, private password GID999 and keeper/mount proofs remain actual runtime prerequisites; a Windows cold check cannot establish POSIX behavior.

First typed failure, export_error and cleanup disposition stay authoritative. Failed export stops PG while retaining native keeper/volumes for diagnosis, and cannot become PASS. Ordinary postfault writes do not substitute for bounded terminal fallback. Actual14 and final clean-source P05 remain pending. Prior snapshots/FAILs remain immutable.
'''
(p/'README.md').write_text(readme,encoding='utf-8')
(p/'REBIND.md').write_text('''# Additive operational05 binding only

Predecessor04 is preserved at root .artifacts/p05-compatible-rollback-producer04, INDEX10659a29e2d60f90dfe952d991a29435f20e51f059dd6b4227a18e1b989df666. Its accepted method23 bytes match this producer. Overwritten04 authority files are preserved as pinned-inputs/historical04-*.bytes. Included source is genuine materialized A3; B is genuine prebundle B3. Previous04 engine2 bindings cannot be silently reused with engine3 snapshots. Full A/B root receipts,76 anchors each, dependency copies and compatibility deltas are explicit.

No runtime method, fixture, resource threshold, clock, live14 assertion or cleanup condition changes. author-rebind-controls is a binding-only nine-control model; no ACK or actual permission is issued. Existing finite results retain their original provenance. Independent application and method review, copied exact review indexes within materialized workspace, fresh external root ACK and one actual live14 run remain pending.
''',encoding='utf-8')
write(p/'AUTHOR_CHECKS.json',{'status':'AUTHOR_BINDING05_CHECKPOINT_NOT_ACCEPTANCE','new_checks':'See cold-checks.json and author-rebind-controls-result.json after execution','method23':'Exact accepted02 runtime bytes; existing finite controls carried without repeat','actual_RUN':False,'Docker_commands':0,'root_ACK':False,'non_author_review_required':True})
old=read(p/'pinned-inputs/historical04-included-inputs.json.bytes');new=read(p/'included-inputs.json');delta=[{'path':k,'old':old.get(k),'new':new.get(k)}for k in sorted(set(old)|set(new))if old.get(k)!=new.get(k)]
write(p/'predecessor-source-delta.json',{'from':'operational04 source732','to':b['source_identity'],'count':len(delta),'files':delta,'runtime_method_changes':0})
(p/'predecessor-source-delta.patch').write_text('Binding-only source map differences; no product patch is applied by this producer.\n'+''.join(f"{r['path']}\n- {r['old']}\n+ {r['new']}\n" for r in delta),encoding='utf-8')
at=datetime.now(timezone.utc).isoformat()
with Path('.history/agents/2026-10-20-p05-oci05-binding-author.md').open('a',encoding='utf-8')as f:f.write(f'\n- {at} UTC - Copied immutable04 into excluded A3 workspace; verified140 old hashes, root276/272 receipts, all76 A/B anchors and exact23 method modules. Rebound engine3 source/image/maps/profile/unauthorized ACK only; adjusted nine binding-only controls and replaced current authority prose. Historical04 files preserved. No Docker/RUN. Cold checks next.\n')
print(json.dumps({'at_utc':at,'source_delta':len(delta),'producer':str(p)}))
