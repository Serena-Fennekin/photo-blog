# Loading, pond movement and navigation polish

Native execution, current isolated feat/public-site checkout. Base260bbd8. Detailed user request authorizes implementation; retain approved palette, fonts, content, photo data, transitions and independent scrolling. No implementation agents or new dependencies; one fresh final read-only review after green gates.

## Design and scope

- Diagnose actual browser colour signals before changing theme policy. Windows app/system preferences are light and a clean local browser resolves light correctly; user reports dark in both Codex and their Chrome. Temporary dev-only signal capture may record only colour preferences, selected/applied mode, reduced-motion flag and embedded/headless flags locally, then must be removed. Never use server OS theme as a visitor's preference.
- Existing water-grey/forest-night tokens stay. Category links get bounded glass highlights, an inset optical edge and an obvious selected state while preserving aria-current, keyboard focus and labels.
- Real pending skeletons and photo placeholders share a visible continuous sheen travelling from bottom-left to top-right. No loading delays; remove shimmer on success/failure and retain reduced-motion handling.
- Fish and prawns cover upper, middle and lower water. Shared deterministic trajectories plus lightweight separation keep bodies apart; headings remain continuous, density and canvas pixel budget unchanged. Retain detailed cached creature artwork and reduce prominence in the reading zone.
- About currently2800ms riding/2900ms curtain lifecycle. Slightly accelerate to2500/2600ms with a shared duration so rider, opening and cleanup stay synchronized; do not add navigation delays.

## Implementation tasks

- [x] Capture current browser theme evidence, reproduce any application defect and fix with regression coverage; document a verified host/browser preference override if that is the cause.
- [x] RED→GREEN tests for diagonal pending sheen and glass category state; implement bounded optical surfaces without text distortion.
- [x] RED→GREEN trajectory range/separation/continuity and shorter complete cycling tests; implement shared movement and timing.
- [x] Inspect wide/mobile, both themes and pending images. Run relevant full suites/typecheck/build, single fresh final review, one verified material fix pass if needed, record rulings, sync authorized branch and clean only this task's scratch. Keep main preview/worktree.

Review focus: actual system preference versus browser overrides; first-paint and live theme agreement; sheen visible during genuine pending and absent after terminal states; category contrast/focus; no animal piles or discontinuities on resize; cyclist fully clears narrow screens before curtain removal; retained performance and privacy.

## Verified outcome

System diagnosis: Windows application/system settings were light. Current non-headless page reported preferred-dark and Chrome's profile was explicitly dark; a clean browser resolved light correctly. Temporary dev-only capture recorded only colour/motion/embedding flags locally and was fully removed. No browser-global preference was changed. The user was given Chrome Appearance→Device guidance from https://support.google.com/chrome/answer/9275525?hl=zh-Hans. The selected-System tooltip now names the current browser-provided palette; the standard theme controller remains unchanged.

Loading uses a bottom-left→top-right composited sheen on real pending skeletons and images, with a static soft alpha mask to avoid rectangular tile edges; terminal states remove it. Category links have readable optical glass surfaces and keyboard focus in both themes. Fish/prawns use broad cached arc-length tracks and bounded individual phase drift, retaining density/artwork/pixel budget. About changes from2800ms riding/2900ms lifecycle to2500/2600ms with proportional cadence.

One fresh read-only final review identified one Important/P2: changing density at720px re-indexed retained creatures, causing139–351px jumps for a1px resize. Both-direction regression failed RED140.155px. One fix pass assigns stable identity slots, filling only vacant desktop slots. The new tests are GREEN; no re-review. Full final gates:118 unit/component/integration,55 public browser,9 isolated backend-browser (182 passed);1 intentional mobile-hover skip; typecheck and production build green. No deferred minors.

Rulings made:
- Respect the browser's actual colour preference rather than forcing light or using the server's OS. If the outside preference is surprising, adjust the browser's Device mode; the alternative would override visitors' deliberate dark settings.
- Keep the approved orbit/glass/sheen artistic language. Stable arc spacing avoids collision-correction snaps while preserving the centre for reading. A different aesthetic preference costs another visual revision, not a broken interaction.
- The partly revealed title in pond-wide QA was a capture of the existing entrance animation. Existing full-text/reduced-motion checks remain green; no homepage typography change was needed. If that interpretation were wrong, the cost would be entrance-specific QA.

Retain the active worktree/main preview. Sync the authorized development branch without merging/deploying; clean only this task's verified scratch, including temporary local colour flags.
