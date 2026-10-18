# Venus · UI/UX, User Journeys & Interaction States

**Owner:** Product Design/Frontend · **version:** 1.0.0 · **status:** implementation specification · **date:** 2026-10-18.

## 1. Design principles, UX SLA

1. **One action, one obvious intent.** На каждом экране одна основная CTA, вторая — менее заметная. Создание/вход: минимум решений.
2. **Readable at night.** Сильный текстовой контраст поверх атмосферного тёмного визуала, большие зоны касания, без мелких критических контролов.
3. **Personal without public exposure.** Каждый сам задаёт отношений к другим на своём устройстве; host видит только статус заполнения.
4. **Parallel, not modal exclusivity.** Cinema, Music, Games и Calls (later) могут иметь одновременный жизненный цикл, но основной viewport имеет один главный фокус.
5. **No surprises.** При включении общего источника — видно, кто управляет. При отказе в capture/autoplay — точная причина, не пустой black screen.
6. **Safe to leave.** Любую карточку можно пропустить, приватное приглашение — отвергнуть; завершить сессию можно без «наказания».
7. **Adaptive scene.** Изменение viewport меняет композицию, не обрезает доступные действия. Пользовательский zoom не запрещён.

**Цели сценариев (не замеры):** создать комнату ≤2 смысловых шага после начального экрана; войти по ссылке ≤3 (выбор языка, имя, join); запустить сохранённую game config ≤2; пропустить раунд ≤1. Проверяются usability tests с новыми пользователями и разными языками.

## 2. Information architecture

```text
/                         Landing (interior hero)
/create                   Create Room: Online | In Person
/join/:invite             Choose language -> name -> room
/room/:roomId             Persistent room shell
  Header: Room title, owner badge, participant count, copy invite, preferences
  Main focus: Games | Cinema | landing lounge
  Persistent layer: Music mini player, media status, personal sound control
  Secondary: participants (<=8), activity chooser, future calls tray
  Games preparation -> session -> card -> finish -> play again
  Settings overlays: my locale, my directed relations, my Comfort Level
```

Only `/join/:invite` may carry a shareable invite secret; browser history/navigation from this URL should replace with `/room/:id` after authenticated join. Do not add host capability to public room URL.

## 3. Screens / information / actions

### 3.1. Landing (`/`)

**Layout:** viewport-sized cinematic room artwork, logo VENUS, short promise («Место, где можно остаться подольше» as draft copy), main button `Создать комнату`, secondary `Присоединиться`. Visible navbar is intentionally not copied from Agence Pony. If JS/data fails, page remains accessible, image lazy/non-blocking and CTA statuses visible.

**Actions:** create → format choice; join → paste invite/code or deep link. Enter/Space/keyboard navigate; desktop safe zones; mobile CTA after visual crop.

**States:** idle; submit pending; invalid invitation (user-facing message + re-enter); server outage (retry, no fake room creation).

### 3.2. Create Room

One decisive choice: `Online / Встречаемся удалённо` or `In person / Мы рядом`. Explanation: online actions are remote-safe; in-person enables physical activities. Input display name and locale at same minimal step (locale can default from browser but user MUST be offered RU/EN/TR explicitly). Create returns invitation and immediately enters room. `Edit room format` only permitted by host while no game snapshot active; server sends an explicit warning that future cards differ. Do not silently mutate an active session.

### 3.3. Join Room

**Order:** invite resolved → language picker (Русский, English, Türkçe) → display name → join. Room 8/8 => no admission and explicit message. Expired link => 410 friendly empty state. Auth/cookie unavailable => detailed diagnostic, no promise of saved preferences. Returning member with valid session sees `Продолжить как X`, still can change locale.

**Safety:** displayed names untrusted plain text, escape UI; 48 chars max with grapheme-aware validation; reject whitespace-only and control characters, but do not silently normalize another person's identity. Accessibility label from selected locale, not flags alone.

### 3.4. Room Shell

**Desktop baseline**

