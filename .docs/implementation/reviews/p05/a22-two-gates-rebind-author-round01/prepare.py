"""One-off A21 metadata rebind of accepted UI04 and OCI31; no Docker or APP edits."""
from pathlib import Path
import datetime
import difflib
import hashlib
import json
import shutil
import subprocess

R = Path('C:/.projects/venus')
S17 = R / '.artifacts/p05-pilot-bundle-source18'
S18 = R / '.artifacts/p05-pilot-bundle-source19'
AUTHOR = R / '.docs/implementation/reviews/p05/a22-two-gates-rebind-author-round01'
NODE = 'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
SOURCE = '1f73c9e7bb6c9cf8c56286eee4a269009dadc5307d6441fe50a461fa55589037'
TEST_RECEIPT = R / '.artifacts/p05-pilot-bundle-image-binding20/receipt.json'
PROD_RECEIPT = R / '.artifacts/p05-pilot-bundle-production-image-binding20/receipt.json'
FREEZE = R / '.artifacts/p05-pilot-bundle-source-freeze19.json'


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def read(p):
    return json.loads(p.read_text())


def write(p, value):
    p.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


assert sha(TEST_RECEIPT) == 'a27cc00edf2d171bca3b8341d4613d3fd492c9902f902ae30d132cd150562c66'
assert sha(PROD_RECEIPT) == '270d8edae8dedbb02a972a8747c4ed32dedf4bb0a73104a16b119ad3b670c004'
test, prod, freeze = read(TEST_RECEIPT), read(PROD_RECEIPT), read(FREEZE)
assert freeze['identity'] == SOURCE and freeze['included_files'] == 1876
assert freeze['git_source_commit'] == 'f6462b9a21c5cb63165194e514c542d5699df440'
for receipt in [test, prod]:
    assert receipt['source_identity'] == SOURCE and receipt['included_files'] == 1876
    assert receipt['probe_exit_code'] == receipt['build_observed_exit'] == receipt['app_imports'] == 0
    assert receipt['probe_cleanup'] == 'AUTO_REMOVED'
    assert len(receipt['migration_files']) == 7 and len(receipt['pg_dependency_files']) == 2
assert len(test['compiled_files']) == 69 and len(prod['compiled_files']) == 67
assert len(test['image_files_sha256']) == 299 and len(prod['image_files_sha256']) == 122
assert prod['source_git_commit'] == freeze['git_source_commit']
old_test = read(R / '.artifacts/p05-pilot-bundle-image-binding19/receipt.json')
old_prod = read(R / '.artifacts/p05-pilot-bundle-production-image-binding19/receipt.json')
for old, new in [(old_test, test), (old_prod, prod)]:
    for key in ['compiled_files', 'migration_files', 'pg_dependency_files']:
        assert new[key] == old[key], key
    assert {p: h for p, h in old['web_dist_files'].items() if p.endswith('.css')} == {
        p: h for p, h in new['web_dist_files'].items() if p.endswith('.css')}
assert test['web_dist_files'] == prod['web_dist_files']
assert test['image'] == 'sha256:9a3fb7d0a424e78518d1c5dc937175d402c8d39160c698164eb7c52d7253f2ed'
assert prod['image'] == 'sha256:2279140a04ca839b3911f0b0cee9d7e05dc81e2beccabf100adc560bccd23915'

AUTHOR.mkdir(exist_ok=False)
old_layout = S17 / '.artifacts/p05-v2-layout-producer-a21-02'
layout = S18 / '.artifacts/p05-v2-layout-producer-a22-01'
old_oci = S17 / '.artifacts/p05-compatible-rollback-producer33'
oci = S18 / '.artifacts/p05-compatible-rollback-producer34'
shutil.copytree(old_layout, layout)
shutil.copytree(old_oci, oci)
inverse = {}
for name, before, after in [
    ('run.mjs', 'p05-v2-layout-producer-a21-02', 'p05-v2-layout-producer-a22-01'),
    ('runner-policy.mjs', "assert.equal(binding.included_files,1875);", "assert.equal(binding.included_files,1876);")
]:
    original = (old_layout / name).read_bytes()
    assert original.count(before.encode()) == 1
    changed = original.replace(before.encode(), after.encode())
    (layout / name).write_bytes(changed)
    inverse[name] = changed.replace(after.encode(), before.encode()) == original
    assert inverse[name]
    (AUTHOR / (name + '.diff')).write_text(''.join(difflib.unified_diff(
        original.decode().splitlines(True), changed.decode().splitlines(True), fromfile='A20-04/' + name, tofile='A21-01/' + name)))
