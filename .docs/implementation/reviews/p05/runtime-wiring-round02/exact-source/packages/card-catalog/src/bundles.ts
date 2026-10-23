import {canonical,type Card,type PackManifest} from '@venus/relationship-engine';
import registry from './approved-bundles.json' with {type:'json'};
import {reviewedCandidate,requireCatalog,type SignedReview,type HumanReviewer} from './catalog.js';
interface BundleEntry {draft_cards:Card[];cards:Card[];manifest:PackManifest;reviews:SignedReview[];reviewers:HumanReviewer[];author_ids:string[];pack_revision:number}
export function loadReviewedBundles(input:unknown) {
  const value=input as {schema_version:number;approved:BundleEntry[]};
  requireCatalog(value?.schema_version===1&&Array.isArray(value.approved)&&Object.keys(value).sort().join(',')==='approved,schema_version','CATALOG_BUNDLE_REGISTRY_INVALID');
  return Object.freeze(value.approved.map(entry=>{
    const result=reviewedCandidate(entry.draft_cards,entry.reviews,entry.reviewers,entry.author_ids,entry.pack_revision);
    requireCatalog(canonical(result.cards)===canonical(entry.cards)&&canonical(result.manifest)===canonical(entry.manifest),'CATALOG_BUNDLE_REVIEW_BINDING_INVALID');return result.pack;
  }));
}
/** Empty until real independent human records are supplied and the application
 * source containing their exact bundle is reviewed/tested/released. Never hot-loaded. */
export const bundledPacks=loadReviewedBundles(registry);
