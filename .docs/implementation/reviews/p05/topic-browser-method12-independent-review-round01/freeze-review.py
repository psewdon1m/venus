import datetime
import hashlib
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def save(name, obj):
    (OUT / name).write_text(json.dumps(obj, indent=2) + '\n', encoding='utf-8')
save('commands.json', {
    'status': 'FINAL_CHECKS_PASS_WITH_PRESERVED_ATTEMPTS',
    'entries': [
        {'command': '.venv/Scripts/python.exe .../verify-and-adapt.py', 'attempt': 1, 'exit_code': 1, 'cause': 'Reviewer snapshot suffix assumption: browser.mjs.bytes missing', 'retained': 'verify-and-adapt-attempt01.py'},
        {'command': '.venv/Scripts/python.exe .../verify-and-adapt.py', 'attempt': 2, 'exit_code': 1, 'cause': 'Reviewer snapshot suffix assumption: DESIGN.md actually .md.bytes', 'retained': 'verify-and-adapt-attempt02.py'},
        {'command': '.venv/Scripts/python.exe .docs/implementation/reviews/p05/topic-browser-method12-independent-review-round01/verify-and-adapt.py', 'attempt': 3, 'exit_code': 0, 'result': '35 author files,9 runtime pins,1813 host+ZIP file hashes; observer review children PASS'},
        {'command': 'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe .docs/implementation/reviews/p05/topic-browser-method12-independent-review-round01/author-integration-rerun.mjs', 'exit_code': 0, 'checks': 17},
        {'command': 'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe .docs/implementation/reviews/p05/topic-browser-method12-independent-review-round01/author-request-rerun.mjs', 'exit_code': 0, 'checks': 13},
        {'command': 'node .../independent-controls.mjs', 'attempt': 1, 'exit_code': 1, 'cause': 'Reviewer Windows ESM import path scheme', 'retained': 'independent-controls-attempt01.mjs'},
        {'command': 'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe .docs/implementation/reviews/p05/topic-browser-method12-independent-review-round01/independent-controls.mjs', 'attempt': 2, 'exit_code': 0, 'checks': 22},
        {'command': "rg -n 'identity|sha256|files.items|sort_keys' .artifacts/p05-renewal*freeze*.py", 'exit_code': 123, 'cause': 'Reviewer literal wildcard path on Windows; rg --files enumeration succeeded subsequently'},
        {'command': 'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe node_modules/eslint/bin/eslint.js --config .artifacts/p05-method12-eslint.config.mjs [eight exact producer .mjs files]', 'exit_code': 0, 'stdout': '', 'stderr': '', 'files': ['browser.mjs','delivery-diagnostics.mjs','frontend-validators.mjs','observations.mjs','private-batch-observer.mjs','request-emission.mjs','run.mjs','runtime.mjs']},
        {'command': '.venv/Scripts/python.exe .docs/implementation/reviews/p05/topic-browser-method12-independent-review-round01/final-checks.py', 'exit_code': 0, 'result': '8 syntax checks/current source identity1813/existing image proof5 children PASS; exact argv/results in final-checks.json'},
    ],
    'docker': 'NOT_RUN', 'browser': 'NOT_RUN', 'selector': 'NOT_RUN', 'product_changes': 'NONE',
})
files = []
for path in sorted(OUT.rglob('*')):
    if path.is_file() and path.name not in {'index.json', 'HANDOFF.json'}:
        files.append({'path': path.relative_to(OUT).as_posix(), 'bytes': path.stat().st_size, 'sha256': digest(path)})
save('index.json', {'schema_version': 1, 'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'status': 'PASS_METHOD_ONLY', 'full_stage_pass': False, 'source_identity': '1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad', 'included_files': 1813, 'controls': {'repeated_author_integration': 17, 'repeated_author_request': 13, 'independent_additional': 22}, 'files': files})
save('HANDOFF.json', {'status': 'PASS_METHOD_ONLY', 'writes': 'COMPLETE', 'source_identity': '1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad', 'included_files': 1813, 'image': 'sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4', 'author_index_sha256': 'ad8083a619f45107095aa6b9040f77dcc0d9c9db9c8cb4d543b973ee598bd818', 'author_handoff_sha256': 'be662e90ea8fcc0ee7bd217fc412c0dac10d5f405d2607f098b02b717037c440', 'index_sha256': digest(OUT / 'index.json'), 'files': len(files), 'report_sha256': digest(OUT / 'REPORT.md'), 'actual_browser': 'NOT_RUN', 'actual_docker': 'NOT_RUN', 'full_stage_pass': False, 'human_content_approval': 'HOLD', 'next': 'Root separate exact current outer runner required; do not execute pinned historical run.mjs'})
print(json.dumps({'status': 'PASS_METHOD_ONLY', 'index_sha256': digest(OUT / 'index.json'), 'handoff_sha256': digest(OUT / 'HANDOFF.json'), 'report_sha256': digest(OUT / 'REPORT.md'), 'files': len(files)}))
