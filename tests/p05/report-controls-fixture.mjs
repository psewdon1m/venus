/** Synthetic reporter control data, never a browser execution claim. */
export function reportFixture(selectedEngine='all',selectedCase=null){
  const engineNames=selectedEngine==='all'?['chromium','firefox','webkit']:[selectedEngine];
  const caseNames=selectedCase?[selectedCase]:['P05-18-EXPLICIT','P05-01-CAPACITY-IDENTITY','P05-03-05-09-10-LOCALIZED-GAME','P05-UI-YESBUT-CONDITION-REPLAY','P05-04-PRIVATE-CHAT-CONSENT-ACL','P05-06-NOT-A-FRIEND-ALL-MODES','P05-NEUTRAL-SAFETY-RESET','P05-IN-PERSON-PRIVATE-NO-CHAT','P05-STALE-READ-AFTER-NEW-PREPARE','P05-EXPIRED-CHAT-RETRY-PURGE'];
  const r={status:'PASS',synthetic_fixture_only:true,production_approval:false,desktop_linux_engines_only:true,selected_engine:selectedEngine,selected_case:selectedCase,full_suite:!selectedCase,toolchain:{node:'v24.22.1',npm:'11.19.1',playwright:'1.64.1'},runtime_cleanup:'completed',display_cleanup:'completed',page_errors:[],page_errors_overflow:false,versions:engineNames.map(engine=>({engine,version:'CONTROL_NOT_REAL_BROWSER'})),records:engineNames.flatMap(engine=>caseNames.map(id=>({engine,id,status:'PASS'}))),matrix:[],native_zoom:[],native_browser_zoom:'NOT_RUN'};
  if(caseNames.includes('P05-03-05-09-10-LOCALIZED-GAME')){
    r.native_browser_zoom='OBSERVED_NATIVE_GE_200';
    for(const engine of engineNames)for(const locale of ['ru','en','tr'])for(const screen of ['entry','lobby','active']){
      for(const [width,height,css_zoom] of [[320,568,1],[375,667,1],[768,768,1],[1024,768,1],[1440,900,1],[1920,1080,1],[667,375,1],[320,568,2]])r.matrix.push({engine,locale,screen,width,height,css_zoom,status:'PASS',keyboard_focus:true,reduced_motion:true,horizontal_overflow:false,actual_baseline_viewport:{width,height,dpr:1,cssZoom:'1'}});
      r.native_zoom.push({engine,locale,screen,status:'PASS',separate_browser_process:true,reset_verified:true,physical_keyboard_x11:true,before:{dpr:1,cssZoom:'1',innerWidth:640},after:{dpr:2,cssZoom:'1',innerWidth:320,scrollWidth:320},actual_zoom_percent:200,main_viewport_before:{width:320,height:568,dpr:1},main_viewport_after:{width:320,height:568,dpr:1}});
      const row=r.native_zoom.at(-1),main=screen==='entry'?null:{room_id:'CONTROL_MAIN_ROOM',member_id:'CONTROL_MAIN_MEMBER',...(screen==='active'?{session_id:'CONTROL_MAIN_SESSION',state:'active',round_state:'active'}:{game:null})};row.isolated_fixture_room=screen!=='entry';row.source_scene_before=main;row.source_scene_after=main;row.native_scene=screen==='entry'?null:{room_id:'CONTROL_NATIVE_ROOM',member_id:'CONTROL_NATIVE_MEMBER',...(screen==='active'?{session_id:'CONTROL_NATIVE_SESSION',state:'active',round_state:'active'}:{game:null})};
    }
  }
  return r;
}
