from pathlib import Path
import json
b=Path('.artifacts/p05-advice-method11-review-round02');p=b/'probes.mjs'
(b/'fixture-attempt02.mjs').write_bytes(p.read_bytes())
(b/'fixture-attempt02.json').write_text(json.dumps({'exit_code':1,'observation':json.loads((b/'tsx-observation.json').read_text(encoding='utf-8')),'cause':'Own fixture mutated same GameView object retained by hook/controls; actual HTTP JSON returns separate immutable snapshots. Reassign cloned game and round for each new revision so controls observe legitimate revision transition.'},indent=2)+'\n',encoding='utf-8')
s=p.read_text(encoding='utf-8').replace("const g=game('s','questions',34);let state=","let g=game('s','questions',34);let state=").replace("g.game_rev++;g.current_round.state='active';","g={...g,game_rev:g.game_rev+1,current_round:{...g.current_round,state:'active'}};").replace("g.game_rev++;g.current_round.state='pending';","g={...g,game_rev:g.game_rev+1,current_round:{...g.current_round,state:'pending'}};")
p.write_text(s,encoding='utf-8')
