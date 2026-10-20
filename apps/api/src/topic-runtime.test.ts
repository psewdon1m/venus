import {afterEach,describe,expect,it,vi} from 'vitest';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import type {ReleaseTopicBundle} from '@venus/card-catalog';
import {topicGamesEnabled,releasedRoomTopicProfile,topicStorageDirectories} from './topic-runtime.js';

// Module-isolated trust boundary controls only: no cards or approval records are
// written to either release registry. The release loader has separate tests.
const release=vi.hoisted(()=>({bundles:[] as readonly ReleaseTopicBundle[]}));
vi.mock('@venus/card-catalog',async original=>({...await original<typeof import('@venus/card-catalog')>(),get bundledTopicSources(){return release.bundles;}}));
afterEach(()=>{release.bundles=[];});
const vocabulary=Object.freeze([
 Object.freeze({topic_id:'travel',labels:Object.freeze({ru:'Поездки',en:'Travel',tr:'Seyahat'})}),
 Object.freeze({topic_id:'creative',labels:Object.freeze({ru:'Творчество',en:'Creativity',tr:'Yaratıcılık'})})
]);
function boundary(taxonomy='a'.repeat(64),topics=vocabulary,active=true):ReleaseTopicBundle {
 return Object.freeze({map:Object.freeze({pins:Object.freeze({taxonomy_digest:taxonomy}),topics}),active}) as unknown as ReleaseTopicBundle;
}
describe('ordinary topic runtime configuration and profile compatibility',()=>{
 it('keeps new topic rooms disabled by default and requires an exact explicit flag',()=>{
  expect(topicGamesEnabled(undefined)).toBe(false);expect(topicGamesEnabled('false')).toBe(false);expect(topicGamesEnabled('true')).toBe(true);
 });
 for(const value of ['', '1','0','TRUE','False',' true','true ','yes','null'])it('fails closed for ambiguous enablement '+JSON.stringify(value),()=>{
  expect(()=>topicGamesEnabled(value)).toThrow(expect.objectContaining({code:'TOPIC_GAME_CONFIG_INVALID',statusCode:503}));
 });
 it('does not manufacture a profile for an empty release registry',()=>{expect(releasedRoomTopicProfile()).toBeNull();});
 it('binds a frozen room profile to the released taxonomy and a stable sorted vocabulary',()=>{
  release.bundles=[boundary()];const profile=releasedRoomTopicProfile()!;
  expect(profile.pins.taxonomy).toBe('a'.repeat(64));expect(profile.pins.policy).toMatch(/^[a-f0-9]{64}$/);
  expect(profile.pins.vocabulary).toEqual(['creative','travel']);expect(profile.topics).toBe(vocabulary);
  expect(Object.isFrozen(profile)&&Object.isFrozen(profile.pins)&&Object.isFrozen(profile.pins.vocabulary)).toBe(true);
 });
 it('retains an inactive compatible profile for existing rooms without choosing an active content pack',()=>{
  release.bundles=[boundary(undefined,undefined,false)];const historical=releasedRoomTopicProfile();
  release.bundles=[boundary(),boundary(undefined,undefined,false)];expect(releasedRoomTopicProfile()).toEqual(historical);
 });
 it('refuses a new taxonomy while any incompatible historical release remains, instead of silently reinterpreting old rooms',()=>{
  release.bundles=[boundary(),boundary('b'.repeat(64),undefined,false)];
  expect(()=>releasedRoomTopicProfile()).toThrow(expect.objectContaining({code:'TOPIC_PROFILE_COMPATIBILITY_REQUIRED',statusCode:503}));
 });
 it('does not trust equal taxonomy identifiers with conflicting translated labels',()=>{
  const changed=Object.freeze(vocabulary.map(topic=>Object.freeze({...topic,labels:Object.freeze({...topic.labels,en:'Changed meaning'})})));
  release.bundles=[boundary(),boundary(undefined,changed,false)];
  expect(()=>releasedRoomTopicProfile()).toThrow(expect.objectContaining({code:'TOPIC_PROFILE_COMPATIBILITY_REQUIRED'}));
 });
 it('changes the room policy binding when the taxonomy digest changes',()=>{
  release.bundles=[boundary()];const old=releasedRoomTopicProfile()!;
  release.bundles=[boundary('b'.repeat(64))];expect(releasedRoomTopicProfile()!.pins.policy).not.toBe(old.pins.policy);
 });
 it('refuses a malformed released taxonomy identifier',()=>{
  release.bundles=[boundary('sha256:'+'a'.repeat(64))];expect(()=>releasedRoomTopicProfile()).toThrow(expect.objectContaining({code:'TOPIC_PROFILE_COMPATIBILITY_REQUIRED'}));
 });
 it('uses five distinct operator roots without touching the filesystem',()=>{
  const paths=topicStorageDirectories({});expect(new Set(Object.values(paths)).size).toBe(5);expect(Object.isFrozen(paths)).toBe(true);
  expect(paths.birthDirectory).toBe('/var/lib/venus/topic-births');expect(paths.personalChainDirectory).toBe('/var/lib/venus/topic-personal');
  expect(paths.personalWitnessDirectory).toBe('/var/lib/venus/topic-personal-witness');expect(paths.lifecycleChainDirectory).toBe('/var/lib/venus/topic-lifecycle');
  expect(paths.lifecycleWitnessDirectory).toBe('/var/lib/venus/topic-lifecycle-witness');
 });
 it('permits explicit absolute operator paths without environment-supplied cards or taxonomy',()=>{
  const birth=join(tmpdir(),'venus-operator-root-not-created');expect(topicStorageDirectories({TOPIC_BIRTH_DIRECTORY:birth}).birthDirectory).toBe(birth);
 });
 for(const path of ['', 'relative/root','/'])it('refuses an empty, relative or filesystem-root configuration '+JSON.stringify(path),()=>{
  expect(()=>topicStorageDirectories({TOPIC_PERSONAL_CHAIN_DIRECTORY:path})).toThrow(expect.objectContaining({code:'TOPIC_ROOTS_INVALID',statusCode:503}));
 });
});
