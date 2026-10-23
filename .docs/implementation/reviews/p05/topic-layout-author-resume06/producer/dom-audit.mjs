/** This self-contained function executes read-only against the actual rendered DOM. Never returns text/values. */
/* global window,document,Node,getComputedStyle,matchMedia */
export function domAudit(){
 const styles=e=>getComputedStyle(e),visible=e=>{const r=e.getBoundingClientRect(),s=styles(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility==='visible';};
 // Supported paint model is flat sRGB alpha backgrounds. Other paint contexts are unresolved.
 const unsupportedPaint=s=>[['filter','none'],['backdropFilter','none'],['webkitBackdropFilter','none'],['mixBlendMode','normal'],['backgroundBlendMode','normal'],['isolation','auto'],['maskImage','none'],['webkitMaskImage','none'],['clipPath','none'],['webkitClipPath','none'],['textShadow','none'],['transform','none'],['perspective','none']].some(([key,allowed])=>typeof s[key]==='string'&&s[key]!==''&&s[key]!==allowed)||['hidden','auto'].includes(s.contentVisibility);
 const color=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const a=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);if(a.length<3||a.some(v=>!Number.isFinite(v)))return null;return [a[0],a[1],a[2],a[3]??1];};
 const blend=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3]));
 const lum=c=>{const t=c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*t[0]+.7152*t[1]+.0722*t[2];},contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const background=e=>{const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);let bg=[255,255,255];for(const p of chain){const s=styles(p),v=color(s.backgroundColor);if(!v||s.backgroundImage!=='none'||Number(s.opacity)!==1||unsupportedPaint(s))return null;bg=blend(v,bg);}return bg;};
 let contrast_failures=0,contrast_unresolved=0,motion_violations=0,named_controls=true,labels_associated=true,samples=0;
 const failures=[],unresolved=[],nodes=[...document.querySelectorAll('body *')],visibleNodes=nodes.filter(visible),controls=visibleNodes.filter(e=>e.matches('button,input,select,textarea,summary,a[href]')&&!e.matches(':disabled'));
 const add=(rows,e,kind,ratio=null)=>{if(rows.length<32)rows.push({tag:e.tagName,id:e.getAttribute('data-testid'),kind,ratio});};
 for(const e of visibleNodes){const s=styles(e);if(s.animationName!=='none'&&s.animationDuration.split(',').some(v=>parseFloat(v)>0)||s.transitionDuration.split(',').some(v=>parseFloat(v)>0))motion_violations++;
  const hasText=[...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())||e.matches('input,textarea,select');if(!hasText||e.closest(':disabled'))continue;
  if(++samples>2048)break;const bg=background(e),fg=color(s.color);if(!bg||!fg){contrast_unresolved++;add(unresolved,e,'text-compositing');continue;}const rendered=blend(fg,bg),large=parseFloat(s.fontSize)>=24||parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700,ratio=contrast(rendered,bg);if(ratio<(large?3:4.5)){contrast_failures++;add(failures,e,'text',ratio);}
 }
 for(const e of controls){const s=styles(e),name=e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')?.split(/\s+/).map(id=>document.getElementById(id)?.textContent??'').join(' ')||e.labels?.[0]?.textContent||e.textContent||e.getAttribute('title');if(!name?.trim())named_controls=false;
  if(e.matches('input:not([type=hidden]),select,textarea')&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!(e.labels?.length))labels_associated=false;
  if(e.matches('input,select,textarea')){const bg=background(e),border=color(s.borderTopColor),native=s.appearance!=='none'&&parseFloat(s.borderTopWidth)===0;if(native||!bg||!border){contrast_unresolved++;add(unresolved,e,'native-control-boundary');}else if(parseFloat(s.borderTopWidth)>0){const ratio=contrast(blend(border,bg),bg);if(ratio<3){contrast_failures++;add(failures,e,'control-boundary',ratio);}}}
 }
 const doc=document.documentElement;
 return {locale:doc.lang,viewport:{width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio,css_zoom:styles(doc).zoom},reduced_motion:matchMedia('(prefers-reduced-motion: reduce)').matches,motion_violations,horizontal_overflow:doc.scrollWidth>doc.clientWidth+2,audit_overflow:nodes.length>4096||samples>2048,contrast_failures,contrast_unresolved,contrast_samples:Math.min(samples,2048),failures,unresolved,named_controls,labels_associated};
}

