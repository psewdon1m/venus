import {consentAllows,type ConsentOffer} from './consent.js';

/** P05 delivery policy, deliberately separate from the immutable P03 selector.
 * Both intended participants must quietly agree before the room sees their pair.
 * This permits presentation only; it never replaces consent to the action itself.
 */
export function publicPairMayBeExposed(actors:readonly string[],offer:ConsentOffer|null|undefined,now:number):boolean {
  if(actors.length!==2||new Set(actors).size!==2||!offer||offer.scope!=='invitation') return false;
  if(offer.actors.length!==2||new Set(offer.actors).size!==2||offer.actors.some(id=>!actors.includes(id))) return false;
  if(offer.acks.length!==2||new Set(offer.acks).size!==2||offer.acks.some(id=>!actors.includes(id))) return false;
  return actors.every(id=>consentAllows(offer,id,now));
}
