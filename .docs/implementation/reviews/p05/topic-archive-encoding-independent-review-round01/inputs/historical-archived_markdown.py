"""Read exact historical text without rewriting captured evidence.

Ordinary Markdown remains strict UTF-8. Nine immutable capture records have
explicit byte pins: two original Windows-1252 producer documents and seven source
copies whose relative links retain their original source directory as base.
This is not a wildcard encoding fallback or an exclusion from link validation.
"""
from pathlib import Path
import hashlib

ARCHIVES = {'.docs/implementation/reviews/p05/topic-browser-aggregate-budget-diagnosis-round01/inputs/.docs/10_IMPLEMENTATION_PLAN.md': {'sha256': '8b5e6a51a1e129c73114cc55843ed8d8cb78dff6bfd8f20fb356a684c1509ae9', 'bytes': 78597, 'encoding': 'utf-8', 'origin': '.docs/10_IMPLEMENTATION_PLAN.md'},
 '.docs/implementation/evidence/p05/topic-chat-policy-preflight-01/producer/DESIGN.md': {'sha256': 'f62ac8532ac0e84099665e35740ab1bde6c1dc9726ebf4ea1844fb330294edb6',
                                                                                         'bytes': 7550,
                                                                                         'encoding': 'cp1252',
                                                                                         'origin': None},
 '.docs/implementation/reviews/p05/topic-chat-producer-round03/source/artifacts__p05-topic-chat-policy__DESIGN.md': {'sha256': 'f62ac8532ac0e84099665e35740ab1bde6c1dc9726ebf4ea1844fb330294edb6',
                                                                                                                     'bytes': 7550,
                                                                                                                     'encoding': 'cp1252',
                                                                                                                     'origin': None},
 '.docs/implementation/reviews/p05/topic-measurement-design-review-round01/source/docs__10_IMPLEMENTATION_PLAN.md': {'sha256': '8b5e6a51a1e129c73114cc55843ed8d8cb78dff6bfd8f20fb356a684c1509ae9',
                                                                                                                     'bytes': 78597,
                                                                                                                     'encoding': 'utf-8',
                                                                                                                     'origin': '.docs/10_IMPLEMENTATION_PLAN.md'},
 '.docs/implementation/reviews/p05/topic-measurement-design-review-round01/source/docs__adr__ADR-023-p05-room-topic-safety-lifecycle.md': {'sha256': 'f119f5420f8962879b2a33797c980c162db47fa6de3a883a8f6ecfbe71801b2d',
                                                                                                                                           'bytes': 16895,
                                                                                                                                           'encoding': 'utf-8',
                                                                                                                                           'origin': '.docs/adr/ADR-023-p05-room-topic-safety-lifecycle.md'},
 '.docs/implementation/reviews/p05/topic-measurement-design-review-round01/source/docs__P05_PRIVATE_CHAT.md': {'sha256': 'e719cf3b63c6ab34329c1ba1ab02dc42c9c28cd0ac8b6083578ce5a57f277081',
                                                                                                               'bytes': 14165,
                                                                                                               'encoding': 'utf-8',
                                                                                                               'origin': '.docs/P05_PRIVATE_CHAT.md'},
 '.docs/implementation/reviews/p05/topic-measurement-design-review-round01/source/docs__P05_TOPIC_ADVICE_DESIGN.md': {'sha256': '94c704e17d6a2e949f741c592e9147f53205412c87865452c96499e2bf93c430',
                                                                                                                      'bytes': 30220,
                                                                                                                      'encoding': 'utf-8',
                                                                                                                      'origin': '.docs/P05_TOPIC_ADVICE_DESIGN.md'},
 '.docs/implementation/reviews/p05/topic-restore-design-review-round01/source/.docs__adr__ADR-023-p05-room-topic-safety-lifecycle.md': {'sha256': 'f119f5420f8962879b2a33797c980c162db47fa6de3a883a8f6ecfbe71801b2d',
                                                                                                                                        'bytes': 16895,
                                                                                                                                        'encoding': 'utf-8',
                                                                                                                                        'origin': '.docs/adr/ADR-023-p05-room-topic-safety-lifecycle.md'},
 '.docs/implementation/reviews/p05/topic-restore-design-review-round01/source/.docs__P05_TOPIC_ADVICE_DESIGN.md': {'sha256': '94c704e17d6a2e949f741c592e9147f53205412c87865452c96499e2bf93c430',
                                                                                                                   'bytes': 30220,
                                                                                                                   'encoding': 'utf-8',
                                                                                                                   'origin': '.docs/P05_TOPIC_ADVICE_DESIGN.md'}}


def read_markdown(path: Path, root: Path):
    relative = path.relative_to(root).as_posix()
    record = ARCHIVES.get(relative)
    if record:
        cursor = path
        while cursor != root:
            if cursor.is_symlink() or cursor.is_junction():
                raise ValueError('linked ancestor in immutable archived Markdown: ' + relative)
            if not (cursor.is_file() if cursor == path else cursor.is_dir()):
                raise ValueError('missing or nonregular archived Markdown path: ' + relative)
            cursor = cursor.parent
    raw = path.read_bytes()
    if record:
        if len(raw) != record['bytes'] or hashlib.sha256(raw).hexdigest() != record['sha256']:
            raise ValueError('immutable archived Markdown bytes changed: ' + relative)
        text = raw.decode(record['encoding'])
        base = (root / record['origin']).parent if record['origin'] else path.parent
        return text, base
    return raw.decode('utf-8'), path.parent


def archive_errors(root: Path):
    """A deleted capture must fail even when the Markdown walk cannot find it."""
    errors = []
    for relative in ARCHIVES:
        path = root / relative
        try:
            if path.is_symlink() or not path.is_file():
                raise ValueError('missing or nonregular immutable archived Markdown: ' + relative)
            read_markdown(path, root)
        except (OSError, ValueError) as exc:
            errors.append(str(exc))
    return errors
