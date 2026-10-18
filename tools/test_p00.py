"""P00 specification tests; synthetic fixtures, no product readiness claim."""
from __future__ import annotations
import copy
import itertools
import json
from pathlib import Path
import unittest
import csv
from jsonschema import Draft202012Validator, FormatChecker
from p00_rules_reference import (Consent, eligible, resolve_pair, progression_stage, respond, can_read_private_prompt,
                                propose_condition, open_action, pair_response, action_is_consented, choose_side, SideChoice, entry_allowed, can_resume_game)

ROOT = Path(__file__).resolve().parents[1]
UID = ['00000000-0000-4000-8000-' + f'{i:012d}' for i in range(1, 9)]
PROJECTIONS = json.loads((ROOT/'.docs/contracts/projections.v1.schema.json').read_text('utf-8'))
EVENTS = json.loads((ROOT/'.docs/contracts/events.v1.schema.json').read_text('utf-8'))
API = json.loads((ROOT/'.docs/contracts/api.v1.openapi.json').read_text('utf-8'))
FORMATS = FormatChecker()

def validator(name):
    return Draft202012Validator({'$defs': PROJECTIONS['$defs'], '$ref': '#/$defs/'+name}, format_checker=FORMATS)

def reviewed(filename):
    """In-memory synthetic review only; never write or approve source drafts."""
    c = json.loads((ROOT/'.docs/examples/cards'/filename).read_text('utf-8'))
    c['status'] = 'reviewed'
    c['authoring'].update(origin='human', reviewed_by='synthetic-test-reviewer', reviewed_at='2026-10-18T00:00:00Z', rights_status='original_verified', source_notes='SYNTHETIC in-memory fixture only; not a real reviewed card.')
    return c

def check(card, **overrides):
    args=dict(mode=card['mode'], context='online', actor_ids=UID[:2], comfort={a:4 for a in UID},
              edges={(UID[0],UID[1]):'in_relationships',(UID[1],UID[0]):'in_relationships'},
              round_index=20,total_rounds=20,capabilities={'private_text_chat'})
    args.update(overrides)
    return eligible(card,**args)