assert all(p.read_bytes() == (layout / p.name).read_bytes() for p in old_layout.glob('*.mjs') if p.name not in inverse)
old_oci_mjs = {p.relative_to(old_oci).as_posix(): sha(p) for p in old_oci.rglob('*.mjs')}
assert len(old_oci_mjs) == 40
assert all(sha(oci / p) == h for p, h in old_oci_mjs.items())

binding = read(layout / 'binding.json')
binding.update(source_identity=SOURCE, included_files=1876, image=test['image'],
               root_build_receipt_path=str(TEST_RECEIPT), root_build_receipt_sha256=sha(TEST_RECEIPT),
               source_snapshot_path=str(FREEZE), source_snapshot_sha256=sha(FREEZE))
write(layout / 'binding.json', binding)
with (layout / 'DESIGN.md').open('a', encoding='utf-8') as f:
    f.write('\n\nA22 metadata binding: source1f73c9e7/1876, existingtextarea center-focus fix source-only accepted00e75d72. '
            'Original accepted A20-04 method/Firefox readback/WebKit207.36 nominal200 metrology unchanged. '
            'Only own run dirname and strict included count1875→1876 literals change runtime. '
            'All nine A22 shards must be fresh under this one runtime; no A20 geometry carry. '
            'Original459/324/135 cases/actions, fixtures, budgets, scopes and oracles unchanged. '
            'Root ACK false pending new independent binding review and fresh resource08 admission.\n')
ack = read(layout / 'ROOT_RUN_ACK.json')
ack.update(root_run_ack=False, independent_producer_review='PENDING',
           independent_review_path='.docs/implementation/reviews/p05/PENDING/INDEX.json',
           independent_review_index_sha256='0' * 64, producer_runtime_digest='0' * 64,
           source_identity=SOURCE, image=test['image'], issued_at=None,
           scope='NINE_FRESH_A22_51_CELL_SHARDS_MANUAL_ONE_EACH_NOT_STAGE')
for stale in ['live_resource_preflight', 'live_resource_preflight_sha256', 'preflight_path', 'preflight_sha256']:
    ack.pop(stale, None)
write(layout / 'ROOT_RUN_ACK.json', ack)

ob = read(oci / 'BINDING.json')
previous = {'source_identity': ob['source_identity'], 'image': ob['images']['A'], 'producer33_index_sha256': sha(old_oci / 'INDEX.json')}
ob.update(source_identity=SOURCE, included_files=1876, prior_source_identity=ob['source_identity'],
          previous_A_binding=previous,
          application_source_review='A22 three existingtextarea center literals plus aligned existingunit expectation/normative04; independent00e75d72. Backend69/67+SQL7/PG2/CSS exactA21. Fresh original14 required.',
          application_current_tests='1104PASS207platformSKIP41.45s exact changedtextarea/test before normative04; clean1876quality/currentnative pending.',
          operational_binding_revision='OCI34_A22_B4_LITERAL_BINDING_RUNTIME81_NOT_RUN')
ob['images']['A'] = test['image']
for group in ['per_image_compiled', 'per_image_additional']:
    assert all(test['image_files_sha256'][p] == h for p, h in ob[group]['A'].items())
