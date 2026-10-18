/** Machine fixtures ONLY. No named human reviewer, no production-approved cards. */
export function syntheticCards() {
  const cards=[];
  for(const [mode,prefix] of [['questions','Q'],['truth_or_dare','TD'],['yes_but','YB']]) for(let i=1;i<=200;i++) {
    const privatePair=i>100,interaction=privatePair?'pair_private':mode==='yes_but'?'pair_public':['group','solo','pair_public'][i%3];
    const comfort=privatePair?1+i%4:0,physical=privatePair&&comfort===4&&i%3===0,goingAway=privatePair&&i%4===3&&i%5===0;
    const contexts=physical||goingAway?['in_person']:['online','in_person'];
    const scope=privatePair?['friend_or_more','gentle_initiative','mutual_romantic','established_couple'][i%4]:interaction.startsWith('pair_')?'acquaintance':'none';
    const text={};for(const locale of ['ru','en','tr']) {
      const marker=`SYNTHETIC ${locale.toUpperCase()} ${prefix}-${i}. `,roles=interaction==='group'?'Neutral group test.':interaction==='solo'?'Neutral {P1} test.':'Neutral {P1} and {P2} test.';
      text[locale]=mode==='questions'?{question:marker+roles}:mode==='truth_or_dare'?{truth:marker+'Truth '+roles,dare:marker+'Dare '+roles}:{proposal:marker+roles,responder:marker+'Choose yes, condition, or decline.'};
    }
    cards.push({schema_version:1,id:prefix+'-'+String(i).padStart(4,'0'),revision:1,pack_id:'venus-p03-synthetic',mode,status:'draft',category:comfort>=2?'romance':'icebreaker',interaction,participants_required:interaction==='group'?0:interaction==='solo'?1:2,meeting_contexts:contexts,relationship_scope:scope,min_comfort:comfort,min_progression_stage:privatePair?3:1,consent:interaction.startsWith('pair_')?'bilateral':'individual',requires_physical_contact:physical,requires_going_away:goingAway,required_capabilities:privatePair&&contexts.includes('online')?['private_text_chat']:[],safety_tags:[comfort>=2?'romantic':'neutral',...(privatePair?['private']:[]),...(physical?['physical_contact']:[])],expected_duration_seconds:60,text,authoring:{origin:'agent',batch_id:'P03-SYNTHETIC-FIXTURE',created_at:'2026-10-18T00:00:00Z',reviewed_by:null,reviewed_at:null,rights_status:'needs_review',policy_revision:'RE-1',instruction_revision:1,source_notes:'Synthetic machine test only; no human or production approval.'}});
  }
  return cards;
}
export function syntheticManifest(cards,digest,policyDigest,revision=1) {
  const payload={schema_version:1,pack_id:'venus-p03-synthetic',pack_revision:revision,content_contract_revision:'CARD-1',policy_revision:'RE-1',policy_sha256:policyDigest.slice(7),status:'illustrative_draft_candidate',locale_codes:['ru','en','tr'],total_cards:cards.length,reviewed_cards:0,mode_counts:Object.fromEntries(['questions','truth_or_dare','yes_but'].map(mode=>[mode,cards.filter(c=>c.mode===mode).length])),category_counts:{},eligibility_cell_counts:{},cards:cards.map(c=>({id:c.id,revision:c.revision,sha256:digest(c),status:c.status})).sort((a,b)=>a.id.localeCompare(b.id)),caveats:['SYNTHETIC MACHINE FIXTURE; never human reviewed or published']};
  return {...payload,canonical_payload_sha256:digest(payload)};
}
export const playerId=i=>String(i+1).padStart(8,'0')+'-0000-4000-8000-000000000000';
