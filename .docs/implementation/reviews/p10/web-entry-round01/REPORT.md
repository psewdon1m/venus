# P10 mobile web: independent entry round01

Verdict: **PASS_ENTRY_WITH_IMPLEMENTATION_FINDINGS**. Implementation may proceed against the direct owner mobile-web scope. This is neither stage PASS nor device qualification. Reviewer did not implement application changes. No tests/build/lint/install/browser/API probes were executed.

## Scope and existing implementation

Latest owner instruction replaces former native application goal: browser UI and available browser functionality must adapt to mobile. `.docs/implementation/P10_MOBILE.md` still describes the previous native HOLD; retain it as historical revision and create a new effective contract/ADR/traceability overlay. Android/iOS native pipelines, SDKs, signing and app distribution are not current gate requirements. In-browser screen publication is conditional on secure context, actual API, permission and returned video plus source audio. An absent API must be an explained unsupported state; microphone substitution is prohibited. Receiving Cinema and joining Calls stay independently usable.

Source already contains 44 CSS-pixel button/input/summary targets, wrapping action rows and long text, single-column room layout at <=760px, stacked media at <=1000px, 320px Games treatment, 16px-base form text, contained images/video, keyboard focus styles and reduced motion. Calls/Cinema videos use playsInline. Music listen, Cinema watch/sound and Calls sound/capture use explicit gestures; errors do not fabricate device support. Games/private data and presentations clear on hidden/pagehide. Do not replace these mechanisms with a second mobile application or media transport.

## Bounded implementation findings

- **P10-W01, mandatory adaptation gap:** `apps/web/index.html` has no `viewport-fit=cover`; `style.css` has no safe-area insets. Add coherent viewport/safe-area handling for main content and modal edges so portrait/landscape notches and home indicators cannot cover controls. Preserve browser zoom and scrolling. This is a source-level missing adaptation, not a claim of a reproduced physical-device failure.
- **P10-W02, mandatory keyboard reachability defect:** `room-shell.tsx:49` makes the read-only invitation field `tabIndex=-1`. The clipboard fallback focuses/selects it once, but a keyboard user cannot return to the manual-copy field through normal Tab order. Remove negative tabindex or provide an equivalent normally focusable/selectable manual copy surface, retaining explicit selection and clipboard fallback.
- **P10-W03, validation risk only:** focus repair uses layout `innerHeight` and Tab state; textarea focus scroll runs before a virtual keyboard has necessarily opened. Check actual changed visual viewport/short landscape and send controls after the implementation freeze. Do not introduce a global focus/scroll framework without a reproduced failure. Normal document scrolling may already suffice.
- **P10-W04, capability copy risk only:** Calls getUserMedia exceptions become denied/sourceEnded; unsupported or insecure capture should remain understandable without disabling receive-only Calls or replacing camera/microphone silently. Existing Cinema capability preflight is suitable. Do not interpret emulated capture success as iPhone/Android support.

## Exit acceptance criteria for the new revision

1. Pin exact source and new effective web contract; retain previous native acceptance/history unchanged. Complete all initial code before the first test/build/check.
2. Target 320/360/390/430px portrait, 640/844px short landscape, 768px tablet and existing desktop. At least one short landscape height <=390px. Check RU/EN/TR with long member/document/track names. No document horizontal overflow or unreachable/clipped action controls. Normal vertical page scrolling is allowed.
3. Safe-area CSS is present, applied consistently without double-padding and with fallback when insets are zero. Modal close/confirm buttons remain reachable at short height; browser zoom is unrestricted. Emulation cannot prove actual notch hardware behavior.
4. Touch targets and keyboard: tap/Tab/Space/Enter operate entry 18+, create/join, room settings/invitation/manual copy, Games safety/advance and room exit; focus remains visible. Checkbox labels count as hit areas. No hover-only command.
5. Private chat/condition/advice text can be entered and submitted after viewport height reduction; wrapping, textarea and send controls remain scroll-reachable. Background/offline/rejoin preserve authority/privacy semantics.
6. Music catalogue/listen/queue/seek; presentation search/open/pages/scroll/import/settings/host live controls; Cinema watch/sound/stop; general and private Calls consent/join/mute/camera/leave fit and retain their existing permissions/cleanup. Test impacted mechanisms only, without long statistical suites.
7. Cinema unsupported/denied/no-source-audio and Calls permission/device failures are graceful; no unhandled error or global room lock; no native app requirement, UA-only support claim or microphone substitution. Receiving remains available where actual browser APIs permit. Browser volume limitations must not be advertised as cross-device certification.
8. Run bounded Chromium mobile/touch emulation and an independent WebKit browser engine check if available after freeze; clearly label both as local browser evidence. Real iOS/Android hardware, network changes, physical camera/microphone and after-deploy QA remain pending, without device/production PASS. Independent nonauthor exit report must bind exact source and final affected test bytes.

## Rollback and limits

Mobile CSS/viewport/keyboard edits should be reversible as one source revision without changing server authority, accepted contracts or database state. Existing accepted local media/presentation proofs are baselines, not proof of new mobile adaptation. P07 aggregate remains a distinct later authorized run. New real music library and post-deploy real-world tests are owner-deferred, not agent-fabricated PASS.