class ReferenceRulesTests(unittest.TestCase):
    def test_all_36_classes_against_independent_golden_matrix(self):
        labels=['just_met','friendship','crush','situationship','in_relationships','not_a_friend']
        golden=['JJJJJX','JFGGGX','JGMMMX','JGMSSX','JGMSRX','XXXXXX']
        for a,row in zip(labels,golden):
            for b,want in zip(labels,row):
                self.assertEqual(resolve_pair(a,b),want,(a,b))

    def test_defaults_and_unknown_labels(self):
        self.assertEqual(resolve_pair(None,None),'F')
        for bad in ('romance',0,False,[],{}):
            with self.subTest(bad=bad), self.assertRaises(ValueError): resolve_pair(bad,'friendship')

    def test_progression_golden_boundaries(self):
        for total,want in [(1,[1]),(2,[1,4]),(3,[1,3,4]),(5,[1,2,3,4,4]),(20,[1]*5+[2]*5+[3]*5+[4]*5)]:
            self.assertEqual([progression_stage(r,total) for r in range(1,total+1)],want)
        self.assertEqual(progression_stage(100,100),4)

    def test_progression_all_supported_round_counts(self):
        from fractions import Fraction
        for n in range(1,101):
            for r in range(1,n+1):
                pos=Fraction(r-1,max(1,n-1))
                want=1+sum(pos>=x for x in (Fraction(1,4),Fraction(1,2),Fraction(3,4)))
                self.assertEqual(progression_stage(r,n),want)

    def test_progression_invalid_inputs_fail_closed(self):
        for r,n in [(0,20),(21,20),(1,0),(1,101),(True,2),(1,False),(1.0,20)]:
            with self.assertRaises(ValueError): progression_stage(r,n)

    def test_unilateral_crush_never_overrides_receiver_comfort(self):
        c=reviewed('YB-0002.json')
        e={(UID[0],UID[1]):'crush',(UID[1],UID[0]):'friendship'}
        self.assertFalse(check(c,edges=e,comfort={UID[0]:4,UID[1]:1}))
        self.assertTrue(check(c,edges=e,comfort={UID[0]:2,UID[1]:2}))

    def test_veto_in_either_direction_exhaustive_comforts(self):
        c=reviewed('YB-0001.json')
        for level in range(5):
            for a,b in [('not_a_friend','crush'),('crush','not_a_friend')]:
                self.assertFalse(check(c,edges={(UID[0],UID[1]):a,(UID[1],UID[0]):b},comfort={x:level for x in UID}))

    def test_context_comfort_stage_guards_exhaustive(self):
        c=reviewed('TD-0004.json')
        for ctx,ca,cb,r in itertools.product(('online','in_person'),range(5),range(5),(1,6,11,20)):
            got=check(c,context=ctx,comfort={UID[0]:ca,UID[1]:cb},round_index=r)
            want=(ctx=='in_person' and min(ca,cb)>=c['min_comfort'] and progression_stage(r,20)>=max(3,c['min_progression_stage']))
            self.assertEqual(got,want,(ctx,ca,cb,r))

    def test_private_requires_capability_stage_and_compatible_relation(self):
        c=reviewed('YB-0004.json')
        self.assertTrue(check(c))
        self.assertFalse(check(c,capabilities=set()))
        self.assertFalse(check(c,round_index=1))
        self.assertFalse(check(c,edges={(UID[0],UID[1]):'just_met'}))

    def test_draft_malformed_or_mismatched_card_never_eligible(self):
        draft=json.loads((ROOT/'.docs/examples/cards/YB-0002.json').read_text('utf-8'))
        self.assertFalse(check(draft))
        for change in ({'text':None},{'min_comfort':False},{'meeting_contexts':[]},{'consent':'none'}):
            c=reviewed('YB-0002.json');c.update(change)
            self.assertFalse(check(c))
        self.assertFalse(check(reviewed('YB-0002.json'),mode='questions'))

    def test_affected_group_uses_every_actors_comfort(self):
        c=reviewed('Q-0001.json')
        self.assertTrue(check(c,actor_ids=UID,comfort={a:0 for a in UID}))
        self.assertFalse(check(c,actor_ids=UID,comfort={a:0 for a in UID[:-1]}))

    def test_invalid_actors_and_caps_fail_closed(self):
        c=reviewed('YB-0002.json')
        for actors in ([],[UID[0]],[UID[0],UID[0]],[UID[0],UID[1],UID[2]]):
            self.assertFalse(check(c,actor_ids=actors))
        self.assertFalse(check(c,comfort={UID[0]:True,UID[1]:4}))
        self.assertFalse(check(c,capabilities=None))

    def test_input_not_mutated(self):
        c=reviewed('YB-0002.json');before=copy.deepcopy(c)
        check(c)
        self.assertEqual(c,before)

