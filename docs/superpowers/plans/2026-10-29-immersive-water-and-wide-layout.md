# Wide layout and interactive ambient scenes

Native execution, base d8ee662. User requests a larger proportion of content on large screens, richer visible night stars/meteors, a more realistic detailed pond with pointer-driven waves and natural floating movement, and a category filter that does not cover photographs. The annotation's fixed-location phrase is incomplete; use normal-flow categories unless user clarifies.

## Design

Preserve existing cream/deep green theme and fonts. About grows from1260px capped box to90vw/max1920px with a wider proportionate author rail; large-screen body20px. Keep mobile centered and readable. Gallery category filter scrolls away without obscuring images. Increase admin available width moderately on large screens.

Keep local Canvas and current off/pause lifecycle,30fps and bounded pixel budget. Split scene rendering into night/pond modules, keep renderer orchestration small. Night uses more varied bright stars, small halos, atmospheric dust and more frequent tapered/glowing meteors. Pond uses a bounded low-resolution wave grid for animated water lighting, pointer disturbances with expiring rings/splashes, detailed gradient/veined leaves and layered lotus, smoothly turning patterned koi, dragonflies, one egret and a distant pavilion near edges. Floating positions use several slow sine frequencies for irregular small movements. Central reading area stays quiet and content/cards retain contrast. No image assets, libraries, network requests, schema changes or owner-data mutation.

## Task1 — Layout and category behavior

Update actual browser assertions first for2560px About width/body size and category bounds after scrolling. Confirm current layout/category failure. Update notebook/main CSS, including mobile override and consistent reading measure. Verify desktop/mobile gallery navigation and no horizontal overflow.

## Task2 — Water interaction and scene detail

Add pure bounded wave/ripple model and tests: propagation, energy decay, finite output, input rejection, expired/capped ripples and resize independence. Add theme-specific renderers with bounded sprite/particle counts. Add passive pointer movement/down lifecycle; interact only while pond is running, throttle/sample trails, clear pointer state on pause/resize. Preserve loop cancellation and overlay/hidden/reduced-motion behavior.

## Task3 — Verify and sync

Run full unit/integration/component, typecheck, public desktop/mobile and isolated publishing/security browser suites, production build. Inspect2560px/1280px/mobile screenshots for both themes and pointer-wave frames; measure bounded Canvas buffer/work rather than claim physical device FPS. One fresh read-only review and one verified material-fix pass, then authorized GitHub sync and leave local preview running. Remove only this plan's scratch directory after completion.

## Review focus

No mobile/grid overflow or image obstruction; readable lines at2560px; correct coordinates on resized/DPR screens; bounded wave/ripple/sprite buffers; no pointer listeners after disposal or work while off; theme switching and first-frame/long-pause timing; no global canvas filter/shadow state leakage; no change to data/privacy/counters or approved route transitions.

## Verification record

Layout RED reproduced: About width1260px at2560px and sticky categories remaining over photographs. GREEN:26/26 public desktop/mobile browser checks; final lifecycle/large-screen targeted run4/4 after adding a post-show Canvas resize. Unit/integration/component84/84, isolated local publishing/security6/6, typecheck and production build passed. Visual screenshots inspected at2560px,1280px and393px; pointer trails, softened water reflections, detailed edge scenery and richer night sky are visible without browser errors. Pixel/cell/particle bounds are enforced; no claim of measured device FPS. Existing data was not modified.

Final production rebuild passed after the post-show Canvas sizing change. The fresh read-only reviewer could not start because its account usage limit was reached. A separate author self-review checked input/lifecycle cleanup, theme and first-frame timing, bounded buffers, Canvas state restoration and responsive layout; no material defects were found. This does not substitute for an independent review. No additional review agents were dispatched. Existing feature-branch synchronization remains authorized; no deployment or merge is included.
