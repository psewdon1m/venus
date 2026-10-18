#!/usr/bin/env python3
"""Validate invariant shape and behavior of design Relationship Engine policy RE-1.

This is NOT a runtime relationship/privacy/inference acceptance test.
"""
from pathlib import Path
import json
import math
import sys

ROOT=Path(__file__).resolve().parents[1]
policy=json.loads((ROOT/'.docs/contracts/relationship-policy.v1.json').read_text('utf-8'))
err=[]
def E(message):err.append(message)
labels=policy.get('labels',[])
expected={'just_met','friendship','crush','situationship','in_relationships','not_a_friend'}
classes=['X','J','F','G','M','S','R']
if set(labels)!=expected or len(labels)!=6:E('six directed labels must be complete')
matrix=policy.get('pair_class_matrix',{})
if set(matrix)!=expected:E('incomplete matrix rows')
for a in labels:
    row=matrix.get(a,{})
    if set(row)!=expected:E(f'incomplete matrix columns for {a}')
    for b in labels:
        current=row.get(b)
        other=matrix.get(b,{}).get(a)
        if current not in classes:E(f'invalid matrix code {a}/{b}')
        if other!=current:E(f'matrix must be symmetric classification {a}/{b}')
        if (a=='not_a_friend' or b=='not_a_friend') and current!='X':
            E(f'veto violated {a}/{b}')
if matrix['crush']['friendship']!='G':E('one-sided crush cannot collapse into friendship')
if matrix['crush']['crush']!='M':E('mutual crush requires M')
if matrix['in_relationships']['in_relationships']!='R':E('couple both-confirmed rule')
for a in labels:
    for b in labels:
        if matrix[a][b]=='R' and (a,b)!=('in_relationships','in_relationships'):
            E('only mutual confirmed pair may be R')
weights=policy['pair_weight_by_class']
if set(weights)!=set(classes):E('missing numeric class weights')
if not all(isinstance(weights[x],(int,float)) and not isinstance(weights[x],bool) and math.isfinite(weights[x]) for x in classes):
    E('weight finite numeric types only')
else:
    if not weights['X']==0 or not all(weights[a]<weights[b] for a,b in zip(classes[1:],classes[2:])):
        E('weight escalation broken or veto weight nonzero')
c=policy['comfort']
if (c['min'],c['max'],c['default'],c['max_for_physical_contact'])!=(0,4,0,4):E('comfort 0..4 default 0')
if not c['applies_globally_per_member'] or not c['frozen_after_session_start']:
    E('global comfort and immutable snapshot required')
p=policy['progression']
if p['stage_boundary_positions'] != [0.0,0.25,0.5,0.75,1.0]:E('stage ranges broken')
for N in (1,2,3,4,5,20,100):
    stages=[]
    for r in range(1,N+1):
        pos=(r-1)/max(1,N-1)
        stage=1+sum(pos>=x for x in (0.25,0.5,0.75))
        stages.append(stage)
    if stages!=sorted(stages) or stages[0]!=1 or (N>=4 and stages[-1]!=4):
        E(f'progression incorrect N={N} {stages}')
if p['minimum_stage_for_private_pair']!=3 or p['minimum_comfort_for_private_pair']!=1:E('private guards mismatch')
if p['private_hard_max_share_per_session']>0.25:E('too frequent private invites')
if set(policy['locale_codes'])!={'ru','en','tr'} or len(policy['modes'])!=3:E('language/modes mismatch')
if (policy['max_members_in_room'],policy['min_game_players'],policy['max_game_players'])!=(8,2,8):E('room size mismatch')
if not (policy['forbid_physical_contact_online'] and policy['forbid_going_away_online'] and policy['consent']['revocable'] and policy['consent']['decline_wins_race']):
    E('hard safety gate missing')
# Cross-check the 36 authoritative documented classifications against policy JSON.
engine_doc=(ROOT/'.docs/08_RELATIONSHIP_ENGINE.md').read_text('utf-8')
import re
short={'JM':'just_met','FR':'friendship','CR':'crush','SS':'situationship','IR':'in_relationships','NF':'not_a_friend'}
matched_rows=0
for row in engine_doc.splitlines():
    m=re.fullmatch(r'\| \*\*(JM|FR|CR|SS|IR|NF)\*\* \| ([XJFGMSR]) \| ([XJFGMSR]) \| ([XJFGMSR]) \| ([XJFGMSR]) \| ([XJFGMSR]) \| ([XJFGMSR]) \|',row.strip())
    if not m:continue
    matched_rows+=1
    for col,actual in zip(['JM','FR','CR','SS','IR','NF'],m.groups()[1:]):
        expected_value=matrix[short[m.group(1)]][short[col]]
        if actual!=expected_value:E(f'RE spec matrix mismatch row {m.group(1)}, col {col}: doc={actual}, policy={expected_value}')
if matched_rows!=6:E(f'RE spec must contain exactly six matrix rows, found {matched_rows}')

print(f'Checked RE-1 six labels × six = 36 directed combinations; errors={len(err)}')
for problem in err:print('ERROR',problem)
if err:sys.exit(1)
print('PASS: policy config invariants only. Actual consent/access/inference requires app tests.')
