from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

ROOT = Path('C:/.projects/venus')
OUT = Path(__file__).resolve().parent
SOURCE = ROOT / '.artifacts/p05-pilot-bundle-source23'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_bytes())


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


inputs = {}


def pin(relative, expected=None):
    path = ROOT / relative
    value = {'sha256': sha(path), 'bytes': path.stat().st_size}
    if expected is not None:
        assert value['sha256'] == expected, relative
    inputs[relative] = value
    return path


def verify_index(relative, expected):
    path = pin(relative, expected)
    files = read(path)['files']
    entries = files if isinstance(files, list) else [dict(v, path=k) for k, v in files.items()]
    for item in entries:
        child = path.parent / item['path']
        assert sha(child) == item['sha256'], str(child)
        if 'bytes' in item:
            assert child.stat().st_size == item['bytes'], str(child)
    return len(entries)


root_index_before = sha(ROOT / '.git/index')
assert root_index_before == 'a4bb6d5150e4fc2e8beb8bb14bd4aa13aba7e4b419b8c4e40c85e6708ac89093'
freeze = read(pin('.artifacts/p05-pilot-bundle-source-freeze23.json'))
assert freeze['identity'] == '27f5172a4d550017c801a15531d39f52aed120937f70e556dfbaae063b56a5bf'
assert freeze['included_files'] == len(freeze['files']) == 1881
for relative, expected in freeze['files'].items():
    assert sha(SOURCE / relative) == expected, relative

accepted = {
    'author': ('.docs/implementation/reviews/p05/public-exhaustion-focus-author-round01/INDEX.json', '2d6e714ba4c8e6162803232f5be48fdf647d2e43d7036dd785fe0300ff3010f3'),
    'source': ('.docs/implementation/reviews/p05/public-exhaustion-focus-independent-round01/INDEX.json', 'c3338514ac9c23ee70ebcc56cb446c49f1bf1e62eb09f64fbe8b414b47f04896'),
    'binding': ('.docs/implementation/reviews/p05/a26-binding-resource12-independent-round01/INDEX.json', 'c660936369d5f01e82cb967fd97b9baa7f0c9356862c3f910c2b4c26e5afad1f'),
    'questions': ('.docs/implementation/reviews/p05/a16-questions-cohorts-actual-independent-round01/INDEX.json', '774c7a4fe0dcec211074f34551606f4c1024648c76c0f66ea513de918bd2a298'),
    'TD': ('.docs/implementation/reviews/p05/a17-truthdare-cohorts-actual-independent-round01/INDEX.json', '4bc6c6dfe4809f56c9e61238d843b2c9c22294ce19472c79db25fba9009e3885'),
    'YB': ('.docs/implementation/reviews/p05/a17-yesbut-cohorts-actual-independent-round01/INDEX.json', '3eb4b5e5f076ee3ea95f7ddf6b5b0de68dcb561846d9e4f0cf0ac1602574bed1'),
    'N4': ('.docs/implementation/reviews/p05/a16-n4-actual-independent-round01/INDEX.json', '620621feeaa840866f85713639f3b7d9b83378971118ad524384134d18bb3a37'),
    'wire': ('.docs/implementation/reviews/p05/a16-wire07-layout14-actual-independent-round01/INDEX.json', 'cbf1723ce7672e3033da1d0160e50d98e125b4139f1de925b41b666698bde19b'),
    'browser': ('.docs/implementation/reviews/p05/a18-browser26-actual-independent-round01/INDEX.json', '04f456ccc50d7a2388b512aa775adfaf90f2883409d63c53c38fb1e1137e9265'),
    'original84': ('.docs/implementation/reviews/p05/privacy-matched-a18-actual-independent-round01/INDEX.json', 'b87c4c5d18ba827144205ba2737b76c5a84fed4039697f77a0f25c9bbd539f56'),
    'constructive7': ('.docs/implementation/reviews/p05/privacy-support-constructive-actual-independent-round01/INDEX.json', '49605f9c6269e669dacded21df670bad0cde2ff1e6946febc211533bbc0ff8f1'),
    'structural': ('.docs/implementation/reviews/p05/privacy-matched-independent-round01/INDEX.json', 'f1b675aab1cf71d7a781cbe7c479f0289b2e3f4292ca4ad25156db8894fccbcd'),
}
child_counts = {name: verify_index(*value) for name, value in accepted.items()}