class ConsentReferenceTests(unittest.TestCase):
    def pending(self): return Consent(tuple(UID[:2]),30)

    def test_two_distinct_acks_required(self):
        c=respond(self.pending(),UID[0],'accept',1)
        self.assertEqual(c.state,'pending')
        self.assertEqual(respond(c,UID[0],'accept',2).state,'pending')
        self.assertEqual(respond(c,UID[1],'accept',3).state,'active')

    def test_decline_wins_all_serial_orders(self):
        actions=[(UID[0],'accept'),(UID[1],'accept'),(UID[1],'decline')]
        for order in itertools.permutations(actions):
            c=self.pending()
            for at,(actor,decision) in enumerate(order,1): c=respond(c,actor,decision,at)
            self.assertIn(c.state,('declined','stopped'))
            self.assertFalse(can_read_private_prompt(c,UID[0],c.last_at))

    def test_timeout_exact_boundary_is_not_accept(self):
        c=respond(self.pending(),UID[0],'accept',29)
        self.assertEqual(respond(c,UID[1],'accept',30).state,'expired')

    def test_host_or_stranger_cannot_ack_or_read(self):
        with self.assertRaises(PermissionError): respond(self.pending(),UID[2],'accept',1)
        self.assertFalse(can_read_private_prompt(self.pending(),UID[2],0))

    def test_prompt_only_active_and_revocable(self):
        c=respond(self.pending(),UID[0],'accept',1)
        self.assertFalse(can_read_private_prompt(c,UID[0],c.last_at))
        c=respond(c,UID[1],'accept',2)
        self.assertTrue(can_read_private_prompt(c,UID[0],c.last_at))
        self.assertFalse(can_read_private_prompt(c,UID[2],c.last_at))
        c=respond(c,UID[0],'stop',3)
        self.assertFalse(can_read_private_prompt(c,UID[1],c.last_at))
        self.assertEqual(respond(c,UID[1],'accept',4).state,'stopped')

    def test_invalid_and_backwards_time_rejected(self):
        c=respond(self.pending(),UID[0],'accept',5)
        for decision,at in [('accept',4),('auto',6),('accept',True)]:
            with self.assertRaises(ValueError): respond(c,UID[1],decision,at)
        with self.assertRaises(ValueError): Consent(tuple(UID[:2]),30,state='active')
        with self.assertRaises(ValueError): respond(self.pending(),UID[0],'finish',1)

class ContractSchemaTests(unittest.TestCase):
    def test_schemas_compile(self):
        Draft202012Validator.check_schema(PROJECTIONS)
        Draft202012Validator.check_schema(EVENTS)
        for schema in API['components']['schemas'].values(): Draft202012Validator.check_schema(schema)

    def test_generic_private_status_cannot_leak_content_or_actor(self):
        base={'kind':'generic','round_id':UID[0],'round_index':1,'state':'pending'}
        self.assertTrue(validator('PublicRound').is_valid(base))
        for key,value in [('card_id','YB-0004'),('actors',UID[:2]),('text',{'question':'secret'}),('declined_by',UID[1]),('comfort',4)]:
            self.assertFalse(validator('PublicRound').is_valid({**base,key:value}),key)

    def test_public_member_rejects_private_extra_fields(self):
        member={'id':UID[0],'display_name':'Synthetic','locale':'tr','role':'member','presence':'online','setup_ready':True}
        self.assertTrue(validator('Member').is_valid(member))
        for key in ('edges','comfort','encrypted_snapshot','initiator_hint'):
            self.assertFalse(validator('Member').is_valid({**member,key:{}}))

    def test_own_preferences_preserve_explicit_flag(self):
        pref={'owner_member_id':UID[0],'comfort':0,'edges':{UID[1]:{'relation':'friendship','explicit':False}},'ready':True,'locked':False,'rev':1}
        self.assertTrue(validator('SelfPreferences').is_valid(pref))
        pref['edges'][UID[1]].pop('explicit')
        self.assertFalse(validator('SelfPreferences').is_valid(pref))

    def test_private_event_cannot_be_broadcast(self):
        event={'schema':1,'event_id':UID[0],'room_id':UID[1],'room_rev':1,'stream':'private','stream_rev':1,'type':'game.consent_requested','server_time':'2026-10-18T00:00:00Z','audience':'member','target_member_id':UID[0],'payload':{'offer_id':UID[2],'session_id':UID[3],'round_id':UID[4],'expires_at':'2026-10-18T00:00:30Z','invitation':'Synthetic offer','own_state':'pending','proposal_revision':1,'consent_scope':'invitation'}}
        v=Draft202012Validator(EVENTS,format_checker=FORMATS)
        self.assertTrue(v.is_valid(event))
        bad=copy.deepcopy(event);bad['audience']='room'
        self.assertFalse(v.is_valid(bad))
        bad=copy.deepcopy(event);bad.pop('target_member_id')
        self.assertFalse(v.is_valid(bad))
        bad=copy.deepcopy(event);bad['payload']['prompt']='secret before acceptance'
        self.assertFalse(v.is_valid(bad))

    def test_request_identity_cannot_be_forged_by_body(self):
        root={'components':API['components'],'$ref':'#/components/schemas/RoundResponse'}
        v=Draft202012Validator(root,format_checker=FORMATS)
        body={'kind':'decline','request_id':UID[0]}
        self.assertTrue(v.is_valid(body))
        self.assertFalse(v.is_valid({**body,'actor_member_id':UID[1]}))

    def test_no_sensitive_fields_in_error(self):
        base={'code':'GAME_SETTINGS_LOCKED','message':'Settings locked','request_id':UID[0]}
        self.assertTrue(validator('Error').is_valid(base))
        self.assertFalse(validator('Error').is_valid({**base,'edges':{'secret':'crush'}}))

    def test_round_count_and_revision_bounds(self):
        root={'components':API['components'],'$ref':'#/components/schemas/PrepareGame'}
        v=Draft202012Validator(root,format_checker=FORMATS)
        body={'mode':'questions','players':UID[:2],'round_count':20,'expected_rev':0,'idempotency_key':UID[2]}
        self.assertTrue(v.is_valid(body))
        for n in (0,101,True): self.assertFalse(v.is_valid({**body,'round_count':n}))
        self.assertFalse(v.is_valid({**body,'expected_rev':2**53}))

    def test_profile_patch_cannot_be_empty_or_assign_role(self):
        root={'components':API['components'],'$ref':'#/components/schemas/ProfilePatch'}
        v=Draft202012Validator(root,format_checker=FORMATS)
        body={'expected_rev':1,'idempotency_key':UID[0]}
        self.assertFalse(v.is_valid(body))
        self.assertTrue(v.is_valid({**body,'locale':'tr'}))
        self.assertFalse(v.is_valid({**body,'locale':'tr','role':'host'}))

    def test_invite_resolution_does_not_expose_members(self):
        root={'components':API['components'],'$ref':'#/components/schemas/InviteResolution'}
        v=Draft202012Validator(root,format_checker=FORMATS)
        body={'room_id':UID[0],'availability':'joinable'}
        self.assertTrue(v.is_valid(body))
        self.assertFalse(v.is_valid({**body,'members':[UID[1]]}))

