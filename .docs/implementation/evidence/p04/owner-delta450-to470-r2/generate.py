"""Build an owner worksheet from frozen r1 versus current470r2; never approve cards."""
import collections
import datetime
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[5]
OUT = pathlib.Path(__file__).resolve().parent
BASE = '.docs/implementation/evidence/p04/review-450-processing/r1-input-inventory.json'
CURRENT = '.docs/implementation/evidence/p05/content470-r2-owner-review/source-index470.json'
OWNER = '.docs/implementation/evidence/Venus_P04_FULL_REVIEW_450_2026-10-19.md'
DISPOSITIONS = '.docs/implementation/evidence/p04/review-450-full-coverage/r2-dispositions.json'
NAME = 'Venus_P04_REVIEW_CHANGES_SINCE_450.md'


def read(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8-sig'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dump(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def append_log(path, body):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('a', encoding='utf-8', newline='\n') as stream:
        stream.write(body)


def main():
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    daily = ROOT / f'.history/{now[:10]}-orchestrator.md'
    stage = ROOT / '.history/2026-10-19-p05.md'
    start = f'\n\n### {now} · Отдельный owner worksheet: изменения относительно review450\n\n'
    start += ('Задача владельца: самостоятельный Markdown только с новыми/изменёнными карточками и местом для замечаний. '
              'Разработка и stage gates остаются на паузе; агенты не запускаются. '
              'Границы записи: новый evidence/p04/owner-delta450-to470-r2 и журналы оркестратора/этапа. '
              'При исследовании первая Python-печать RU завершилась UnicodeEncodeError (exit1, cp1252 stdout); '
              'повтор с -X utf8 exit0. Все450 исходных и470 текущих raw SHA проверены успешно.\n')
    append_log(daily, start)
    append_log(stage, start)
    baseline = read(BASE)
    current = read(CURRENT)
    dispositions = {x['id']: x for x in read(DISPOSITIONS)['cards']}
    assert sha(ROOT / OWNER) == baseline['review_raw_sha256']
    bm = {x['id']: x for x in baseline['cards']}
    cm = {x['id']: x for x in current['cards']}
    assert len(bm) == len(baseline['cards']) == 450
    assert len(cm) == len(current['cards']) == 470
    original = {}
    cards = {}
    for id_, row in bm.items():
        path = ROOT / '.docs/content/p04/cards' / f'{id_}.json'
        assert sha(path) == row['raw_sha256'], path
        original[id_] = json.loads(path.read_text(encoding='utf-8-sig'))
    for id_, row in cm.items():
        path = ROOT / row['source_path']
        assert sha(path) == row['raw_sha256'], path
        cards[id_] = json.loads(path.read_text(encoding='utf-8-sig'))
    changed = sorted(id_ for id_ in cm.keys() & bm.keys()
                     if cm[id_]['canonical_sha256'] != bm[id_]['canonical_sha256'])
    new = sorted(cm.keys() - bm.keys())
    same = sorted(cm.keys() & bm.keys() - set(changed))
    removed = sorted(bm.keys() - cm.keys())
    assert (len(changed), len(new), len(same), len(removed)) == (268, 97, 105, 77)
    meaningful = {}
    for id_ in changed:
        meaningful[id_] = sorted(k for k in original[id_].keys() | cards[id_].keys()
                                  if k not in ('authoring', 'revision')
                                  and original[id_].get(k) != cards[id_].get(k))
        assert 'text' in meaningful[id_], id_

    modes = {'questions': 'Вопросы', 'truth_or_dare': 'Правда или действие', 'yes_but': 'Да, но'}
    categories = {'icebreaker': 'Знакомство / разогрев', 'music': 'Музыка', 'humor': 'Юмор',
                  'friendship': 'Дружба', 'boundaries': 'Границы'}
    interactions = {'group': 'общая группа', 'solo': 'личный ход', 'pair_public': 'пара публично',
                    'pair_private': 'пара в приватном канале'}
    field_names = {'question': 'Вопрос', 'truth': 'Правда', 'dare': 'Действие',
                   'proposal': 'Предложение', 'responder': 'Ответ / условие / отказ'}
    meta_names = {'interaction': 'Контекст участников', 'meeting_contexts': 'Формат встречи',
                  'min_comfort': 'Минимальный комфорт', 'min_progression_stage': 'Минимальная стадия',
                  'relationship_scope': 'Допуск по отношениям', 'safety_tags': 'Метки безопасности',
                  'required_capabilities': 'Необходимые возможности'}
    lines = ['# Venus P04 — новые и изменённые карточки после проверки 450', '',
             '## Как пользоваться', '',
             '**Для повторной проверки: 365 карточек — 268 изменённых и 97 с новыми ID.** '
             'Сравнение выполнено с исходной редакцией r1, которую вы проверяли в документе '
             '«Venus · P04 — полная предметная рецензия 450 карточек» от 19 октября 2026 года.', '',
             '105 карточек не изменились и здесь не повторяются. 77 исходных ID отсутствуют в текущем наборе; '
             'их прежние замечания и обязательства по переносу правил в UX сохраняются отдельно. '
             'Баланс: 450 − 77 + 97 = 470. Новых ID здесь 97, а не только 25 из последнего расширения: '
             'учтены также замены после вашей исходной проверки.', '',
             'Сначала идут изменённые карточки, затем новые; внутри — режимы и ID. '
             'Под каждой карточкой отметьте одно решение и заполните замечания. '
             'Поля проверки языков отмечайте только для фактически проверенных версий. '
             'Пустое поле не считается одобрением. Тексты RU/EN/TR приведены полностью; '
             'для изменённых карточек прежний текст доступен в раскрываемом блоке.', '',
             'Этот файл фиксирует материал для содержательной проверки. Само создание файла '
             'не снимает исходный HOLD, не активирует каталог и не возобновляет разработку.', '',
             '| Режим | Изменённые | Новые ID | Всего для проверки |',
             '|---|---:|---:|---:|']
    for mode, title in modes.items():
        a = sum(cards[x]['mode'] == mode for x in changed)
        b = sum(cards[x]['mode'] == mode for x in new)
        lines.append(f'| {title} | {a} | {b} | {a+b} |')
    lines += ['| **Всего** | **268** | **97** | **365** |', '',
              'Проверяющий / псевдоним: ____________________', '',
              'Дата: ____________________', '',
              'Фактически проверенные языки и компетенции: ____________________', '']

    def text_block(card):
        for lang in ('ru', 'en', 'tr'):
            lines.extend([f'**{lang.upper()}**', ''])
            for key, value in card['text'][lang].items():
                lines.extend([f"**{field_names.get(key, key)}:** {value}", ''])

    for kind, ids in [('Изменённые карточки', changed), ('Новые карточки', new)]:
        lines += [f'## {kind} — {len(ids)}', '']
        for id_ in ids:
            card = cards[id_]
            row = cm[id_]
            lines += [f"### {id_} · r{card['revision']} · {modes[card['mode']]}", '',
                      f"Категория: **{categories.get(card['category'], card['category'])}**. "
                      f"Участники: **{interactions.get(card['interaction'], card['interaction'])}**. "
                      f"Стадия: {card['min_progression_stage']}; комфорт: {card['min_comfort']}.", '',
                      f"Формат: {', '.join(card['meeting_contexts'])}. "
                      f"Допуск по отношениям: `{card['relationship_scope']}`. "
                      f"Согласие: `{card['consent']}`; требуемых участников: {card['participants_required']}. "
                      f"Возможности: {', '.join(card['required_capabilities']) or 'нет специальных'}. "
                      f"Физический контакт: {'да' if card['requires_physical_contact'] else 'нет'}; "
                      f"уход в другое место: {'да' if card['requires_going_away'] else 'нет'}.", '']
            if id_ in meaningful:
                prior = dispositions[id_]
                old = original[id_]
                text_keys = [f'{lang.upper()}/{field_names.get(k,k)}'
                             for lang in ('ru', 'en', 'tr')
                             for k in sorted(old['text'][lang].keys() | card['text'][lang].keys())
                             if old['text'][lang].get(k) != card['text'][lang].get(k)]
                lines += [f"**Ваше прежнее решение:** `{prior['decision']}`. {prior['comment']}", '',
                          '**Изменены тексты:** ' + ', '.join(text_keys) + '.', '']
                for key in meaningful[id_]:
                    if key != 'text':
                        lines += [f"**{meta_names.get(key,key)}:** `{dump(old.get(key))}` → `{dump(card.get(key))}`.", '']
                lines += ['<details>', '<summary>Прежний текст из проверки 450</summary>', '']
                text_block(old)
                lines += ['</details>', '', '**Текущая редакция для решения**', '']
            else:
                lines += ['**Новый ID:** в исходной проверке 450 этой карточки не было.', '']
            text_block(card)
            lines += ['**Ваше решение**', '',
                      '- [ ] Принять текущую редакцию.',
                      '- [ ] Исправить по замечаниям ниже.',
                      '- [ ] Исключить / заменить.', '',
                      '**Фактически проверенные языки:** [ ] RU · [ ] EN · [ ] TR', '',
                      '**Замечания по смыслу, применимости, повторам:**', '',
                      '> _Напишите здесь._', '',
                      '**Замечания по языкам / желаемая формулировка:**', '',
                      '> _RU: …_  ', '> _EN: …_  ', '> _TR: …_', '',
                      f"Точная текущая редакция: `{row['canonical_sha256']}` (canonical SHA256).", '', '---', '']
    lines += ['## Итог проверки изменений', '',
              '- [ ] Проверка изменений завершена; решения указаны у карточек.',
              '- [ ] Остались непроверенные карточки или языки — перечислить ниже.', '',
              'Непроверенные ID / языки: ____________________', '',
              'Общие замечания, повторы между карточками и исключения: ____________________', '',
              'Отдельное решение по исходному HOLD для набора 470 r2 '
              '(сохранить / снять / вернуться после правок): ____________________', '',
              '## Привязка к источникам', '',
              f"- Исходный каталог 450 r1: `{baseline['catalog_digest']}`.",
              f"- Ваша исходная рецензия SHA256: `{baseline['review_raw_sha256']}`.",
              '- Текущий каталог 470 r2: `2de569e1088e591bf8f9d1f89200c914a0ce6b16306d592ad420904d6f2975ee`.',
              '- Отбор: новый ID либо отличие canonical SHA256 от исходного r1. '
              'У всех 268 изменённых карточек также подтверждены изменения текстов; '
              'это не список изменений только между 470 r1 и 470 r2.',
              '- Сверены raw SHA256 всех 450 исходных и 470 текущих файлов. '
              'Содержимое карточек не редактировалось при подготовке документа.',
              '- Исходные снимки и прежние решения сохранены. '
              'Для отзыва этой производной формы достаточно удалить только её новый каталог; '
              'статус карточек от этого не меняется.', '']
    output = '\n'.join(lines)
    path = OUT / NAME
    assert not path.exists(), 'Do not overwrite a potentially edited owner worksheet'
    path.write_text(output, encoding='utf-8', newline='\n')
    # Check the emitted worksheet, not just the source selection.
    headings = re.findall(r'^### ((?:Q|TD|YB)-\d+) · r\d+ · ', output, re.M)
    assert len(headings) == len(set(headings)) == 365
    assert set(headings) == set(changed) | set(new)
    assert not set(headings) & set(same)
    assert output.count('- [ ] Принять текущую редакцию.') == 365
    assert output.count('**Замечания по смыслу, применимости, повторам:**') == 365
    assert output.count('<summary>Прежний текст из проверки 450</summary>') == 268
    sections = dict(zip(headings, re.split(r'^### (?:Q|TD|YB)-\d+ · r\d+ · .*$', output, flags=re.M)[1:]))
    for id_, section in sections.items():
        for lang in ('ru', 'en', 'tr'):
            for value in cards[id_]['text'][lang].values():
                assert value in section, (id_, lang)
    receipt = {'schema_version': 1, 'purpose': 'OWNER_DELTA_WORKSHEET_NOT_APPROVAL_OR_STAGE_GATE',
               'created_at_utc': now,
               'inputs': {p: sha(ROOT / p) for p in (BASE, CURRENT, OWNER, DISPOSITIONS)},
               'generator_sha256': sha(pathlib.Path(__file__)),
               'output': {'path': str(path.relative_to(ROOT)).replace('\\','/'),
                          'raw_sha256': sha(path), 'bytes': path.stat().st_size},
               'changed_ids': changed, 'new_ids': new, 'unchanged_omitted_ids': same,
               'removed_ids_not_in_current470': removed,
               'changed_fields': meaningful,
               'checks': {'source450_raw_sha256': 'PASS', 'source470_raw_sha256': 'PASS',
                          'selection_partition': 'PASS', '365_unique_card_sections': 'PASS',
                          '365_decision_and_notes_blocks': 'PASS', '268_previous_text_blocks': 'PASS',
                          'all_current_language_fields_exact': 'PASS'},
               'human_decisions_created': 0, 'stage_gate_run': False,
               'development_resumed': False}
    (OUT / 'comparison.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    end = f'\nРезультат: {path.relative_to(ROOT).as_posix()}, SHA256 {sha(path)}, {path.stat().st_size} bytes. '
    end += ('268 изменённых +97 новых =365;105 unchanged исключены,77 отсутствующих старых ID перечислены только в comparison.json. '
            '365 уникальных секций/решений/полей замечаний,268 прежних текстов и все текущие RU/EN/TR fields проверены, PASS; '
            'исторические snapshots/HOLD не менялись. Project tests/Docker/gates не запускались.\n')
    append_log(daily, end)
    append_log(stage, end)
    print(json.dumps({'output': str(path), 'sha256': sha(path), 'cards': len(headings), 'checks': receipt['checks']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
