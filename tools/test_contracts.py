#!/usr/bin/env python3
"""Reproducible safety/format regression tests for Venus draft card tooling.

Run from repository root: python -m unittest discover -s tools -p 'test_*.py' -v
These tests do not prove the quality of generated cards, RTC, consent at runtime or privacy.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from validate_cards import check_card, check_directory  # noqa: E402
from jsonschema import Draft202012Validator, FormatChecker  # noqa: E402

SCHEMA = json.loads((ROOT / ".docs/contracts/card.schema.json").read_text(encoding="utf-8"))
VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker())
EXAMPLES = ROOT / ".docs/examples/cards"

def sample(filename: str) -> dict:
    return json.loads((EXAMPLES / filename).read_text(encoding="utf-8"))

def codes(card: dict) -> set[str]:
    return {issue["code"] for issue in check_card(card)}


class DraftCardContractTests(unittest.TestCase):
    def test_all_examples_are_valid_drafts(self):
        files = sorted(EXAMPLES.glob("*.json"))
        self.assertEqual(len(files), 12)
        cards = [json.loads(f.read_text(encoding="utf-8")) for f in files]
        for card in cards:
            self.assertFalse(list(VALIDATOR.iter_errors(card)), card["id"])
            self.assertFalse(check_card(card), card["id"])
        self.assertFalse(check_directory(cards, files)[0])

    def test_missing_turkish_locale_is_rejected(self):
        card = sample("Q-0001.json")
        del card["text"]["tr"]
        self.assertTrue(list(VALIDATOR.iter_errors(card)))

    def test_malformed_text_is_failure_not_exception(self):
        card = sample("Q-0001.json")
        card["text"] = None
        self.assertIn("CARD-002", codes(card))
        issues, _ = check_directory([card], [Path("synthetic.json")])
        self.assertTrue(issues)

    def test_unilateral_pair_consent_is_rejected(self):
        card = sample("YB-0002.json")
        card["consent"] = "individual"
        self.assertIn("CARD-005", codes(card))

    def test_physical_online_is_rejected(self):
        card = sample("TD-0004.json")
        card["meeting_contexts"] = ["online", "in_person"]
        self.assertIn("CARD-006", codes(card))

    def test_online_private_requires_private_chat(self):
        card = sample("YB-0004.json")
        card["required_capabilities"] = []
        self.assertIn("CARD-008", codes(card))

    def test_cross_language_placeholder_mismatch_is_rejected(self):
        card = sample("Q-0003.json")
        card["text"]["tr"]["question"] = "Bu akşam hangi şarkıyı seçerdiniz?"
        self.assertIn("CARD-010", codes(card))

    def test_unreviewed_agent_cannot_claim_rights_review(self):
        card = sample("Q-0001.json")
        card["authoring"]["origin"] = "agent"
        card["authoring"]["rights_status"] = "original_verified"
        self.assertIn("CARD-012", codes(card))

    def test_duplicate_id_even_different_revision_is_rejected(self):
        original = sample("Q-0001.json")
        newer = copy.deepcopy(original)
        newer["revision"] = 2
        issues, _ = check_directory([original, newer], [Path("a.json"), Path("b.json")])
        self.assertIn("CARD-001", {issue["code"] for issue in issues})

    def test_same_draft_cannot_fake_release(self):
        draft = sample("Q-0001.json")
        issues, counts = check_directory([draft], [Path("Q-0001.json")], release=True)
        self.assertIn("CARD-012", {issue["code"] for issue in issues})
        self.assertEqual(sum(counts.values()), 0)

    def test_yes_but_must_be_pair(self):
        card = sample("YB-0002.json")
        card["interaction"] = "solo"
        self.assertIn("CARD-003", codes(card))

    def test_going_away_only_in_person_private_pair(self):
        card = sample("YB-0004.json")
        card["requires_going_away"] = True
        self.assertIn("CARD-007", codes(card))

    def test_unexpected_html_and_url_are_rejected(self):
        card = sample("Q-0001.json")
        card["text"]["ru"]["question"] = "Прочитай <script>alert(1)</script> https://example.invalid"
        self.assertIn("CARD-011", codes(card))


if __name__ == "__main__":
    unittest.main()