class TraceabilityNegativeTests(unittest.TestCase):
    def rows(self):
        with (ROOT/'.docs/implementation/traceability.csv').open(encoding='utf-8',newline='') as f:
            return list(csv.DictReader(f))

    def test_missing_upstream_requirement_is_detected(self):
        from check_p00 import check_rows
        rows=[r for r in self.rows() if r['requirement_id']!='REL-01']
        self.assertTrue(any('REL-01' in e for e in check_rows(ROOT,rows)))

    def test_stale_source_and_fake_pass_are_detected(self):
        from check_p00 import check_rows
        rows=self.rows(); rows[0]['source_sha256']='0'*64; rows[0]['status']='VERIFIED'
        errors=check_rows(ROOT,rows)
        self.assertTrue(any('stale source hash' in e for e in errors))
        self.assertTrue(any('VERIFIED without evidence' in e for e in errors))

    def test_broken_schema_reference_is_detected(self):
        from check_p00 import local_refs
        self.assertTrue(local_refs({'$ref':'#/$defs/NotPresent'}))

    def test_missing_formal_invariant_is_detected(self):
        from check_p00 import check_rows
        rows=[r for r in self.rows() if r['requirement_id']!='PLAN-RE-INV-01']
        self.assertTrue(any('PLAN-RE-INV-01' in e for e in check_rows(ROOT,rows)))

