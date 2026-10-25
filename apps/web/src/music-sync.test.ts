import {test,expect} from 'vitest';
import type {MusicState} from '@venus/contracts';
import {musicSample,musicPosition,applyMusicSync} from './music-sync.js';
const state:MusicState={schema_version:1,room_id:'fixture',rev:1,catalog_digest:'fixture',server_time:'2030-01-01T00:00:00Z',status:'playing',queue:['a'],index:0,track:{id:'a',title:{ru:'a',en:'a',tr:'a'},duration_ms:10000,synthetic:true},position_ms:2000,reason:'ready',can_control:false,default_speaker:true};
test('audio synchronization uses monotonic RTT and caps position at actual track duration',()=>{const s=musicSample(state,100,300);expect(musicPosition(s,1200)).toBe(3);expect(musicPosition(s,50000)).toBe(10);expect(musicPosition(musicSample({...state,status:'paused'},100,300),50000)).toBe(2);});
test('local listening refusal pauses without changing the shared tuple',()=>{let paused=false;const a={pause:()=>{paused=true;},duration:10,currentTime:9,playbackRate:2,paused:false} as unknown as HTMLAudioElement;const s=musicSample(state,100,300);applyMusicSync(a,s,1200,false);expect(paused).toBe(true);expect(a.currentTime).toBe(9);expect(s.state.rev).toBe(1);applyMusicSync(a,s,1200,true);expect(a.currentTime).toBe(3);expect(a.playbackRate).toBe(1);});

test('late autoplay denial reports a local block and can be held until explicit retry',async()=>{
 let blocked=false,calls=0;const a={src:'track-a',pause:()=>{},duration:10,currentTime:2,playbackRate:1,paused:true,play:()=>{calls++;return Promise.reject({name:'NotAllowedError'});}} as unknown as HTMLAudioElement;
 const sample=musicSample(state,100,300),feedback=()=>{blocked=true;};applyMusicSync(a,sample,300,true,feedback);await Promise.resolve();expect(blocked).toBe(true);
 applyMusicSync(a,sample,500,!blocked,feedback);expect(calls).toBe(1);expect(state.rev).toBe(1);
});
test('source replacement and AbortError do not report a stale autoplay block',async()=>{
 let blocks=0;const a={src:'old',pause:()=>{},duration:10,currentTime:2,playbackRate:1,paused:true,play:()=>Promise.reject({name:'NotAllowedError'})} as unknown as HTMLAudioElement;
 applyMusicSync(a,musicSample(state,100,300),300,true,()=>blocks++);a.src='new';await Promise.resolve();expect(blocks).toBe(0);
 a.play=()=>Promise.reject({name:'AbortError'});applyMusicSync(a,musicSample(state,100,300),300,true,()=>blocks++);await Promise.resolve();expect(blocks).toBe(0);
});
