"""Restore-image IDs only: existing A21 UI01/OCI32 -> UI02/OCI33. No Docker."""
from pathlib import Path
import hashlib
import json
import shutil
import difflib

R = Path('C:/.projects/venus')
S = R / '.artifacts/p05-pilot-bundle-source18'
A = R / '.docs/implementation/reviews/p05/recovered-images-gates-author-round01'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text())
write = lambda p, x: p.write_text(json.dumps(x, indent=2) + '\n', encoding='utf-8')
paths = [R / '.artifacts/p05-pilot-bundle-image-binding19/receipt.json',
         R / '.artifacts/p05-pilot-bundle-production-image-binding19/receipt.json',
         R / '.artifacts/p05-pilot-prebundle-image-binding-recovery03/receipt.json']
expected = ['25e47b55a00cba8325974b2a97a1b4e207eb1621f0e1a049969d8083c60d4195',
            '9ab8646c288d3286df3b32379a59c5642b16bc5ee52c9076555da1118d181865',
            '85f2a6dd19ae71dee702484c4f38b7edf294fbfca793e0f2d5bdc064a3a080d3']
for p, h in zip(paths, expected):
    assert sha(p) == h
test, prod, b4 = [read(p) for p in paths]
parents = [read(R / '.artifacts/p05-pilot-bundle-image-binding18/receipt.json'),
           read(R / '.artifacts/p05-pilot-bundle-production-image-binding18/receipt.json'),
           read(R / '.artifacts/p05-pilot-prebundle-image-binding02/receipt.json')]
for new, old, count in zip([test, prod, b4], parents, [299, 122, 278]):
    assert new['image_files_sha256'] == old['image_files_sha256']
    assert len(new['image_files_sha256']) == count
    assert new['source_identity'] == old['source_identity'] and new['included_files'] == old['included_files']
    assert new['probe_exit_code'] == new['app_imports'] == new['build_observed_exit'] == 0
    assert new['probe_cleanup'] == 'AUTO_REMOVED'
assert test['source_identity'] == '4d9d822d9d45e2ac1dca6589c49cdab34a65effaf4e2ce90efa16cff1f6729da'
assert test['included_files'] == 1875
A.mkdir(exist_ok=False)
old_ui, ui = S / '.artifacts/p05-v2-layout-producer-a21-01', S / '.artifacts/p05-v2-layout-producer-a21-02'
old_oci, oci = S / '.artifacts/p05-compatible-rollback-producer32', S / '.artifacts/p05-compatible-rollback-producer33'
shutil.copytree(old_ui, ui)
shutil.copytree(old_oci, oci)
before = (old_ui / 'run.mjs').read_bytes()
assert before.count(b'p05-v2-layout-producer-a21-01') == 1
after = before.replace(b'p05-v2-layout-producer-a21-01', b'p05-v2-layout-producer-a21-02')
(ui / 'run.mjs').write_bytes(after)
assert after.replace(b'p05-v2-layout-producer-a21-02', b'p05-v2-layout-producer-a21-01') == before
(A / 'run.mjs.diff').write_text(''.join(difflib.unified_diff(before.decode().splitlines(True), after.decode().splitlines(True))))
assert all(p.read_bytes() == (ui / p.name).read_bytes() for p in old_ui.glob('*.mjs') if p.name != 'run.mjs')
oci_modules = {p.relative_to(old_oci).as_posix(): sha(p) for p in old_oci.rglob('*.mjs')}
assert len(oci_modules) == 40 and all(sha(oci / p) == h for p, h in oci_modules.items())
ub = read(ui / 'binding.json')
ub.update(image=test['image'], root_build_receipt_path=str(paths[0]), root_build_receipt_sha256=sha(paths[0]))
write(ui / 'binding.json', ub)
with (ui / 'DESIGN.md').open('a', encoding='utf-8') as f:
    f.write('\nImage restoration metadata only: A21 source4d9d/1875 is unchanged; recovered testimagef008 replaces missing974. '
            'All299 observed source/compiled/web bytes exact; only run dirname literal changes runtime. '
            'All26 otherMJS/oracles/resources/budgets exact A21-01. Original preAPP NoSuchImage environmentFAIL preserved; '
            'fresh9same-runtime A21 shards459/324/135 stillrequired, no new APPfix or previousnativecredit. RootACKfalse/resource07pending.\n')
