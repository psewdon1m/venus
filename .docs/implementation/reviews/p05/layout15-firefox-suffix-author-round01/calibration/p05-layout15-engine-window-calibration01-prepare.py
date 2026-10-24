from pathlib import Path
r=Path('C:/.projects/venus');s=(r/'.artifacts/p05-layout14-window-experiment02.py').read_text()
s=s.replace('p05-layout14-window-experiment02','p05-layout15-engine-window-calibration01').replace('timeout=60','timeout=75').replace("'whole_native_bound_ms':20000","'per_engine_bound_ms':20000,'engines':2")
(r/'.artifacts/p05-layout15-engine-window-calibration01.py').write_text(s,encoding='utf-8')