class RoundProtocolRegressionTests(unittest.TestCase):
    def channel(self):
        c=respond(Consent(tuple(UID[:2]),30),UID[0],'accept',1)
        return respond(c,UID[1],'accept',2)

    def test_active_expiry_boundary_and_replayed_accept_never_extend(self):
        c=self.channel()
        self.assertEqual(c.active_until,182)
        self.assertTrue(can_read_private_prompt(c,UID[0],181))
        self.assertFalse(can_read_private_prompt(c,UID[0],182))
        self.assertFalse(can_read_private_prompt(c,UID[0],1000))
        self.assertEqual(respond(c,UID[0],'accept',10).active_until,182)
        self.assertEqual(respond(c,UID[0],'finish',182).state,'expired')

    def test_invitation_does_not_consent_to_hidden_action(self):
        pair=open_action(self.channel(),2)
        self.assertFalse(action_is_consented(pair,2))
        pair=pair_response(pair,UID[0],'action','accept',3)
        self.assertFalse(action_is_consented(pair,3))
        pair=pair_response(pair,UID[1],'action','accept',4)
        self.assertTrue(action_is_consented(pair,4))
        self.assertFalse(action_is_consented(pair,182))
        pair=pair_response(pair,UID[0],'invitation','finish',5)
        self.assertFalse(action_is_consented(pair,5))

    def test_action_authorization_never_precedes_latest_ack(self):
        pair=open_action(self.channel(),2)
        pair=pair_response(pair,UID[0],'action','accept',9)
        pair=pair_response(pair,UID[1],'action','accept',10)
        self.assertFalse(action_is_consented(pair,9))
        self.assertTrue(action_is_consented(pair,10))
        self.assertFalse(action_is_consented(pair,True))

    def test_safety_pause_cannot_be_bypassed_by_reconnect(self):
        valid={'same_identity':True,'membership_valid':True,'consent_reconciled':True}
        self.assertFalse(can_resume_game('safety','reconnect',**valid))
        self.assertTrue(can_resume_game('transport','reconnect',**valid))
        self.assertFalse(can_resume_game('transport','reconnect',same_identity=False,membership_valid=True,consent_reconciled=True))
        self.assertFalse(can_resume_game('safety','host_resume',is_host=False,**valid))
        self.assertTrue(can_resume_game('safety','host_resume',is_host=True,**valid))
        self.assertFalse(can_resume_game('transport','reconnect',same_identity=True,membership_valid=True,consent_reconciled=False))

    def test_private_condition_after_reveal_resets_action_acks(self):
        from dataclasses import replace
        pair=open_action(self.channel(),2)
        pair=pair_response(pair,UID[0],'action','accept',3)
        action=propose_condition(pair.action,UID[1],'Только короткий разговор',4,1)
        self.assertEqual(action.accepted,frozenset())
        self.assertEqual(action.proposal_revision,2)
        pair=replace(pair,action=action)
        with self.assertRaises(ValueError):pair_response(pair,UID[0],'action','accept',5,1)
        pair=pair_response(pair,UID[0],'action','accept',5,2)
        pair=pair_response(pair,UID[1],'action','accept',6,2)
        self.assertTrue(action_is_consented(pair,6))
        self.assertTrue(can_read_private_prompt(pair.invitation,UID[1],6))

    def test_condition_only_responder_bounded_pending_and_current(self):
        action=open_action(self.channel(),2).action
        with self.assertRaises(PermissionError):propose_condition(action,UID[0],'x',3,1)
        for text in ('','   ','x'*2001):
            with self.assertRaises(ValueError):propose_condition(action,UID[1],text,3,1)
        with self.assertRaises(ValueError):propose_condition(action,UID[1],'x',32,1)
        with self.assertRaises(ValueError):propose_condition(action,UID[1],'x',3,2)

    def test_side_choice_actor_mode_and_immutability(self):
        c=choose_side(SideChoice(UID[0]),UID[0],'truth')
        self.assertEqual(choose_side(c,UID[0],'truth'),c)
        with self.assertRaises(ValueError):choose_side(c,UID[0],'dare')
        with self.assertRaises(PermissionError):choose_side(c,UID[1],'truth')
        with self.assertRaises(ValueError):choose_side(SideChoice(UID[0],mode='questions'),UID[0],'truth')

    def test_entry_declaration_is_explicit_current_and_not_a_placeholder(self):
        approved={'approved_version':'test-offer-1','approved_sha256':'a'*64}
        a={'offer_version':'test-offer-1','offer_digest':'sha256:'+'a'*64,'accept_offer':True,'adult18':True}
        self.assertTrue(entry_allowed(a,approved))
        for key,value in [('accept_offer',False),('adult18',False),('adult18',1),('offer_version','old'),('offer_digest','sha256:'+'b'*64)]:
            self.assertFalse(entry_allowed({**a,key:value},approved))
        self.assertFalse(entry_allowed(a,{'approved_version':None,'approved_sha256':None}))

    def test_wire_accept_binds_scope_offer_and_proposal(self):
        root={'components':API['components'],'$ref':'#/components/schemas/RoundResponse'}
        v=Draft202012Validator(root,format_checker=FORMATS)
        body={'kind':'accept','request_id':UID[0],'scope':'action','offer_id':UID[1],'proposal_revision':2}
        self.assertTrue(v.is_valid(body))
        for key in ('scope','offer_id','proposal_revision'):
            bad=dict(body);bad.pop(key);self.assertFalse(v.is_valid(bad))
        self.assertTrue(v.is_valid({'kind':'stop','request_id':UID[0]}))

    def test_tod_projection_has_one_selected_prompt_and_shared_choice(self):
        c={'round_id':UID[0],'round_index':1,'state':'active','kind':'public','mode':'truth_or_dare','card_id':'TD-0001','card_revision':1,'actors':[UID[1]],'text':{'prompt':'Synthetic selected side'},'choice':'truth','response_state':'pending','proposal_revision':1}
        self.assertTrue(validator('PublicRound').is_valid(c))
        self.assertFalse(validator('PublicRound').is_valid({**c,'text':{'truth':'x','dare':'y'}}))
        self.assertFalse(validator('PublicRound').is_valid({**c,'choice':None}))
        self.assertTrue(validator('PublicRound').is_valid({**c,'choice':None,'text':None}))

