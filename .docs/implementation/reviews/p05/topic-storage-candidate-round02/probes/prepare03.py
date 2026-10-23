from pathlib import Path
import hashlib,json
b=Path('.artifacts/p05-storage-candidate-review-round02');p=Path('.artifacts/p05-storage-availability-candidate03');old=Path('.artifacts/p05-storage-availability-candidate02')
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
assert sha(p/'private-topic-preferences.ts')==sha(old/'private-topic-preferences.ts')=='e6fcb12b474c922137af061b3815521e086aa8b8701a174c1d0af580daef2c3a'
a=(old/'private-topic-preferences.test.ts').read_text(encoding='utf8');c=(p/'private-topic-preferences.test.ts').read_text(encoding='utf8');bad='\u00d0\u2022\u00d0\u00b4\u00d0\u00b0';assert a.count(bad)==2;assert a.replace(bad,'\u0415\u0434\u0430')==c;assert sha(p/'private-topic-preferences.test.ts')=='4daf82e7bb7442c020b40d9d436ad24ca29d1022babd3f47776080c61dbeb29a'
s=(b/'vitest.config.mjs').read_text(encoding='utf8').replace('candidate02','candidate03').replace('03868df9622bf2fee83f61b2ff3354cef24c7eb5bdd95d8e9ba42bfdbace8dae','4daf82e7bb7442c020b40d9d436ad24ca29d1022babd3f47776080c61dbeb29a').replace('unique-vite-cache-e6fcb-03868','unique-vite-cache-e6fcb-4daf83').replace('loaded-inputs.json','loaded-inputs03.json');(b/'vitest03.config.mjs').write_text(s,encoding='utf8');(b/'finite03.json').write_text(json.dumps({'status':'PASS','source_byte_identical02':True,'only_two_RU_test_strings_restored':True},indent=2)+'\n');print('PASS')
