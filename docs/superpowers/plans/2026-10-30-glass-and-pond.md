# Glass and pond implementation plan

> **For agentic workers:** Use superpowers:executing-plans, Native; implement inline, then one fresh whole-change review.

**Goal:** fulfil the seven UI and pond refinements while keeping photographs and content workflows usable.
**Architecture:** shared skeleton, empty-state and progressive-image primitives; existing CSS/GSAP motion; cached Canvas pond artwork. No new dependencies.
**Tech Stack:** Vue/Nuxt4, CSS, GSAP, Canvas2D, existing Vitest and Playwright.
**Spec:** docs/superpowers/specs/2026-10-30-glass-and-pond-design.md

## Global Constraints

Existing water-grey/night palette, author content and approved transitions remain. Keep2.5M ambient pixel budget; reduced motion, disabled effects and hidden tabs remain supported. User prose is never rewritten to remove emoji. Use isolated data for mutating tests. Baseab5849e; reuse the current clean feat/public-site worktree and Node22 runtime.

## Review Focus

Slow list fetches must show placeholders, not false empty states; failures offer retry.
Delayed/cached/failed photos retain their layout and have a useful fallback.
Loading editor data must never allow saving default values over saved content.
Rapid category changes cannot append a previous category's pending page.
Glass/hover/breathing must preserve contrast, stable navigation, mobile scrolling and reduced motion.

### Task1: Readiness feedback and vector chrome

Files: app/components/ui/{Skeleton,EmptyState,ProgressiveImage,CategoryLabel,Icon}.vue, app/utils/category-presentation.ts; gallery/about/admin pages, PostEditor, GalleryGrid/GalleryCard/CategoryFilter; tests/unit/category-presentation.test.ts and tests/e2e/{ui-polish,workspace-states}.spec.ts; Playwright configs.
Produces: Skeleton variant gallery/feed/form/list; EmptyState title/description/art with action slot; ProgressiveImage native image props/readiness; categoryPresentation(name) text and icon tokens. Lists use lazy client fetch, guarded states and stable pagination. Existing editor data initializes on resolution with save disabled until ready.
- [ ] Add category and slow/empty/error/image browser regressions; run and watch missing behaviour fail.
- [ ] Implement shared primitives and wire real pending/error/empty states, progressive gallery/feed images and category vectors; preserve native form input values.
- [ ] Verify targeted regressions and existing component/model tests, then commit.

### Task2: Breathing type and optical surfaces

Files: app/composables/useHomeAnimations.ts; home GalleryInvitation, theme controls, app.vue/UI glass definitions; workspace-ui.css and main.css; ui-polish browser tests.
Consumes: primitives fromTask1. Produces: bounded optical surfaces,3px capable-pointer card lift, static keyboard focus, theme-icon controls,8s quiet type breathing with reduced-motion fallback.
- [ ] Add meaningful browser checks for motion/reduced-motion and hover geometry.
- [ ] Implement CSS tokens, consistent panel/control surfaces and optical edge highlights. Keep all photographs unfiltered by glass.
- [ ] Inspect desktop/mobile/theme screenshots and run public browser regressions; commit.

### Task3: Pond craft and completion

Files: app/utils/ambient-pond-art.ts, ambient-pond.ts, new ambient-shrimp.ts; relevant motion tests and documentation.
Consumes: existing bounded renderer/loop and cached sprites. Produces: smooth shrimp trajectories and articulated art; refined cached notched leaves and egret details.
- [ ] Write motion bounds/continuity checks, watch RED, then implement the shrimp motion/art and scene integration.
- [ ] Inspect enlarged art and actual pond frames at mobile and2560px; preserve switches/budget and run all relevant tests.
- [ ] Run full unit, public browser, isolated local/browser, typecheck and production build. One fresh final review, one verified material fix pass if needed, no re-review. Record rulings, commit/push authorized branch, remove only this plan's scratch and leave preview running.
