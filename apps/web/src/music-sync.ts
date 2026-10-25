import type {MusicState} from '@venus/contracts';
export interface MusicSample {state:MusicState;receivedMono:number}
/** Midpoint of bounded monotonic RTT avoids using the client's wall clock. */
export function musicSample(state:MusicState,start:number,end:number):MusicSample{return {state,receivedMono:(start+end)/2};}
export function musicPosition(sample:MusicSample,now:number){const {state,receivedMono}=sample;return Math.min(state.track?.duration_ms??0,state.position_ms+(state.status==='playing'?Math.max(0,now-receivedMono):0))/1000;}
export function applyMusicSync(audio:HTMLAudioElement,sample:MusicSample,now:number,listen:boolean,onBlocked?:()=>void){
 const state=sample.state;
 if(!listen||!state.track||state.reason!=='ready'){audio.pause();return;}
 const expected=musicPosition(sample,now);
 if(Number.isFinite(audio.duration)&&Math.abs(audio.currentTime-expected)>0.15)audio.currentTime=expected;
 audio.playbackRate=1;
 if(state.status==='paused')audio.pause();
 else if(audio.paused){const src=audio.src;void audio.play().catch((error:unknown)=>{if(audio.src===src&&error&&typeof error==='object'&&'name' in error&&error.name==='NotAllowedError')onBlocked?.();});}
}