```text
+--------------------------------------------------------------------------+
| VENUS      [ Room status ]    [8/8 avatars]   [Invite] [My settings]     |
|                                                                          |
|  [ Games / Cinema / Lounge focus (1 major canvas) ] [participants tray]  |
|                                                                          |
|  Main card or shared video; side content collapses in narrow viewports   |
|                                                                          |
| [Music: cover  track  progress     host-controlled transport  my volume] |
| [Module tabs: Games • Cinema • Music • Calls (coming later)]             |
+--------------------------------------------------------------------------+
```

In-person: room header `Мы вместе`, badges show music primary speaker; online: `На расстоянии`; always show current capacity, connection state and which module is active. Individual audio controls cannot accidentally send shared mutation. Calls placeholder clickable only if it actually explains future unavailable feature; do not show inert controls as working.

**Persistent layout layers:**

- Main stage is replaceable (cinema/card/lounge); changing focus does **not** end ongoing audio or game session by itself.
- Music is always reachable in compact player. Host sees Play/Pause/Next/Seek; members see track/progress/my volume/mute, disabled transport with tooltip `Управляет создатель комнаты`.
- Participants tray never exposes social edge or comfort of others, including via labels, hover or JSON props.
- Error/connection banner is persistent until condition resolves; avoid dismissing an ongoing real problem.

### 3.5. Personal Relationship Setup

Player sees list of 1..7 other *member IDs* with avatar/name and one of six relation types: `just_met`, `friendship`, `crush`, `situationship`, `in_relationships`, `not_a_friend`. Default unfilled = neutral `friendship` for everyone; `Skip` writes same neutral baseline. Each choice changes only their own encrypted preferences. `Other players do not see your answers` visible. For 8 players use a wizard/list of seven entries, one screen with accessible focus; do not show 56 edges to one person.

Comfort slider is **one per player for the entire room's game experience**, NOT per target. Five steps 0–4 with textual labels and examples; default 0. Intermediate values selectable by keyboard/accessible slider (arrow keys), screenreader announces level/name; use native range or proven aria semantics. Comfortable category changes are allowed before/after session; when a game is active, controls show `Сохранено для следующей сессии` ONLY if product introduces future pending settings — initial contract chooses **read-only until session finishes** to avoid ambiguity.

**Pre-start review:** present mode/participants/context/round count, own comfort, own relations summary (self only), and ability to adjust; host sees only readiness checkmarks. `Start` must wait for participants' submissions OR explicit neutral skip, set timeout policy with explicit fallback (proposed default: host may start after users explicitly skip; do not automatically silently fill an absent online person after timer).

### 3.6. Games Setup & session start

A flow of **Mode → 2–8 names → relationships & comfort (private) → number of rounds → Start**. If existing valid draft prefs, present `Использовать предыдущие` / `Изменить`. Round options preset 10, 20, 30 and custom 1–100; 20 default. Validate card pool before Start; on shortage prefer safe reserved neutral pack and user-friendly `Для этих настроек доступно N карточек` rather than unsafe relaxation of consent/context.

On `start`: frozen snapshot icon/label; show round `01 / 20` and progression phase without disclosing pair inference. For small count 2/3 stages adjust naturally (not fake 4 stages); assign fairness profile. Start action is idempotent; double-click never starts two sessions.

### 3.7. Active Questions

Large question surface; identity of answerer where appropriate; public text accessible to all (localized); private prompt visible only to selected person(s). A single `Ответили / Следующий` host control; own `Пропустить`; `Пауза`/`Остановить` always visible without extra navigation. No point penalty for opting out. Participants don't need microphones for text-based games; users can answer aloud or in person.

### 3.8. Active Truth or Dare

Front/back card UI, obvious `Правда` and `Действие` (not ambiguous card flip-only). Reveal side chosen with keyboard/click; server owns selected side/state to avoid divergent clients. Both side translations exist and obey same category/comfort rules; don't generate a low-intensity truth with high-intensity dare in the same card unless metadata is elevated to the highest. After choice, ask participant consent if action requires it. `Отказаться/Пропустить` remains available regardless of side.

### 3.9. Active Yes, But…

**Player A** sees their offer. **Player B** receives `Да, но…` without pre-filled limitation: can choose `Да` and say/write own condition, `Нет` (decline), `Пропустить`. In remote privacy version B can type condition privately and decide what to share; free text stored ephemerally, filtered/length bounded, not logged. No forced publicly exposed `B declined because…`. Both ends receive outcome `Продолжить/Другой раунд` without divulging hidden relation data.