ua = read(ui / 'ROOT_RUN_ACK.json')
ua.update(root_run_ack=False, independent_producer_review='PENDING', independent_review_path='.docs/implementation/reviews/p05/PENDING/INDEX.json',
          independent_review_index_sha256='0' * 64, producer_runtime_digest='0' * 64, image=test['image'], issued_at=None)
ua['shared_resource_authority'] = {'status': 'PENDING_ROOT_RESOURCE07_AND_ARCHIVE_RECEIPT_AND_FRESH_PRELAUNCH', 'path': None, 'sha256': None}
write(ui / 'ROOT_RUN_ACK.json', ua)
ob = read(oci / 'BINDING.json')
ob['previous_rebuild_binding'] = {'images': dict(ob['images']), 'parent32_INDEX_sha256': sha(old_oci / 'INDEX.json')}
ob['images'] = {'A': test['image'], 'B': b4['image']}
ob['operational_binding_revision'] = 'OCI33_RESTORED_IMAGES_EXACT_A21_B4_BYTES_NOT_RUN'
maps = read(oci / 'actual-image-maps.json')
maps['images'] = ob['images']
maps['status'] = 'ROOT_RESTORED_IMAGE_BYTES_A21_B4_CRITICAL_81_78_NATIVE33_PENDING'
for phase, receipt, count in [('A', test, 81), ('B', b4, 78)]:
    assert len(maps['maps'][phase]['files']) == count
    assert all(receipt['image_files_sha256'][p] == h for p, h in maps['maps'][phase]['files'].items())
write(oci / 'actual-image-maps.json', maps)
ob['expanded_actual_image_UI_migration_maps_sha256'] = sha(oci / 'actual-image-maps.json')
write(oci / 'BINDING.json', ob)
for name, receipt, p in [('FULL299-PROBE19.json', test, paths[0]), ('FULL278-B4-RECOVERY03.json', b4, paths[2])]:
    write(oci / name, {'status': 'FULL_IMAGE_PROBE_PROOF_NOT_RUNTIME_EXPECTED_MAP', 'image': receipt['image'],
        'source_identity': receipt['source_identity'], 'receipt_path': str(p), 'receipt_sha256': sha(p),
        'files': receipt['image_files_sha256'], 'file_count': len(receipt['image_files_sha256'])})
write(oci / 'OPERATIONAL_REVISION33.json', {'status': 'RESTORED_IDS_ONLY_PENDING_INDEPENDENT_NO_NATIVE',
    'source_identity': test['source_identity'], 'included_files': 1875, 'images': ob['images'],
    'source_unchanged': True, 'A299_B278_all_pins_exact_parent': True, 'A81_B78_expected_maps_unchanged': True,
    'all40MJS_rawexact32': True, 'parent32_INDEX_sha256': sha(old_oci / 'INDEX.json'),
    'fresh_original14_required': True, 'native_runs': 0, 'root_ack': False})
oa = read(oci / 'ROOT_RUN_ACK_TEMPLATE.json')
oa.update(status='NOT_AUTHORIZED', root_run_ack=False, images=ob['images'], producer_index_sha256=None,
          independent_review_index=None, independent_review_index_sha256=None, application_source_review_index=None,
          application_source_review_index_sha256=None, expanded_image_map_sha256=sha(oci / 'actual-image-maps.json'))
write(oci / 'ROOT_RUN_ACK_TEMPLATE.json', oa)
write(A / 'OCI33-INACTIVE-ACK.json', oa)
write(A / 'INPUT-PINS.json', {'receipts': [{'path': str(p), 'sha256': sha(p)} for p in paths],
    'parent_binding_review': '5a8ec9c894b2a33c1963d2fd704d4c2b2244e43c17393e38a3371af087141498',
    'UI_parent_INDEX': sha(old_ui / 'INDEX.json'), 'OCI_parent_INDEX': sha(old_oci / 'INDEX.json')})
write(A / 'EXACT-BYTE-CORRESPONDENCE.json', {'A299': True, 'production122': True, 'B278': True,
    'UI_run_literal_inverse_exact': True, 'other26UI_MJS_exact01': True, 'all40OCI_MJS_exact32': oci_modules,
    'A_runtime81_B_runtime78_hashes_exact_parent': True, 'APP_source_change': False, 'native_tests': 0})
shutil.copyfile(Path(__file__), A / 'prepare.py')
print(json.dumps({'status': 'RESTORATION_METADATA_PREPARED_PENDING_COLD_BINDING_AND_FREEZE', 'Docker': 0}))
