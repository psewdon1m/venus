from pathlib import Path
import hashlib,json,datetime
root=Path('C:/.projects/venus');work=root/'.artifacts/p05-ui-control-contrast-author01';work.mkdir()
style=root/'apps/web/src/style.css';frozen=root/'.artifacts/p05-pilot-bundle-source13/apps/web/src/style.css';before=style.read_bytes();assert before==frozen.read_bytes();(work/'style.css.before').write_bytes(before)
addition='''
/* Explicit form paint keeps the warm-light design legible under either OS scheme. */
:root{color-scheme:light;--control-border:#806780;--control-background:#fffdfa;--control-ink:#4c3455;--control-selected:#e6dce6;--control-focus:#74547e}
input,select,textarea{border:2px solid var(--control-border);color-scheme:light}
input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--control-focus);outline-offset:3px}
.check{min-height:44px;align-items:center}
input[type=checkbox]{appearance:none;-webkit-appearance:none;display:inline-grid;place-content:center;flex:0 0 20px;width:20px;min-width:20px;height:20px;min-height:20px;padding:0;margin:0;border:2px solid var(--control-border);border-radius:4px;background:var(--control-background);color:var(--control-ink);vertical-align:middle;cursor:pointer}
input[type=checkbox]::before{content:"";font:700 16px/1 Arial,sans-serif}
input[type=checkbox]:checked{background:var(--control-selected)}
input[type=checkbox]:checked::before{content:"✓"}
input[type=checkbox]:indeterminate::before{content:"−"}
input:disabled,select:disabled,textarea:disabled{background:#eee8ed;border-color:var(--control-border);color:#62586a;cursor:not-allowed}
input[type=checkbox]:disabled{background:#eee8ed;color:#62586a;cursor:not-allowed}
/* The real range input retains arrows/Home/End; track and thumb are explicit. */
input[type=range]{appearance:none;-webkit-appearance:none;height:44px;min-height:44px;padding:12px;background:var(--control-background);border:2px solid var(--control-border);border-radius:12px;cursor:pointer}
input[type=range]::-webkit-slider-runnable-track{height:6px;border:0;border-radius:3px;background:var(--control-border)}
input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:22px;height:22px;margin-top:-8px;border:2px solid var(--control-ink);border-radius:50%;background:var(--control-background)}
input[type=range]::-moz-range-track,input[type=range]::-moz-range-progress{height:6px;border:0;border-radius:3px;background:var(--control-border)}
input[type=range]::-moz-range-thumb{width:18px;height:18px;border:2px solid var(--control-ink);border-radius:50%;background:var(--control-background)}
input[type=range]:disabled{background:#eee8ed;cursor:not-allowed}
'''
style.write_bytes(before+addition.encode('utf-8'))
sha=lambda b:hashlib.sha256(b).hexdigest()
actual=root/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05/venus-v2-layout-70eee6a09494'
revision={'schema_version':1,'revision':'P05-UI-CONTROL-CONTRAST-01','kind':'APPLICATION_CSS_ACCESSIBILITY_CORRECTION','created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'parent_source_identity':'c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13','parent_included_files':1870,'scope':['apps/web/src/style.css','.docs/implementation/p05-source-revision-ui-control-contrast-01.json'],'before_css_sha256':sha(before),'after_css_sha256':sha(style.read_bytes()),'actual_failure_input':{'path':str(actual/'layout-report.json'),'sha256':sha((actual/'layout-report.json').read_bytes()),'status':'FAIL0PASS1FAIL50NOTRUN_CLEANUP_PASS','failure':'RENDERED_CONTRAST_FAILURE','observed':'four input/select boundaries ratio2.1779<3; two native checkbox boundaries unresolved'},'behavior':['Warm-light palette remains fixed; explicit color-scheme:light avoids OS-native dark/light form-paint mismatch without adding a theme switch.','Real input/select/textarea boundaries are visible 2px solid with stronger existing palette color; focus outline retained.','Actual HTML checkbox rendering uses CSS appearance:none, explicit checked/indeterminate marker and disabled/focus paint. Type/labels/Space/default change events and separate18+acceptance remain unchanged. Label rows have44px target height.','Actual range input keeps browser-native value/keyboard semantics while explicit bordered field, track and thumb remove unmeasured native paint.'],'unchanged':['TS/JS/API/contracts/cards/policies and18+logic','All layout audit thresholds, focus/keyboard/native200/459 matrix and original bounds'],'compatibility':'CSS-only application correction; DOM contracts and persisted state unchanged. Independent review and new source/image-bound actual layout still required.','rollback':'Restore exact before_css_sha256 bytes from parent source13 style.css through a new explicit source revision; do not rewrite this historical record.','native_layout_after_fix':'NOT_RUN','stage_PASS':False}
(root/'.docs/implementation/p05-source-revision-ui-control-contrast-01.json').write_text(json.dumps(revision,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'CSS_AND_REVISION_WRITTEN_PENDING_BUILD_REVIEW','before_css_sha256':sha(before),'after_css_sha256':sha(style.read_bytes())}))