/** One real Tab event already occurred. Report its actual focus/scroll/occlusion, not an assumed tab index. */
export function focusAudit(){
 const e=document.activeElement;if(!e||e===document.body)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e),outline=parseFloat(s.outlineWidth)>0&&s.outlineStyle!=='none'&&s.outlineColor!=='transparent',shadow=s.boxShadow!=='none',x=Math.max(0,Math.min(window.innerWidth-1,r.left+r.width/2)),y=Math.max(0,Math.min(window.innerHeight-1,r.top+r.height/2)),hit=document.elementFromPoint(x,y);
 const unsupportedPaint=s=>[['filter','none'],['backdropFilter','none'],['webkitBackdropFilter','none'],['mixBlendMode','normal'],['backgroundBlendMode','normal'],['isolation','auto'],['maskImage','none'],['webkitMaskImage','none'],['clipPath','none'],['webkitClipPath','none'],['textShadow','none'],['transform','none'],['perspective','none']].some(([key,allowed])=>typeof s[key]==='string'&&s[key]!==''&&s[key]!==allowed)||['hidden','auto'].includes(s.contentVisibility);
 const color=v=>{const m=v.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const a=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return a.length>=3&&a.every(Number.isFinite)?[...a.slice(0,3),a[3]??1]:null;},blend=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3]));
 let bg=[255,255,255],unresolved=unsupportedPaint(s)||Number(s.opacity)!==1||s.visibility!=='visible'||s.display==='none';const chain=[];for(let p=e.parentElement;p;p=p.parentElement)chain.unshift(p);for(const p of chain){const st=getComputedStyle(p),c=color(st.backgroundColor);if(!c||st.backgroundImage!=='none'||Number(st.opacity)!==1||unsupportedPaint(st)||st.visibility!=='visible'||st.display==='none'){unresolved=true;break;}bg=blend(c,bg);}
 const fg=color(s.outlineColor);let ratio=null;if(!outline||!fg)unresolved=true;if(!unresolved){const lum=v=>{const a=v.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*a[0]+.7152*a[1]+.0722*a[2];},a=lum(blend(fg,bg)),b=lum(bg);ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
 return {id:e.getAttribute('data-testid'),tag:e.tagName,focus_visible:e.matches(':focus-visible')&&(outline||shadow)&&!unresolved,focus_contrast_ratio:ratio,focus_contrast_unresolved:unresolved,in_viewport:r.left>=-2&&r.top>=-2&&r.right<=window.innerWidth+2&&r.bottom<=window.innerHeight+2,not_occluded:Boolean(hit&&(hit===e||e.contains(hit))),outline_style:s.outlineStyle,outline_width:parseFloat(s.outlineWidth),scroll_top:document.scrollingElement?.scrollTop??0};
}

export function visibleTargets(){
 const mandatory=new Set(['adult18','accept-offer','create-name','join-name','join-invite','comfort','submit-preferences','topics-save','topic-allow-creative','game-neutral-reset','game-stop','game-pause','game-skip','topic-other','topic-other-exclude','topic-decline','pair-accept','pair-decline','conversation-stop','action-accept','action-withdraw','game-finish','game-dare','game-truth','game-condition-input','game-condition-submit','advice-input','pair-chat-input','offer-topic-creative']);
 return [...document.querySelectorAll('[data-testid]')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return mandatory.has(e.getAttribute('data-testid'))&&r.width>0&&r.height>0&&s.visibility!=='hidden'&&!e.matches(':disabled');}).map(e=>e.getAttribute('data-testid'));
}
