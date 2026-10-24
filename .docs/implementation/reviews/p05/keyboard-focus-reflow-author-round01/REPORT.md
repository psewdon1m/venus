# SOURCE22 keyboard focus visibility

Observed A32 WebKit/RU original first sample clips conversation-stop. Historical writer/cause remains unproven. The product correction repairs an eligible keyboard-focused current-main control after subsequent native document/window scroll or main DOM reflow.

One shared synchronous guarded repair rereads document.activeElement: keyboard intent, document.hasFocus, connected eligible control, :focus-visible, current main membership, fits viewport, and clipped geometry. Fully visible or oversized controls are no-op. A primitive try/finally reentry flag prevents synchronous scroll recursion. Existing focus/Tabkeyup use that repair and one coalesced cancellable RAF; scroll and mutation invoke repair synchronously without another deferred sample or wait. No timers/RAFloop/custom Tab/focus calls.

Document capture tracks Tab even from body and interrupts/cancels on pointer, wheel, touch and any nonTab key before repair. This preserves manual navigation/scroll intent. The one owned main-subtree MutationObserver ignores record arguments. Window blur drains/disconnects it, clears keyboard intent and cancels the frame; focus reconnects to current main. Unmount removes all listeners and drains/disconnects/cancels. Persistent callbacks retain primitive bookkeeping/main ref/observer, never private focused fields/events/records/value text.

Existing lint0, webtypes0,149/149 tests in9 existing files; exact stdout/stderr/argv/exit receipts included. No new tests/harness, producer methods/oracles/waits/counts, UI/native/Docker/Git/CI/registry/WIP/manifest changes. Source21 opaque revocation/read recovery remains byte-exact. Core delta is only main.tsx and new revision22,1896 files. Before main exact bytes allow rollback without reverting SOURCE21 panel; pre22 focus limitation then returns.

Independent final-byte source review pending. Current tests are host checks, not rendered UI/native acceptance. Old A32 two PASS and third FAIL remain historical; new source/image will require new nine UI shards later. No statistical restart, stage PASS or P06.