current = read(pin('.artifacts/p05-pilot-bundle-image-binding24/receipt.json', 'ea082c9483c366256ba0bc22f52c230e70daaaf7130f3c928c8a1f6845422e93'))
production = read(pin('.artifacts/p05-pilot-bundle-production-image-binding24/receipt.json', 'a289a5a4f29e7dc54b08751d6f87a45d082662f93cb655494903f732a86bfe40'))
assert current['source_identity'] == production['source_identity'] == freeze['identity']
assert current['image'] == 'sha256:48c5876a7f78c828883734b4039c59eb97644089cd7e8cf7ca9721d2e26c4592'
assert production['image'] == 'sha256:eab22e5d6e65b56e8fd39bf635c762ae9fdd16dcd709fcc80a1ac2a186558cb8'
module_changes = {}
for no, label in [('13', 'A16_wire'), ('14', 'A17_TD_YB'), ('15', 'A18_browser'), ('23', 'A25_parent')]:
    old = read(pin(f'.artifacts/p05-pilot-bundle-image-binding{no}/receipt.json'))
    changed = {p: {'before': h, 'after': current['compiled_files'].get(p)} for p, h in old['compiled_files'].items() if current['compiled_files'].get(p) != h}
    assert set(changed) == {'packages/relationship-engine/dist/index.js', 'packages/relationship-engine/dist/topic-planner.js'}
    assert set(current['compiled_files']) == set(old['compiled_files'])
    assert current['migration_files'] == old['migration_files']
    assert current['pg_dependency_files'] == old['pg_dependency_files']
    module_changes[label] = changed
for p, h in production['compiled_files'].items():
    assert current['compiled_files'][p] == h

# Mechanical inverse of the complete planner delta; no native model is executed.
old_planner = (ROOT / '.artifacts/p05-pilot-bundle-source22/packages/relationship-engine/src/topic-planner.ts').read_text()
planner = (SOURCE / 'packages/relationship-engine/src/topic-planner.ts').read_text()
inverse = planner.replace("// Compatible partial-function extension; serialized history readers remain v3.\n// Exact source + this patch identity + seed + pins identify selection behaviour.\nexport const TOPIC_SELECTION_REVISION = 'RE-1.P05-TOPIC-3.PUBLIC-EMPTY-PRIVATE-1' as const;\n", '')
inverse = inverse.replace("  const privateAvailable=privates.length>0&&history.rounds.filter(r=>r.interaction==='pair_private').length<Math.ceil(.25*s.total_rounds);\n  const opportunity=privateAvailable&&rng.next()<(stage<3?0:stage===3?.22:.4);", "  const opportunity=privates.length>0&&history.rounds.filter(r=>r.interaction==='pair_private').length<Math.ceil(.25*s.total_rounds)\n    &&rng.next()<(stage<3?0:stage===3?.22:.4);")
inverse = inverse.replace('  const selectPrivate=():TopicRound=>{', '  if(opportunity){')
inverse = inverse.replace('    const selectedRound:TopicRound={schema:2,', '    round={schema:2,')
inverse = inverse.replace('    const attempt=candidate(snapshot,history,selectedRound,pack,map,state,1,0);return {...selectedRound,card:attempt.card,attempts:[attempt]};\n  };\n  if(opportunity)round=selectPrivate();\n  else{', '    const attempt=candidate(snapshot,history,round,pack,map,state,1,0);round={...round,card:attempt.card,attempts:[attempt]};\n  }else{')
inverse = inverse.replace('    // This trigger is public/baseline only. Hidden topic availability must not\n    // determine whether an opportunity exists; the unchanged private branch may\n    // still return a truthful safe-empty candidate with all consent guards.\n    if(pool.length===0&&privateAvailable)round=selectPrivate();\n    else{\n', '')
inverse = inverse.replace('    }\n  }\n  let next:TopicPlannerHistory=', '  }\n  let next:TopicPlannerHistory=')
assert inverse == old_planner, 'nondeclared planner delta'

frontend_inverse = {}
scroll = "onFocus={e=>e.currentTarget.scrollIntoView({behavior:'instant',block:'center',inline:'nearest'})} "
for p in ['apps/web/src/topic-games-panel.tsx', 'apps/web/src/room-shell.tsx', 'apps/web/src/main.tsx']:
    previous = (ROOT / '.artifacts/p05-pilot-bundle-source15' / p).read_text()
    now = (SOURCE / p).read_text()
    if p.endswith('topic-games-panel.tsx'):
        assert now.count(scroll) == 3
        now = now.replace(scroll, '')
    elif p.endswith('room-shell.tsx'):
        now = now.replace('onClick={e=>e.currentTarget.select()}', 'onFocus={e=>e.target.select()}')
    else:
        start = now.index('  return <main onFocus=')
        end = now.index('>\n    <nav', start)
        now = now[:start] + '  return <main' + now[end:]
    assert now == previous, p
    frontend_inverse[p] = 'EXACT_A18_AFTER_DECLARED_FOCUS_SELECTION_INVERSE_ONLY'

