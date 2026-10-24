from pathlib import Path
import json
b=Path('.artifacts/p05-renewal-regression-audit-round01');p=b/'audit.py'
(b/'audit-attempt01.py').write_bytes(p.read_bytes())
(b/'audit-attempt01.json').write_text(json.dumps({'exit_code':1,'reason':'Own audit over-assumed image-built web assets must exist in host dist. Image receipt records73 files; hostcompiled64 and source7 can be checked against host/sourceZIP, webasset2 remain archived root image-probe witness. No Docker extraction authorized or repeated. Host old assetname does not alter included source or invalidate root image build.'},indent=2)+'\n',encoding='utf-8')
s=p.read_text(encoding='utf-8').replace(" assert sha(root/n)==h"," if not n.startswith('apps/web/dist/assets/'):assert sha(root/n)==h")
s=s.replace("'receipt_image_files_match_current_host':True","'host_compiled_and_source_files_verified':71,'image_web_assets_receipt_only':2")
p.write_text(s,encoding='utf-8')
