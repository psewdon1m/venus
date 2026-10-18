"""P03 acceptance: bound runtime evidence and every preregistered measurement cell."""
import argparse
import json
import math
from pathlib import Path
import subprocess
import sys
from stage_gate import validate as common_validate,read,read_bytes,require
from stage_inventory import ROOT,inventory,identity,digest

RUNTIME_CHECKS={
 'P03-SCHEMA','P03-START-RACE','P03-SNAPSHOT-LOCK','P03-CONSENT-ACL',
 'P03-CONDITION-REVISION','P03-CLOCK-DEADLINE','P03-DISPATCH-FENCE',
 'P03-OLD-RECIPIENT-CLEAR','P03-HTTP-WS-PRIVACY','P03-FINISH-REPLAY',
 'P03-PINNING-RESTART','P03-SQL-SCOPE','P03-DECLINE-RACES',
 'P03-TRANSPORT-RESUME','P03-STOP-LEAVE-CLOSE','P03-BACKUP-RESTORE','P03-ROLLBACK','P03-VERSION-REFUSAL','P03-IDENTITY-NO-SUBSTITUTION'}
SECTIONS={'invariants','fairness','gf','inference'}
MODES={'questions','truth_or_dare','yes_but'}
CONTEXTS={'online','in_person'}

def verify_auc(metric):
    scores=metric['heldout_scores'];require(len(scores)==2,'two held-out score classes required')
    negative,positive=scores;n0=len(negative);n1=len(positive)
    require(n0==metric['n_negative'] and n1==metric['n_positive'] and n0>0 and n1>0 and all(isinstance(x,(int,float)) and math.isfinite(x) for row in scores for x in row),'invalid held-out scores')
    ranked=sorted([(x,0) for x in negative]+[(x,1) for x in positive]);rank_sum=0.;a=0
    while a<len(ranked):
        b=a+1
        while b<len(ranked) and ranked[b][0]==ranked[a][0]:b+=1
        rank_sum+=(a+1+b)/2*sum(label for _,label in ranked[a:b]);a=b
    auc=(rank_sum-n1*(n1+1)/2)/(n0*n1);q1=auc/(2-auc);q2=2*auc*auc/(1+auc)
    variance=(auc*(1-auc)+(n1-1)*(q1-auc*auc)+(n0-1)*(q2-auc*auc))/(n0*n1)
    upper=min(1,auc+1.96*math.sqrt(max(0,variance)))
    require(math.isclose(metric['auc'],auc,abs_tol=1e-10) and math.isclose(metric['ci95'][1],upper,abs_tol=1e-10) and upper<=.65,'held-out scores contradict reported inference bound')

def verify_gf(gf):
    raw=gf['counts'];require(set(raw)=={'both','g_only','f_only','neither'} and all(isinstance(v,int) and v>=0 for v in raw.values()),'invalid paired outcome counts')
    n=sum(raw.values());require(n==gf['n']==1000000,'paired opportunity count insufficient')
    pg=(raw['both']+raw['g_only'])/n;pf=(raw['both']+raw['f_only'])/n
    require(pg>0 and pf>0,'zero paired denominator')
    vg=n/(n-1)*pg*(1-pg);vf=n/(n-1)*pf*(1-pf);cov=n/(n-1)*(raw['both']/n-pg*pf)
    variance=(vg/pg**2+vf/pf**2-2*cov/(pg*pf))/n
    require(math.isfinite(variance) and variance>=-1e-14,'invalid paired covariance')
    lower=math.exp(math.log(pg/pf)-1.96*math.sqrt(max(0,variance)))
    require(lower>1 and math.isclose(gf['ratio'],pg/pf,abs_tol=1e-10) and math.isclose(gf['ci95'][0],lower,abs_tol=1e-10),'paired raw counts contradict G/F bound')

def cells(rows,sizes):
    actual=[(r['size'],r['mode'],r['context']) for r in rows]
    expected={(n,m,c) for n in sizes for m in MODES for c in CONTEXTS}
    require(len(actual)==len(expected) and set(actual)==expected,'missing/duplicate measurement stratum')