maps = read(oci / 'actual-image-maps.json')
maps['status'] = 'ROOT_ACTUAL_RECEIPTS_A22_B4_CRITICAL_81_78_NATIVE34_PENDING'
maps['images']['A'] = test['image']
old_a = maps['maps']['A']['files']
new_a = {p: test['image_files_sha256'][p] for p in old_a if not p.startswith('apps/web/dist/')}
assert all(new_a[p] == old_a[p] for p in new_a)
new_a.update(test['web_dist_files'])
assert len(new_a) == 81 and len(maps['maps']['B']['files']) == 78
maps['maps']['A']['files'] = new_a
write(oci / 'actual-image-maps.json', maps)
ob['expanded_actual_image_UI_migration_maps_sha256'] = sha(oci / 'actual-image-maps.json')
write(oci / 'BINDING.json', ob)
write(oci / 'included-inputs.json', freeze['files'])
write(oci / 'FULL299-PROBE20.json', {'status': 'FULL_IMAGE_PROBE_PROOF_NOT_OCI_RUNTIME_EXPECTED_MAP',
    'image': test['image'], 'source_identity': SOURCE, 'receipt_path': str(TEST_RECEIPT),
    'receipt_sha256': sha(TEST_RECEIPT), 'files': test['image_files_sha256'], 'file_count': 299})
write(oci / 'OPERATIONAL_REVISION34.json', {'status': 'AUTHOR_A22_METADATA_REBIND_PENDING_INDEPENDENT_NO_NATIVE',
    'source_identity': SOURCE, 'included_files': 1876, 'images': ob['images'], 'source_freeze_sha256': sha(FREEZE),
    'test_receipt_sha256': sha(TEST_RECEIPT), 'production_receipt_sha256': sha(PROD_RECEIPT),
    'core_git': freeze['git_source_commit'], 'parent33_INDEX_sha256': sha(old_oci / 'INDEX.json'),
    'A_expected_runtime81': True, 'B78unchanged': True, 'full299_separate': 'FULL299-PROBE20.json',
    'all40_MJS_rawexact33': True, 'all14_oracles_resources_deadlines': 'UNCHANGED', 'native_runs': 0, 'root_ack': False})
oa = read(oci / 'ROOT_RUN_ACK_TEMPLATE.json')
oa.update(status='NOT_AUTHORIZED', root_run_ack=False, source_identity=SOURCE, images=ob['images'],
          producer_index_sha256=None, independent_review_index=None, independent_review_index_sha256=None,
          application_source_review_index=None, application_source_review_index_sha256=None,
          application_source_review_source=SOURCE, expanded_image_map_sha256=sha(oci / 'actual-image-maps.json'))
write(oci / 'ROOT_RUN_ACK_TEMPLATE.json', oa)
write(AUTHOR / 'OCI34-INACTIVE-ACK.json', oa)
write(AUTHOR / 'INPUT-PINS.json', {'freeze': {'path': str(FREEZE), 'sha256': sha(FREEZE)},
    'test_receipt': {'path': str(TEST_RECEIPT), 'sha256': sha(TEST_RECEIPT)},
    'production_receipt': {'path': str(PROD_RECEIPT), 'sha256': sha(PROD_RECEIPT)},
    'layout_parent_index': sha(old_layout / 'INDEX.json'), 'OCI_parent_index': sha(old_oci / 'INDEX.json')})
write(AUTHOR / 'RUNTIME-INVERSES.json', {'layout_two_literals_inverse': inverse, 'other25_layout_MJS_rawexact_A21_02': True,
                                     'all40_OCI_MJS_rawexact33': old_oci_mjs})
write(AUTHOR / 'IMAGE-MAP-CHECKS.json', {'backend69_test_67production_SQL7_PG2_CSS_exact_A20': True,
    'runtime_A_files': len(new_a), 'runtime_B_files': len(maps['maps']['B']['files']),
    'full_probe299_kept_separate': True, 'source_identity': SOURCE, 'images': ob['images']})
shutil.copyfile(Path(__file__), AUTHOR / 'prepare.py')
print(json.dumps({'status': 'COPIED_AND_REBOUND_METADATA_PENDING_EXISTING_COLD_CHECKS_AND_FREEZE',
                  'layout': str(layout), 'OCI': str(oci), 'Docker': 0}))
