from pathlib import Path
r=Path('C:/.projects/venus');s=(r/'.artifacts/p05-layout14-window-experiment02.py').read_text().replace('p05-layout14-window-experiment02','p05-webkit-window-mapping-probe01')
(r/'.artifacts/p05-webkit-window-mapping-probe01.py').write_text(s,encoding='utf-8')
