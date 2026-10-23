from pathlib import Path
import shutil
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-private-batch-browser-producer23';c=p.with_name('p05-private-batch-browser-producer24');assert not c.exists();shutil.copytree(p,c)
s=(p/'browser.mjs').read_bytes().decode();start=s.index(' await check(9,');end=s.index(' await check(10,',start)
old=s[start:end];new=(r/'.artifacts/p05-method24-case09.txt').read_text();(c/'browser.mjs').write_bytes((s[:start]+new+s[end:]).encode())
(r/'.artifacts/p05-method24-parent-case09.txt').write_bytes(old.encode());print('PREPARED_METHOD24_ONLY_CASE09_NO_RUN')
