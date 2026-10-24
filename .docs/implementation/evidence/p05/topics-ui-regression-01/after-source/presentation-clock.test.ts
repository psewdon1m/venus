import {afterEach,describe,expect,it,vi} from 'vitest';
import type {GameView} from '@venus/contracts';
import {PublicGameLease} from './presentation-clock.js';
const auth={room:'room',member:'a',identity:1,transport:1,connected:true};
const game:GameView={session_id:'s',game_rev:1,state:'active',mode:'questions',total_rounds:1,pause_reason:null,current_round:{kind:'generic',round_id:'r',round_index:1,state:'active'}};
const iso=(n:number)=>new Date(n).toISOString();
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('one performance-based presentation clock and separate public content lease',()=>{
 it('keeps advancing with elapsed time after backward or forward wall changes',async()=>{vi.resetModules();let elapsed=1000;const wall=vi.spyOn(Date,'now').mockReturnValue(1000000);vi.stubGlobal('performance',{now:()=>elapsed});const {presentationNow}=await import('./presentation-clock.js');expect(presentationNow()).toBe(1000000);wall.mockReturnValue(-2600000);elapsed+=6000;expect(presentationNow()).toBe(1006000);wall.mockReturnValue(9000000);elapsed+=1000;expect(presentationNow()).toBe(1007000);expect(wall).toHaveBeenCalledTimes(1);});
 it('binds public presentation to identity/transport/revision and rejects an old read after reconnect',()=>{const lease=new PublicGameLease(),read=lease.bind(auth,game);expect(lease.grant(read,1000,1100,iso(100000),iso(105000))).toBe(true);expect(lease.visible(1200)).toBe(true);lease.bind({...auth,transport:2},game);expect(lease.visible(1300)).toBe(false);expect(lease.grant(read,1000,1400,iso(100000),iso(105000))).toBe(false);});
 it('does not extend content beyond shorter own metadata or revive a cleared read',()=>{const lease=new PublicGameLease(),read=lease.bind(auth,game);expect(lease.grant(read,1000,1100,iso(100000),iso(100500))).toBe(true);expect(lease.visible(1501)).toBe(false);lease.clear();expect(lease.grant(read,1600,1700,iso(100000),iso(105000))).toBe(false);expect(game.current_round?.round_id).toBe('r');});
 it('rejects a public HTTP response whose five-second display lease aged in flight',()=>{const lease=new PublicGameLease(),read=lease.bind(auth,game);expect(lease.grant(read,1000,6001,iso(100000),iso(105000))).toBe(false);expect(lease.visible(6001)).toBe(false);});
});