### 3.10. Private Pair Moment

A server-generated offer delivered **privately to both participants**. A and B independently see a short reason-neutral invitation and `Согласен/Отказаться`. Until both agree, nothing starts; timeout means decline. Other users see only `Короткая пауза / раунд готовится`, not inferred `A and B are crush`. If approved:

- `in_person`: prompt `Можете ненадолго отойти вдвоём`; no instruction to force physical contact, no requirement leave an unsafe space. Clearly limited duration/optional return.
- `online`: a private **text-based** pair surface is proposed for first version of real online tет-а-тет; later private voice/video via Calls. If that feature is not built, private moments must be disabled in online and replaced by allowed pair_public alternatives, never falsely labeled private.

Either participant can abort at any time, host can close room but cannot force pair start or read message content. No confirmation about feelings/social label appears. `Done` returns both to common room, round proceeds.

### 3.11. Games End / next session

Summarize light feedback only: `20 раундов завершено`, no public pairing/comfort stats, optional `Ещё один вечер` with same settings and **new deterministic seed/different card order**, `Изменить настройки`, `Вернуться в комнату`. Exiting Games does not erase settings or stop music. If all leave the Games tab, session state persists until completed/aborted; server-driven explicit pause rules instead of reset.

### 3.12. Cinema & music

Cinema empty: `Начать показ` host only, permission explanation, clear user gesture. After picker check video+audio; if missing audio show `Звук вкладки не передаётся. Выберите вкладку и включите передачу аудио` with retry, not fake success. Audience sees `Ожидаем показ`/`Трансляция прервана`/live indicator. Host stop is distinct from `leave room`.

Music list visual editorial covers + 4 curated moods; only licensed tracks selectable; mini-player works during Games/Cinema unless duck/paused per policy. Online volume sliders local; in_person primary speaker setting visible and host-controlled; no simultaneous external-speaker playback on 8 phones by default. Browser autoplay blocker is a user action prompt, not silent status.

## 4. Layout and responsive/adaptive behavior

### 4.1. Breakpoints (baseline; content-dependent reflow prevails)

| Viewport CSS width | Pattern |
|---|---|
| 320–479 | single-column room; bottom nav; 1 hero crop; full-width cards/buttons; overlays as sheets |
| 480–767 | single-stage + compact avatars; landscape smart fit; no side panel overlay until user asks |
| 768–1023 | stage + collapsible tray; compact media bottom bar |
| 1024–1439 | two-column stage+participant panel; room hero wide |
| >=1440 | cinematic center stage max-content width 1440–1600; safe black/blur gutters |

Height cases tested separately: 568, 667, 768, 900, 1080 CSS px; low landscape height must still reach Submit/Skip/Exit, no clipping. Zoom at 200% and large text reflow required. iPhone safe-area CSS `env(safe-area-inset-*)`; Android browser nav dynamic top/bottom; `min-height:100dvh` with fallback; input-focused viewport resize should not hide primary button.

### 4.2. No visible scrollbars without trapping content

The user requirement is **hide visible scrollbars everywhere**, not make overflow unreadable or disallow keyboard scrolling. Main view is screen-based, mostly no page scroll. Long participant, locale, help or settings panels scroll in independently managed regions via mouse/touch/keyboard and hide scrollbar chrome with cross-browser techniques:

```css
.scroll-region { overflow-y:auto; scrollbar-width:none; overscroll-behavior:contain; }
.scroll-region::-webkit-scrollbar { display:none; }
.room-stage { min-height:0; min-width:0; }
```

Never global `overflow:hidden` as a cure for clipped content; use it only in proven viewport-shell containers with reachable sheet overlays. Maintain focus order, PageDown/Space/arrows in scrollable regions, visible overflow hint (`ещё`/fade) without bars. Respect OS/user accessibility when scrolling and zooming; if conflicting, accessibility overrides the aesthetic rule.

**Rescale algorithm:** typography/padding via `clamp`, grid `minmax(0,1fr)`, `object-fit:cover` art with `object-position` per breakpoint, media video `object-fit:contain` unless user changes, resize observers for component states, no `transform:scale(...)` applied to the body/root. Orientation is not hard-locked.

