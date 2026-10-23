from pathlib import Path
base=Path('.artifacts/p05-ordinary-ws-review')
for name in ['fingerprint-counterexamples','multiplicity-counterexamples','positive-probes']:
 s=(base/(name+'-round03.mjs')).read_text().replace('../p05-ordinary-ws/observation.mjs','../../.docs/implementation/evidence/p05/ordinary-ws-preflight-02/producer/observation.mjs').replace(name+'-round03.json',name+'-actual02.json');(base/(name+'-actual02.mjs')).write_text(s)