coverage = read(pin('.docs/implementation/reviews/p05/privacy-matched-a18-actual-independent-round01/CELL-COVERAGE.json'))
assert coverage['status'] == 'NOT_COVERED'
covered = {'exclusion': set(), 'semantic': set()}
accepted_observations = []
for cell in coverage['cells']:
    for obs in cell['observations']:
        for kind in covered:
            comparison = obs['comparisons'][kind]
            if comparison['status'] != 'PASS_MATCHED_DOMAIN_ONLY':
                continue
            for name in ['prior', 'base', kind]:
                arm = obs['arms'][name]
                assert arm['status'] == 'COMPLETE_DOMAIN_MODEL' and arm['requested'] == arm['completed'] and arm['refusal'] is None
                assert arm['private_safe_empty'] == 0
            assert comparison['classification'] == 'COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE'
            assert comparison['sequence_equal'] and comparison['public_trace_equal']
            covered[kind].add(cell['cell'])
            accepted_observations.append({'cell': cell['cell'], 'ordinal': obs['ordinal'], 'kind': kind, 'rounds': obs['rounds']})
assert len(accepted_observations) == 82
assert len(covered['exclusion']) == len(covered['semantic']) == 37
constructive = read(pin('.docs/implementation/reviews/p05/privacy-support-constructive-actual-independent-round01/CELL-COVERAGE.json'))
for item in constructive['constructive_cases']:
    for arm in item['arms'].values():
        assert arm['status'] == 'COMPLETE_DOMAIN_MODEL' and arm['requested'] == arm['completed'] == 20 and arm['safe_empty'] == 0
assert len(constructive['constructive_cases']) == 7
assert all(v['combined'] == 42 for v in constructive['counts'].values())

for p in ['.docs/adr/ADR-030-p05-public-exhaustion-compatible-recovery.md', '.docs/implementation/p05-source-revision-public-exhaustion-focus-08.json', 'packages/relationship-engine/src/engine.ts', 'packages/relationship-engine/src/pack.ts', 'packages/relationship-engine/src/private-conversation.ts', 'apps/api/src/topic-games.ts', 'apps/api/src/topic-game-model.ts', 'apps/api/src/room-routes.ts', 'apps/web/src/main.tsx', 'apps/web/src/room-shell.tsx', 'apps/web/src/topic-games-panel.tsx']:
    pin(p, freeze['files'][p])
assert sha(ROOT / '.git/index') == root_index_before
save('INPUT-PINS.json', inputs)
save('AUDIT.json', {
    'status': 'PASS_A26_PRIVACY_SOURCE_DELTA_QUALIFIED_COMPONENT_CARRY_NOT_STAGE',
    'created_at_utc': datetime.now(timezone.utc).isoformat(),
    'source_identity': freeze['identity'], 'materialized_files_rehashed': 1881,
    'clean_git': freeze['git_source_commit'], 'clean_git_qualification': 'FROZEN_ROOT_WITNESS_NO_NEW_GIT_COMMAND',
    'accepted_index_children_rehashed': child_counts,
    'compiled_module_differences': module_changes,
    'test69_production67_common_exact': True, 'SQL7_PG2_exact': True,
    'planner_inverse_to_A25': 'EXACT_NORMALIZED_TEXT_AFTER_DECLARED_FIVE_LOGICAL_EDITS',
    'frontend_A18_inverse': frontend_inverse,
    'old_full_common_positive_comparisons_only': accepted_observations,
    'old_cells_per_type': {k: len(v) for k, v in covered.items()},
    'constructive_whole_20_arms': 28, 'constructive_rounds': 560,
    'bounded_combined_coverage': {'exclusion': 42, 'semantic': 42},
    'original84_status': 'NOT_COVERED_IMMUTABLE',
    'old_refusal_safe_empty_or_out_of_support_credited': False,
    'full_C2_M3_computational_results_carried': False,
    'new_API_wire_browser_constructive_rerun_required_for_A26_delta_alone': False,
    'new_native_actions': 0, 'Docker_queries': 0, 'model_reexecution': False,
    'APP_producer_ACK_Git_edits': 0, 'root_index_unchanged': root_index_before,
    'new_actionable_APP_findings': [], 'full_stage_PASS': False, 'P06_started': False,
})
print(json.dumps({'audit': 'PASS', 'source_files': 1881, 'old_positive_comparisons': 82, 'constructive_arms': 28, 'children_verified': sum(child_counts.values()), 'native_actions': 0}))