## 5. Controls / touch / accessibility

- Primary touch targets **>=44×44 CSS px** proposed baseline, >=8px between unrelated actions. Tiny decorative UI never acts as sole route to a critical function.
- `focus-visible` outlines required; escape closes modal unless it is an irrevocable consent operation; tab order matches visual order.
- `aria-live="polite"` for round/status and errors when useful; avoid reading entire long card repeatedly; headings semantic; slider has textual value.
- High contrast text, meaningful button labels, no reliance only on hue, alt for artwork, captions/transcripts optional for own content; browser-captured external media captioning cannot be promised automatically.
- Reduced motion disables parallax/card flip; CSS pref dark UI; no rapid flashing neon.
- Errors remain until resolved; pending disables double submit; submit creates optimistic UI only for **local** volume, not server room/round state.

## 6. Localization contract

**Localizable units:** locale selector, room errors, category names, truth/dare labels, button/ARIA/status strings, dynamic plurals (RU/Turkish/English), numerals/time. Keys stable across locales, e.g. `room.capacity_reached`, `game.round_of_total`, `consent.decline`. Strings avoid gender-specific pronouns where not justified; names placeholders not inflected by naive concatenation (Russian cases and Turkish suffix harmony). Game card content explicitly localized per `card_id/rev` and seeded from reviewed pack.

**Fallback:** deployment build must fail if any mandatory UI key or published card locale missing. In dev only marked placeholder may appear; never silently show Russian to an English/Turkish user. All errors use server `code` and client-provided string, backend doesn't assume room locale.

**Layout stress:** Turkish phrases can be longer, names 48 grapheme, RU word wraps, `İ/ı`, `Ş/ş`, Cyrillic + diacritics; RTL unsupported in initial locale list but don't hardcode logical left/right when CSS logical properties available.

## 7. State dictionary (UI must reflect truth)

| Module | Canonical states | Visible handling |
|---|---|---|
| Room | open / closing / closed | cannot mutate closed; host gone ≠ closed |
| Presence | online / reconnecting / inactive | stale age on unresolved transport |
| Music | idle / loading / playing / paused / blocked_autoplay / buffering / error | host controls only; own volume unaffected |
| Cinema | idle / permission_requested / publishing / live / no_audio / interrupted / stopped | explicit audio absence, never fake live |
| Game | draft / waiting / active / paused / completed / aborted | server rev source of truth |
| Pair | offered / awaiting_both / active / declined / timed_out / ended | public only generic safe status |
| Connection | connected / degraded / reconnecting / unavailable | keep cached state flagged stale |

## 8. Critical E2E scenarios

1. 8 people join; duplicate-tab member reconnect; 9th rejected; retained preferences not mapped to stranger sharing same name.
2. Host creates `in_person`, 8 phones, one designated music output, shared track consistent, no 8-speaker echo; each UI controls only local preferences.
3. English, Turkish, Russian in same round; same card_id, different localized strings; placeholders correct; no stray other locale.
4. Individual relation selector A→B crush, B→A friendship; A sees private initiative, B sees optional and neutral request; host must not see private edge.
5. Mid-session comfort edit disabled; after completion original values remain and individual edits apply to next session.
6. `not_a_friend` pair forbidden in Questions/TD/YB, including private moment and after random reroll.
7. Cinema host closes source; Games still resumes; music state still present.
8. Autoplay blocked on iOS/Android → explicit audio unlock; UI does not report audible state until confirmed.
9. Keyboard-only and zoom 200%, screen 320 width: can access decline/stop, locale, selected card; hidden scrollbar doesn't hide content.
10. HTTP 502/WebSocket cut during change: UI shows reconnecting and fetched real rev, not fabricated completed state.

## 9. Delivery checklist per screen

Each completed screen must have: desktop+mobile visual, RU/EN/TR copy, loading/empty/error/ready, keyboard map, focus behavior, responsive overflow, screen-reader labels, telemetry without secrets, iOS Safari/Android Chrome smoke, screenshot comparison, and link to acceptance spec. No screen counts as done solely because it matches a static Figma screenshot.
