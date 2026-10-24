/** Exact historical feature order; current470public card IDs injected. */
export const publicFeatureNames=publicCards=>[
  ...['group','solo','pair_public','generic'].map(x=>'interaction:'+x),
  ...Array.from({length:8},(_,i)=>'visible_role:'+i),
  ...Array.from({length:8},(_,i)=>'ordered_first:'+i),
  ...Array.from({length:8},(_,i)=>'ordered_second:'+i),
  ...Array.from({length:64},(_,i)=>'ordered_pair:'+Math.floor(i/8)+':'+i%8),
  ...Array.from({length:4},(_,i)=>'private_stage:'+(i+1)),
  ...['pending','active','completed','skipped','stopped'].map(x=>'round_state:'+x),
  ...['pending','accepted','completed','skipped','condition_proposed'].map(x=>'response_state:'+x),
  ...['none','truth','dare'].map(x=>'choice:'+x),
  'frames','last_game_revision','last_stream_revision','elapsed_ticks','serialized_bytes','proposal_revision','generic_frames',
  ...publicCards.map(c=>'card:'+c.id)
];