class GateEvidenceRegressionTests(unittest.TestCase):
    def fixture(self):
        import tempfile,hashlib
        from p00_evidence import candidate_files,identity,REQUIRED_CHECKS,REQUIRED_TEST_CHECKS
        root=Path(tempfile.mkdtemp(prefix='venus-gate-test-'))
        (root/'source.txt').write_text('synthetic frozen candidate',encoding='utf-8')
        def artifact(path,data):
            p=root/path;p.parent.mkdir(parents=True,exist_ok=True)
            p.write_text(data if isinstance(data,str) else json.dumps(data),encoding='utf-8')
            return {'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
        files=candidate_files(root);cid=identity(files)
        inputs=artifact('.docs/implementation/evidence/inputs.json',{'files':files,'candidate_identity_sha256':cid})
        output=artifact('.docs/implementation/evidence/output.txt','synthetic regression fixture, not a real run: Ran 1 tests - OK')
        tests=artifact('.docs/implementation/evidence/tests.json',{'status':'PASS','candidate_identity_sha256':cid,'checks':[{'status':'PASS','check_id':cid,'argv':['synthetic-python','fixture'],'actual_exit':1 if cid=='NEGATIVE-DRAFT-RELEASE' else 0,'expected_exit':1 if cid=='NEGATIVE-DRAFT-RELEASE' else 0} for cid in sorted(REQUIRED_TEST_CHECKS)],'unit_tests':1,'output':output})
        reviewers=[]
        for who,scopes in [('review-a',['contracts','privacy','flows']),('review-b',['evidence','tests','traceability'])]:
            narrative=artifact('.docs/implementation/reviews/'+who+'.md','synthetic reviewer fixture')
            reviewers.append(artifact('.docs/implementation/reviews/'+who+'.json',{'reviewer_id':who,'status':'PASS','revision':'test','candidate_identity_sha256':cid,'open_findings':[],'scopes':scopes,'narrative':narrative}))
        report={'gate_id':'EXIT-P00','gate_status':'PASSED','revision':'test','candidate_identity_sha256':cid,'executor_id':'author','inputs':inputs,'tests':tests,'checks':[{'id':i,'status':'PASS','evidence_check_ids':['P00-INTEGRITY']} for i in sorted(REQUIRED_CHECKS)],'pending_critical_decisions':[],'reviewers':reviewers}
        return root,report,artifact

    def test_valid_linkage_fixture(self):
        from p00_evidence import validate_gate
        root,report,_=self.fixture()
        self.assertEqual(validate_gate(root,report,['review-a','review-b']),[])

    def test_missing_tampered_or_partial_inputs_fail_closed(self):
        from p00_evidence import validate_gate
        for kind in ('missing','tamper','partial','stale'):
            root,r,artifact=self.fixture()
            if kind=='missing':(root/r['inputs']['path']).unlink()
            if kind=='tamper':(root/r['tests']['path']).write_text('{}',encoding='utf-8')
            if kind=='partial':r['inputs']=artifact(r['inputs']['path'],{'files':{},'candidate_identity_sha256':r['candidate_identity_sha256']})
            if kind=='stale':(root/'source.txt').write_text('changed',encoding='utf-8')
            self.assertTrue(validate_gate(root,r,['review-a','review-b']),kind)

    def test_self_authored_failed_stale_or_incomplete_review_rejected(self):
        from p00_evidence import validate_gate
        for key,value in [('reviewer_id','author'),('status','FAIL'),('candidate_identity_sha256','0'*64),('scopes',[]),('open_findings',['unfixed'])]:
            root,r,artifact=self.fixture();path=r['reviewers'][0]['path'];data=json.loads((root/path).read_text('utf-8'));data[key]=value;r['reviewers'][0]=artifact(path,data)
            self.assertTrue(validate_gate(root,r,['review-a','review-b']),key)

    def test_missing_check_or_not_run_cannot_pass(self):
        from p00_evidence import validate_gate
        root,r,_=self.fixture();r['checks'].pop()
        self.assertTrue(validate_gate(root,r,['review-a','review-b']))
        root,r,_=self.fixture();r['checks'][0]['status']='NOT_RUN'
        self.assertTrue(validate_gate(root,r,['review-a','review-b']))

    def test_fake_verified_file_is_rejected(self):
        from check_p00 import check_rows
        with (ROOT/'.docs/implementation/traceability.csv').open(encoding='utf-8',newline='') as f:rows=list(csv.DictReader(f))
        rows[0].update(status='VERIFIED',evidence_uri='does-not-exist.json',evidence_sha256='0'*64)
        self.assertTrue(check_rows(ROOT,rows))

    def test_empty_test_labels_bad_exit_or_unbound_check_cannot_pass(self):
        from p00_evidence import validate_gate
        for kind in ('empty','bad_exit','zero_tests','unbound'):
            root,r,artifact=self.fixture();path=r['tests']['path'];data=json.loads((root/path).read_text('utf-8'))
            if kind=='empty':data['checks']=[{'status':'PASS'}]
            if kind=='bad_exit':data['checks'][0]['actual_exit']=99
            if kind=='zero_tests':data['unit_tests']=0
            if kind=='unbound':r['checks'][0]['evidence_check_ids']=[]
            r['tests']=artifact(path,data)
            self.assertTrue(validate_gate(root,r,['review-a','review-b']),kind)

    def test_reference_verified_missing_receipt_cannot_pass(self):
        from p00_evidence import verified_row_errors
        self.assertTrue(verified_row_errors(ROOT,{'requirement_id':'PLAN-P00-BASELINE','status':'REFERENCE_VERIFIED','evidence_uri':'missing-receipt.json','evidence_sha256':'0'*64}))

if __name__=='__main__': unittest.main()