def validate_statistics(root,report):
    """Validate independent statistical records without trusting their top-level PASS."""
    sha=report['source_sha'];cid=report['source_identity_sha256']
    protocol=read(root,report['measurement_protocol'])
    require(protocol['protocol_revision']=='P03-M2','unknown measurement protocol')
    declared=read(root,report['measurement_inputs'])
    require(declared['protocol_revision']=='P03-M2','measurement design not pinned')
    for path,expected in declared['raw_input_sha256'].items():
        require(digest((root/path).read_bytes())==expected,'changed measured input: '+path)
        pinned=subprocess.check_output(['git','show',protocol['preregistration_tag']+':'+path],cwd=root)
        require(digest(pinned)==expected,'measured input differs from preregistration: '+path)
    measurements=report['measurements'];require(set(measurements)==SECTIONS,'all four statistical sections required')
    results={}
    for section,item in measurements.items():
        value=read(root,item)
        require(value['status']=='PASS' and value['gating'] is True and value['probe'] is False and value['section']==section,'partial/probe/failed statistical run')
        require(value['source_sha']==value['source_after_sha']==sha and value['source_identity_sha256']==value['source_identity_after_sha256']==cid and value['source_dirty'] is False,'statistical source changed or dirty')
        require(value['protocol_sha256']==report['measurement_protocol']['sha256'] and value['pack_digest']==declared['pack_digest'],'statistical protocol/pack mismatch')
        require(value['preregistered_input_descriptor']==declared and value['preregistered_raw_inputs_after']==declared['raw_input_sha256'] and value['input_sha256']==value['input_sha256_after'] and value['source_dirty_after'] is False,'measurement inputs changed during execution')
        require(value['fresh_build']=='tsc -b --force BEFORE dynamic runtime imports','measured runtime not freshly built')
        require(set(value['results'])=={section} and value['results'][section]['status']=='PASS','statistical result missing/failed')
        results[section]=value['results'][section]
    inv=results['invariants'];require(inv['sessions']==70000 and inv['violations']==[],'70000 zero-violation sessions required')
    require(len(inv['sizes'])==7 and {r['size'] for r in inv['sizes']}==set(range(2,9)) and all(r['sessions']==10000 and r['completed']+r['safe_refusals']==10000 for r in inv['sizes']),'per-size simulation coverage insufficient')
    checks=inv['invariants'];require(len(checks)==15 and {r['id'] for r in checks}=={'I'+str(n).zfill(2) for n in range(1,16)} and all(r['violations']==0 for r in checks),'fifteen independent invariant records required')
    require(all(r['checks']>0 or r['runtime_evidence_required'] for r in checks),'unexecuted invariant silently passed')
    fair=results['fairness'];cells(fair['strata'],range(2,9))
    for row in fair['strata']:
        require(row['status']=='PASS' and row['sessions']==2000 and row['K']>0 and row['D']==2*row['K'],'fairness denominator/sample invalid')
        require(row['max_individual_session_share']<=.5 and row['aggregate_player_share_gap']<=.02,'fairness threshold violated')
        counts=row['invitation_counts'];require(len(counts)==row['size'] and sum(counts)==row['D'],'fairness raw count mismatch')
        require(math.isclose((max(counts)-min(counts))/row['D'],row['aggregate_player_share_gap'],abs_tol=1e-12),'fairness gap contradicts raw counts')
    gf=results['gf'];require(gf['pF']>0 and gf['pG']>0 and gf['ci95'][0]>1,'G/F paired threshold failed');verify_gf(gf)
    infer=results['inference'];require(len(infer['comparisons'])==3 and {r['comparison'] for r in infer['comparisons']}=={'FG','FM','GM'},'inference comparisons incomplete')
    for comparison in infer['comparisons']:
        require(comparison['status']=='PASS' and comparison['pooled']['status']=='PASS' and comparison['pooled']['ci95'][1]<=.65,'pooled inference bound failed')
        verify_auc(comparison['pooled'])
        require(comparison['pooled']['n_negative']==comparison['pooled']['n_positive']==16800,'pooled inference sample insufficient')
        cells(comparison['strata'],range(2,9))
        for row in comparison['strata']:
            require(row['train_per_class']==100 and row['holdout_per_class']==400 and row['n_negative']==row['n_positive']==400,'inference sample insufficient')
            require(row['status']=='PASS' and row['ci95'][1]<=.65 and row['structural_deterministic_decoders']==[],'inference cell or structural decoder failed')
            verify_auc(row)
    return results

