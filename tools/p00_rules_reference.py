"""P00 executable specification of guards and consent, NOT the production engine.

No DB, sockets, encryption, randomness, planner, fairness or runtime ACL proof.
P03 must replay these independent fixtures against the production implementation.
All callers and tests use synthetic data only.
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from pathlib import Path
import json
import re
from jsonschema import Draft202012Validator, FormatChecker
from validate_cards import check_card

ROOT = Path(__file__).resolve().parents[1]
POLICY = json.loads((ROOT / '.docs/contracts/relationship-policy.v1.json').read_text('utf-8'))
SCHEMA = json.loads((ROOT / '.docs/contracts/card.schema.json').read_text('utf-8'))
VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker())
CLASSES = ('X', 'J', 'F', 'G', 'M', 'S', 'R')


def integer(value, lower, upper):
    return type(value) is int and lower <= value <= upper


def progression_stage(round_index, total_rounds):
    """Integer arithmetic avoids unstable floating point at quarter boundaries."""
    if not integer(total_rounds, 1, 100) or not integer(round_index, 1, total_rounds):
        raise ValueError('invalid round bounds')
    return 1 if total_rounds == 1 else 1 + min(3, (4 * (round_index - 1)) // (total_rounds - 1))


def resolve_pair(outgoing, incoming):
    """Missing edge is neutral friendship; unknown labels fail closed."""
    a = 'friendship' if outgoing is None else outgoing
    b = 'friendship' if incoming is None else incoming
    if not isinstance(a, str) or not isinstance(b, str) or a not in POLICY['labels'] or b not in POLICY['labels']:
        raise ValueError('unknown relationship')
    return POLICY['pair_class_matrix'][a][b]


def eligible(card, *, mode, context, actor_ids, comfort, edges, round_index, total_rounds, capabilities=()):
    """Return bool for a complete card, schema+semantics+review+context+guards.

    actor_ids = actual affected actors (all affected members for group).
    Actor membership and cryptographic pack verification belong to P03, not here.
    Consent is deliberately NOT inferred: this function only permits an offer.
    """
    if not isinstance(card, dict) or list(VALIDATOR.iter_errors(card)) or check_card(card):
        return False
    if card['status'] != 'reviewed' or card['authoring']['policy_revision'] != POLICY['policy_revision']:
        return False
    if mode not in POLICY['modes'] or context not in POLICY['contexts'] or card['mode'] != mode:
        return False
    if context not in card['meeting_contexts']:
        return False
    try:
        stage = progression_stage(round_index, total_rounds)
    except ValueError:
        return False
    if not isinstance(actor_ids, (tuple, list)) or not actor_ids or any(not isinstance(a, str) or not a for a in actor_ids):
        return False
    if len(set(actor_ids)) != len(actor_ids) or not isinstance(comfort, dict) or not isinstance(edges, dict):
        return False
    interaction = card['interaction']
    if (interaction == 'solo' and len(actor_ids) != 1) or (interaction.startswith('pair_') and len(actor_ids) != 2):
        return False
    if len(actor_ids) > 8 or any(not integer(comfort.get(a), 0, 4) for a in actor_ids):
        return False
    if card['min_comfort'] > min(comfort[a] for a in actor_ids) or card['min_progression_stage'] > stage:
        return False
    if not isinstance(capabilities, (tuple, list, set, frozenset)) or any(not isinstance(c, str) for c in capabilities):
        return False
    if not set(card['required_capabilities']).issubset(capabilities):
        return False
    if context == 'online' and (card['requires_physical_contact'] or card['requires_going_away']):
        return False
    if card['requires_physical_contact'] and (stage < POLICY['progression']['minimum_stage_for_physical_contact'] or card['consent'] != 'bilateral'):
        return False
    if interaction.startswith('pair_'):
        a, b = actor_ids
        try:
            pair_class = resolve_pair(edges.get((a, b)), edges.get((b, a)))
        except ValueError:
            return False
        if pair_class == 'X':
            return False
        minimum = POLICY['relationship_scope_min_class'][card['relationship_scope']]
        if CLASSES.index(pair_class) < CLASSES.index(minimum):
            return False
        if interaction == 'pair_private' and (pair_class == 'J' or stage < 3 or min(comfort[a], comfort[b]) < 1 or card['consent'] != 'bilateral'):
            return False
    return True


@dataclass(frozen=True)
class Consent:
    actors: tuple[str, str]
    deadline: int
    state: str = 'pending'
    accepted: frozenset[str] = frozenset()
    last_at: int = 0
    active_until: int | None = None
    proposal_revision: int = 1
    condition: str | None = None
    scope: str = 'invitation'

    def __post_init__(self):
        if (len(self.actors) != 2 or len(set(self.actors)) != 2 or
            any(not isinstance(a, str) or not a for a in self.actors) or
            type(self.deadline) is not int or self.deadline < 1 or
            self.state not in ('pending', 'active', 'declined', 'expired', 'stopped', 'completed') or
            not isinstance(self.accepted, frozenset) or not self.accepted.issubset(self.actors) or
            type(self.last_at) is not int or self.last_at < 0 or
            not integer(self.proposal_revision, 1, 9007199254740991) or self.scope not in ('invitation','action')):
            raise ValueError('invalid consent')
        if self.state == 'active' and (self.accepted != frozenset(self.actors) or type(self.active_until) is not int or self.active_until <= self.last_at):
            raise ValueError('active requires two acks')


def respond(consent, actor, decision, now, proposal_revision=1):
    """Serialized reference; P03 must prove DB serialization under real races."""
    if actor not in consent.actors:
        raise PermissionError('only assigned actor')
    if decision not in ('accept', 'decline', 'stop', 'finish') or type(now) is not int or now < consent.last_at:
        raise ValueError('invalid response/time')
    if consent.state in ('declined', 'expired', 'stopped', 'completed'):
        return consent  # terminal never resurrects, duplicate remains idempotent
    if consent.state == 'active' and now >= consent.active_until:
        return replace(consent, state='expired', last_at=now)
    if consent.state == 'pending' and now >= consent.deadline:
        return replace(consent, state='expired', last_at=now)
    if decision in ('decline', 'stop'):
        return replace(consent, state='declined' if consent.state == 'pending' else 'stopped', last_at=now)
    if decision == 'finish':
        if consent.state != 'active':
            raise ValueError('cannot finish pending invitation')
        return replace(consent, state='completed', last_at=now)
    if not integer(proposal_revision, 1, 9007199254740991) or proposal_revision != consent.proposal_revision:
        raise ValueError('ACTION_REVISION_CONFLICT')
    acks = consent.accepted | {actor}
    active = acks == frozenset(consent.actors)
    # Replayed accept must never renew an already active deadline.
    until = consent.active_until if consent.state == 'active' else now + POLICY['consent']['suggested_private_duration_seconds'] if active else None
    return replace(consent, accepted=frozenset(acks), state='active' if active else 'pending', active_until=until, last_at=now)


def can_read_private_prompt(consent, actor, now):
    return (type(now) is int and now >= consent.last_at and consent.state == 'active' and
            consent.scope == 'invitation' and actor in consent.actors and now < consent.active_until)


def propose_condition(consent, actor, condition, now, expected_revision):
    """Only P2 may amend a pending action; a new condition clears ALL acks."""
    if actor != consent.actors[1]:
        raise PermissionError('only responder P2')
    if (consent.scope != 'action' or consent.state != 'pending' or type(now) is not int or now < consent.last_at or now >= consent.deadline or
        expected_revision != consent.proposal_revision or type(expected_revision) is not int):
        raise ValueError('condition scope/revision expired or locked')
    if not isinstance(condition, str) or not condition.strip() or len(condition) > 2000:
        raise ValueError('invalid condition')
    return replace(consent, condition=condition, accepted=frozenset(), proposal_revision=consent.proposal_revision+1, last_at=now)


@dataclass(frozen=True)
class PairContext:
    invitation: Consent
    action: Consent

    def __post_init__(self):
        if self.invitation.scope!='invitation' or self.action.scope!='action' or self.invitation.actors!=self.action.actors:
            raise ValueError('invitation and action identities/scopes must match')


def open_action(invitation, now):
    if not all(can_read_private_prompt(invitation,a,now) for a in invitation.actors):
        raise PermissionError('private channel must be active before revealing action')
    return PairContext(invitation, Consent(invitation.actors, min(invitation.active_until,now+30),last_at=now,scope='action'))


def pair_response(pair, actor, scope, decision, now, proposal_revision=1):
    if type(now) is not int or now<max(pair.invitation.last_at,pair.action.last_at):raise ValueError('invalid/backwards pair clock')
    if scope == 'invitation':
        invitation=respond(pair.invitation,actor,decision,now,proposal_revision)
        action=pair.action
        if invitation.state in ('declined','expired','stopped','completed') and action.state in ('pending','active'):
            action=replace(action,state='stopped',last_at=now)
        return replace(pair,invitation=invitation,action=action)
    if scope != 'action' or not can_read_private_prompt(pair.invitation,actor,now):
        raise PermissionError('invalid or inactive action scope')
    action=respond(pair.action,actor,decision,now,proposal_revision)
    if action.state=='active':action=replace(action,active_until=min(action.active_until,pair.invitation.active_until))
    return replace(pair,action=action)


def action_is_consented(pair, now):
    return (type(now) is int and now>=max(pair.invitation.last_at,pair.action.last_at) and
            all(can_read_private_prompt(pair.invitation,a,now) for a in pair.invitation.actors) and
            pair.action.state=='active' and pair.action.accepted==frozenset(pair.action.actors) and now<pair.action.active_until)


def can_resume_game(pause_reason, trigger, *, is_host=False, same_identity=False, membership_valid=False, consent_reconciled=False):
    if pause_reason not in ('safety','transport') or membership_valid is not True or consent_reconciled is not True:
        return False
    if trigger=='host_resume':return is_host is True
    if trigger=='reconnect':return pause_reason=='transport' and same_identity is True
    return False


@dataclass(frozen=True)
class SideChoice:
    actor: str
    mode: str = 'truth_or_dare'
    side: str | None = None


def choose_side(choice, actor, side):
    if actor!=choice.actor:raise PermissionError('only designated actor')
    if choice.mode!='truth_or_dare' or side not in ('truth','dare'):raise ValueError('invalid choice')
    if choice.side is not None and choice.side!=side:raise ValueError('CHOICE_LOCKED')
    return replace(choice,side=side)


def entry_allowed(acceptance, offer):
    if not isinstance(acceptance,dict) or not isinstance(offer,dict):return False
    return (isinstance(offer.get('approved_version'),str) and bool(offer['approved_version']) and
            isinstance(offer.get('approved_sha256'),str) and bool(re.fullmatch(r'[a-f0-9]{64}',offer['approved_sha256'])) and
            acceptance.get('offer_version')==offer['approved_version'] and
            acceptance.get('offer_digest')=='sha256:'+offer['approved_sha256'] and
            acceptance.get('accept_offer') is True and acceptance.get('adult18') is True)
