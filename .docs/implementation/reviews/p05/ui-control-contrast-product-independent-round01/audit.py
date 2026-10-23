"""Read-only source/packet/build pin audit and independent sRGB contrast arithmetic."""
from pathlib import Path
import hashlib,json,sys
ROOT=Path('C:/.projects/venus')
OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
sha=lambda b:hashlib.sha256(b).hexdigest()
pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
author=ROOT/'.docs/implementation/reviews/p05/ui-control-contrast-author-round01'
index=author/'INDEX.json'
assert sha(index.read_bytes())=='a5db598bb2ef54a8d4ab8a4b6bfaf22a369450519d153f13083f1d9c1c330ef5'
packet=json.loads(index.read_text());checked=[]
for n,p in packet['files'].items():
 assert pin(author/n)==p,n
 checked.append(n)
assert len(checked)==21
baseline_path=ROOT/'.artifacts/p05-pilot-bundle-source-freeze13.json'
baseline=json.loads(baseline_path.read_text())['files']
current=inventory();candidate='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
assert len(current)==1871 and identity(current)==candidate
added=sorted(current.keys()-baseline.keys());removed=sorted(baseline.keys()-current.keys())
changed=sorted(n for n in baseline.keys()&current.keys() if baseline[n]!=current[n])
revision='.docs/implementation/p05-source-revision-ui-control-contrast-01.json'
assert added==[revision] and removed==[] and changed==['apps/web/src/style.css']
assert sum(current[n]==baseline[n] for n in baseline)==1869
before=(author/'style.css.before').read_bytes();after=(author/'style.css.after').read_bytes()
assert sha(before)==baseline['apps/web/src/style.css']
assert before==(ROOT/'.artifacts/p05-pilot-bundle-source13/apps/web/src/style.css').read_bytes()
assert after==(ROOT/'apps/web/src/style.css').read_bytes() and after.startswith(before)
assert (ROOT/revision).read_bytes()==(author/Path(revision).name).read_bytes()
checks=json.loads((author/'CHECKS.json').read_text())
assert checks['full_source_map']==current and checks['build_exit']==0
assets=checks['compiled_web_assets']
for n,p in assets.items():assert pin(ROOT/'apps/web/dist'/n)==p,n
receipt_path=ROOT/'.artifacts/p05-pilot-bundle-image-binding13/receipt.json'
old_assets=json.loads(receipt_path.read_text())['web_dist_files']
old_js={n:h for n,h in old_assets.items() if n.endswith('.js')}
new_js={n:p['sha256'] for n,p in assets.items() if n.endswith('.js')}
assert list(new_js.values())==list(old_js.values())==['18645659151dc2d9c1d5e2ae0b5e13b65b0f90f8864a5f5ec75e8c00cef1bf32']
def luminance(h):
 rgb=[int(h[i:i+2],16)/255 for i in (1,3,5)]
 linear=[c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4 for c in rgb]
 return sum(v*w for v,w in zip(linear,[0.2126,0.7152,0.0722]))
def contrast(a,b):
 x,y=sorted([luminance(a),luminance(b)])
 return (y+0.05)/(x+0.05)
surfaces=['#fffdfa','#e6dce6','#eee8ed','#f8f5f1','#fffaf6','#f7f0f7','#f3ece8','#f0e9ed']
boundaries={b:contrast('#806780',b) for b in surfaces}
focus={b:contrast('#74547e',b) for b in surfaces}
text={
 'checkbox_unchecked':contrast('#4c3455','#fffdfa'),
 'checkbox_checked':contrast('#4c3455','#e6dce6'),
 'checkbox_disabled_including_checked':contrast('#62586a','#eee8ed'),
 'ordinary_input':contrast('#302c39','#fffdfa'),
 'range_thumb_ink':contrast('#4c3455','#fffdfa'),
}
assert min(boundaries.values())>=3 and min(focus.values())>=3
assert min(text.values())>=4.5
assert inventory()==current
result={
 'status':'PASS_STATIC_PRODUCT_SOURCE_ONLY_NATIVE_PENDING','author_index':pin(index),
 'author_children_verified':len(checked),'parent_freeze':pin(baseline_path),
 'source_identity':candidate,'included_files':len(current),'added':added,'changed':changed,
 'removed':removed,'unchanged_parent_paths':1869,
 'before_css_sha256':sha(before),'after_css_sha256':sha(after),
 'additive_css_bytes':len(after)-len(before),'revision_sha256':current[revision],
 'build02_exit_record':0,'assets_verified':assets,'old_js':old_js,'new_js':new_js,
 'boundary_ratios':boundaries,'focus_ratios':focus,'foreground_ratios':text,
 'original_failure_ratio':contrast('#b9aab7','#fffdfa'),
 'build_rerun':False,'native_rerun':False,'source_before_after_own_audit_exact':True,
 'limitations':['Arithmetic is declared flat-paint contrast, not computed/rendered proof.',
 'Native browser Space, checked glyph, disabled, range, focus and all459 layout cells remain pending.',
 'No whole-stage or full current-app browser acceptance.']}
(OUT/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:result[k] for k in ['status','author_children_verified','source_identity','included_files','unchanged_parent_paths','boundary_ratios','focus_ratios','foreground_ratios','original_failure_ratio']}))
