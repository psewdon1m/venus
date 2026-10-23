from pathlib import Path
s=Path('.artifacts/p05-topic-games-runner.mjs').read_text(encoding='utf-8')
s=s.replace("resolve('.venv/Scripts/python.exe')", "'C:/.projects/venus/.venv/Scripts/python.exe'")
old="command('docker',['build','--target','runtime','--iidfile',join(out,'image-id.txt'),'-f','infra/venus/Dockerfile.p05-tests','.'],'build.txt');"
assert old in s
s=s.replace(old,"if(before.identity!=='ed18d3cb16cac4e244d2f2d58602c41cd8485b0bddf9beef7fe9ae1fa64a0026')throw Error('Unexpected materialized B3 source');writeFileSync(join(out,'image-id.txt'),'sha256:367bba5f7278634ff98a1e94ba191f2d70daa0c508404e7102811402a937bfe7');")
Path('.artifacts/p05-engine3-games20-runner01.mjs').write_text(s,encoding='utf-8',newline='\n')