def validate(root,report):
    errors=common_validate(root,report,stage='P03')
    try:
        integration=read(root,report['p03_integration']);runner=read(root,report['p03_runner'])
        require(integration['source_sha']==report['source_sha'] and integration['source_dirty'] is False and integration['synthetic'] is True and integration['status']=='PASS','P03 integration source/clean result mismatch')
        rows=integration['tests'];require(len(rows)==len(RUNTIME_CHECKS) and {r['id'] for r in rows}==RUNTIME_CHECKS and all(r['status']=='PASS' for r in rows),'P03 runtime obligations incomplete')
        require(runner['source_sha']==report['source_sha'] and runner['source_dirty'] is False and runner['status']=='PASS' and runner['cleanup']=='completed','P03 runner source/cleanup failed')
        details={r['id']:r.get('detail',{}) for r in rows}
        expected={
          'P03-DISPATCH-FENCE':{'committed_decline_before_dispatch':True,'only_clear_delivered':True},
          'P03-OLD-RECIPIENT-CLEAR':{'clear_delivered':True},
          'P03-FINISH-REPLAY':{'same_key_replay_after_advance':True,'both_alias_directions':True,'cross_alias_changed_body_rejected':True},
          'P03-VERSION-REFUSAL':{'unknown_policy_rejected':True,'unknown_snapshot_pack_rejected':True,'pinned_pack_retained_without_current_provider':True,'new_game_without_provider_rejected':True,'empty_safe_pool_no_round':True,'x_veto_preserved':True},
          'P03-IDENTITY-NO-SUBSTITUTION':{'same_name':True,'new_uuid':True,'old_cookie_revoked':True,'new_actor_http_denied':True,'no_private_ws':True,'snapshot_unchanged':True},
          'P03-TRANSPORT-RESUME':{'snapshot_unchanged':True,'old_consent_not_revived':True,'safety_requires_host_resume':True},
          'P03-STOP-LEAVE-CLOSE':{'room_close_private_wipe':True},
          'P03-BACKUP-RESTORE':{'encrypted_roundtrip':True,'seven_day_expiry':True,'external_closed_ledger_reapplied':True,'expired_scopes_revoked_before_access':True,'private_condition_erased':True},
          'P03-ROLLBACK':{'previous_source':'12a028b174cc03a4a8ea1398f321d23c6a4c6e98','api_stopped_before_quiesce':True,'core_identities_preferences_unchanged':True,'old_room_leave_close_work':True,'old_close_requires_synthetic_offer':True,'old_consent_not_revived':True,'new_session_seed':True}}
        for key,fields in expected.items():require(all(details[key].get(k)==v for k,v in fields.items()),'insufficient P03 runtime proof: '+key)
        validate_statistics(root,report)
    except (KeyError,TypeError,ValueError,OSError,subprocess.SubprocessError) as error:errors.append(str(error))
    return errors

def main():
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['identity','freeze','verify']);args=parser.parse_args()
    directory=ROOT/'.docs/implementation/evidence/p03'
    if args.mode=='identity':print(identity(inventory()));return 0
    if args.mode=='freeze':
        files=inventory();directory.mkdir(parents=True,exist_ok=True)
        data={'source_sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'source_identity_sha256':identity(files),'files':files}
        (directory/'inputs.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8');print(data['source_identity_sha256']);return 0
    errors=validate(ROOT,json.loads((directory/'gate-report.json').read_text('utf-8')))
    for error in errors:print('ERROR',error)
    print('FAIL' if errors else 'PASS: EXIT-P03 source/CI/runtime/preregistered measurements/independent reviews bound')
    return int(bool(errors))

if __name__=='__main__':sys.exit(main())
