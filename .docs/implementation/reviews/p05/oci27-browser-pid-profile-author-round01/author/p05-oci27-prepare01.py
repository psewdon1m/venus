from pathlib import Path
import shutil,json
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer26';c=p.with_name('p05-compatible-rollback-producer27');assert not c.exists();shutil.copytree(p,c);old='QRB_BOUND_ONLY_1';new='QRB_BOUND_ONLY_2_BROWSER_PIDS256'
active=['bound-profile.mjs','bootstrap.mjs','host-runner.mjs','driver.mjs','contract.mjs','resource-lease.mjs']
for name in active:
 f=c/name;s=f.read_bytes().decode();assert old in s;s=s.replace(old,new)
 if name=='bound-profile.mjs':
  needle="archive_copies:0});";assert s.count(needle)==1;s=s.replace(needle,"archive_copies:0,PID_limits:{browser:256,other_roles:128,native_free:32}});")
 if name=='host-runner.mjs':
  needle="assert.equal(r.HostConfig.PidsLimit,role==='native-free'?32:128)";assert s.count(needle)==1;s=s.replace(needle,"assert.equal(r.HostConfig.PidsLimit,role==='native-free'?32:role==='browser'?256:128)")
  needle="'--pids-limit','128','--log-driver','none','--mount'";assert s.count(needle)==1;s=s.replace(needle,"'--pids-limit',role==='browser'?'256':'128','--log-driver','none','--mount'")
 if name=='contract.mjs':
  needle="assert.equal(r.resource.profile.cap_mib,512);";assert s.count(needle)==1;s=s.replace(needle,"assert.deepEqual(r.resource.profile.PID_limits,{browser:256,other_roles:128,native_free:32});"+needle)
 f.write_bytes(s.encode())
for name in ['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json']:
 f=c/name;s=f.read_bytes().decode();assert old in s;f.write_bytes(s.replace(old,new).encode())
f=c/'PROFILE.json';v=json.loads(f.read_bytes());v['resource_profile']=new;v['PID_limits']={'browser':256,'other_roles':128,'native_free':32};v['resource_profile_revision_scope']='Prospective browser-only PID128 to256. All other resource numbers and fourteen controls unchanged; underlying native26 OS failure cause unknown.';f.write_text(json.dumps(v,indent=2)+'\n')
f=c/'RESOURCE_PROFILE27.md';f.write_text('''# Prospective OCI27 resource revision

QRB_BOUND_ONLY_2_BROWSER_PIDS256 replaces QRB_BOUND_ONLY_1 for this excluded component drill only. Browser create and inspect require PID256; every other ordinary role remains128, native-free32. Browser1536MiB/CPU1, all memory/CPU/tmpfs/RSS/cap/reserve/phase/work/whole/export/cleanup bounds and all14 functional/security controls remain unchanged. No resample/retry/APP change. Root ACK must explicitly authorize this exact new profile; old-profile ACK and false template fail closed. Historical copied author tests/proofs and predecessor descriptive notes retain their original profile as historical material, not OCI27 executions. Native26 startup exit134 uv_thread_create is observed; the underlying OS/cgroup cause and remedy effectiveness remain UNKNOWN. Fresh independent review and root authorization precede any actual27.
''')
print(c)
