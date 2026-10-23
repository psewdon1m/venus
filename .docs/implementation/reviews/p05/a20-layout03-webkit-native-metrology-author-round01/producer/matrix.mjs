/** Fixed V2 layout contract. A P1 result or a subset cannot satisfy this matrix. */
import assert from 'node:assert/strict';
import {assertNativeScale} from './probe-policy.mjs';
export const engines=['chromium','firefox','webkit'];
export const locales=['ru','en','tr'];
export const scenes=['entry','setup','public_questions','private_offer','private_active'];
export const geometries=[
 {id:'w320',width:320,height:568},{id:'w375',width:375,height:667},
 {id:'w768',width:768,height:768},{id:'w1024',width:1024,height:768},
 {id:'w1440',width:1440,height:900},{id:'w1920',width:1920,height:1080},
 {id:'landscape',width:667,height:375},{id:'smallheight',width:1024,height:320}
];
export const supplements=['truth_dare_choice','yes_but_condition'];
export const expectedCells=()=>engines.flatMap(engine=>locales.flatMap(locale=>[
 ...scenes.flatMap(scene=>[...geometries.map(geometry=>({engine,locale,scene,geometry:geometry.id,native:false})),{engine,locale,scene,geometry:'native200',native:true}]),
 ...supplements.flatMap(scene=>['w320','landscape','native200'].map(geometry=>({engine,locale,scene,geometry,native:geometry==='native200'})))
])).map(cell=>({...cell,id:[cell.engine,cell.locale,cell.scene,cell.geometry].join('/')}));
export const expectedRoles=scene=>scene==='entry'?['entry']:scene==='setup'?['host','guest']:scene==='public_questions'?['primary','other']:['primary','secondary','observer'];
export function assertCell(row){
 assert.equal(row.status,'PASS');assert.equal(row.protocol,2);assert.equal(row.real_ui,true);
 assert.equal(row.reduced_motion,true);assert.equal(row.horizontal_overflow,false);assert.equal(row.hidden_scroll_trap,false);
 assert.equal(row.roles.length,expectedRoles(row.scene).length);assert.deepEqual([...new Set(row.roles.map(r=>r.role))].sort(),expectedRoles(row.scene).sort());
 for(const role of row.roles){for(const key of ['visible','focus_visible','keyboard_reached','focus_in_viewport','own_scope_matches','control_names_nonempty','normal_ui_clock'])assert.equal(role[key],true);assert.equal(role.cross_private_leak,false);assert.equal(role.contrast_failures,0);assert.equal(role.contrast_unresolved,0);assert(typeof role.evidence_file==='string'&&role.evidence_file.length>0);}
 if(row.native){const m=row.native_measurement;assert(m);assert.equal(m.css_zoom,'1');assert(m.before_dpr>0);assert.equal(m.engine,row.engine);assertNativeScale(m,row.engine);assert(m.after_width<=m.before_width/1.9);assert(m.x11_keyboard);assert(m.isolated_browser);assert(m.reset_verified);}
 else{const g=geometries.find(g=>g.id===row.geometry);assert(g);assert.equal(row.viewport.width,g.width);assert.equal(row.viewport.height,g.height);assert.equal(row.viewport.dpr,1);assert.equal(row.viewport.css_zoom,'1');}
 assert(row.elapsed_ms>=0);assert(row.sweep_elapsed_ms>=0);assert(row.sweep_elapsed_ms<=row.sweep_budget_ms);assert.equal(row.clock_or_expiry_override,false);
 if(row.native){assert.equal(row.native_role_measurements.length,row.roles.length);assert.deepEqual(row.native_role_measurements.map(r=>r.role).sort(),expectedRoles(row.scene).sort());for(const m of row.native_role_measurements){assert.equal(m.css_zoom,'1');assert.equal(m.x11_keyboard,true);assert.equal(m.isolated_browser,true);assert.equal(m.reset_verified,true);assert.equal(m.engine,row.engine);assertNativeScale(m, row.engine);assert(m.after_width<=m.before_width/1.9);}}
}
export function assertMatrix(rows,{engine=null,locale=null}={}){
 const expected=expectedCells().filter(c=>(!engine||c.engine===engine)&&(!locale||c.locale===locale));
 assert.equal(expectedCells().length,459);assert.equal(rows.length,expected.length);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 for(const cell of expected){const row=rows.find(r=>r.id===cell.id);assert(row,'Missing '+cell.id);for(const key of ['engine','locale','scene','geometry','native'])assert.equal(row[key],cell[key]);assertCell(row);}
 return {status:'V2_FIXED_LAYOUT_MATRIX_PASS',cells:rows.length,full_matrix:!engine&&!locale,production:false,real_devices:false};
}
