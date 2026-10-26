# Homepage Scroll Motion and Route Curtain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scroll-triggered homepage motion and a bottom-to-top curtain transition for navigation into the gallery and about pages.

**Architecture:** Extend the existing client-only `useHomeAnimations` composable with dynamically imported GSAP ScrollTrigger timelines scoped to the homepage root. Add a persistent route-curtain component backed by a small router controller that delays only client navigation into `/gallery` and `/about` until the curtain covers the viewport.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, GSAP 3 + ScrollTrigger, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-10-26-home-scroll-and-curtain-design.md`

## Global Constraints

- Keep SSR content visible before hydration; CSS must not pre-hide animated elements.
- Do not introduce a smooth-scroll or wheel-interception dependency.
- Keep the existing system/dark/light theme behavior unchanged.
- Skip GSAP and curtain movement under `prefers-reduced-motion: reduce`.
- Animate only homepage sections and client navigation into `/gallery` or `/about`.
- Preserve Node.js requirement `>=22.12.0` and the existing Nuxt/GSAP versions.

## Review Focus

- A slow dynamic import must not leave homepage content hidden or delay navigation.
- Re-entering the homepage must not accumulate ScrollTrigger instances or router guards.
- Mobile retains animation sequencing without desktop-sized translation distances.
- Direct loads and browser history navigation remain usable without a curtain deadlock.
- Rapid clicks during a curtain transition cannot register multiple guards or leave the overlay covering the page.

---

### Task 1: Scroll-triggered homepage sequences

**Files:**
- Modify: `app/composables/useHomeAnimations.ts`
- Modify: `app/components/home/TimeChapter.vue`
- Modify: `app/components/home/GalleryInvitation.vue`
- Modify: `app/pages/index.vue`
- Modify: `app/assets/css/main.css`
- Modify: `tests/unit/use-home-animations.test.ts`
- Modify: `tests/e2e/public-site.spec.ts`

**Interfaces:**
- Consumes: `useHomeAnimations(root: Ref<HTMLElement | null>): void` and existing `data-home-motion` root markers.
- Produces: scoped GSAP + ScrollTrigger timelines for hero, chapter, gallery invitation, and home-about sections.

- [ ] **Step 1: Write failing animation tests**

Extend `tests/unit/use-home-animations.test.ts` to assert that normal motion registers ScrollTrigger, creates one scroll-triggered timeline per marked section, uses `once: true`, and reverts the GSAP context on unmount. Keep the reduced-motion assertion that no context, plugin, or timeline is created.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- tests/unit/use-home-animations.test.ts`

Expected: FAIL because the current composable creates a single load timeline and never imports or registers ScrollTrigger.

- [ ] **Step 3: Add semantic motion markers**

Add exact markers for `chapter-date`, `chapter-copy`, `chapter-primary-photo`, `chapter-secondary-photo`, `gallery-mark`, `gallery-copy`, `home-about-label`, `home-about-copy`, and `home-about-link`. Do not add CSS that hides these nodes.

- [ ] **Step 4: Implement scoped ScrollTrigger timelines**

Update `useHomeAnimations(root)` to dynamically import `gsap` and `gsap/ScrollTrigger`, call `gsap.registerPlugin(ScrollTrigger)`, keep the hero load timeline, and build independent `once: true` timelines with `start: 'top 78%'`. Use smaller translation and scale values when `(max-width: 760px)` matches. `context.revert()` remains the single cleanup boundary.

- [ ] **Step 5: Add native smooth scrolling and reduced-motion fallback**

Set `html { scroll-behavior: smooth; }`; keep the existing reduced-motion rule that forces `scroll-behavior: auto`. Do not add an inertial-scroll dependency.

- [ ] **Step 6: Verify Task 1 GREEN**

Run: `npm test -- tests/unit/use-home-animations.test.ts && npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit Task 1**

```bash
git add app/composables/useHomeAnimations.ts app/components/home app/pages/index.vue app/assets/css/main.css tests/unit/use-home-animations.test.ts tests/e2e/public-site.spec.ts
git commit -m "feat: add scroll-driven homepage motion"
```

### Task 2: Gallery and about route curtain

**Files:**
- Create: `app/composables/useRouteCurtain.ts`
- Create: `app/components/site/RouteCurtain.vue`
- Modify: `app/layouts/default.vue`
- Modify: `app/assets/css/main.css`
- Create: `tests/unit/use-route-curtain.test.ts`
- Modify: `tests/e2e/public-site.spec.ts`

**Interfaces:**
- Produces: `CurtainPhase = 'idle' | 'preparing' | 'covering' | 'covered' | 'revealing'`.
- Produces: `isCurtainTarget(path: string): boolean` for exact `/gallery` and `/about` paths.
- Produces: `useRouteCurtain(): { phase: Readonly<Ref<CurtainPhase>> }` and cleans up registered router guards on scope disposal.

- [ ] **Step 1: Write failing route-curtain tests**

Create tests asserting `/gallery` and `/about` are targets, story/home paths are not, target navigation reaches `covered` before route continuation, after-navigation reaches `revealing` then `idle`, reduced motion introduces no delay, and cleanup unregisters both hooks.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- tests/unit/use-route-curtain.test.ts`

Expected: FAIL because `useRouteCurtain.ts` does not exist.

- [ ] **Step 3: Implement the controller and component**

Implement the route guard with injectable internal timing helpers so unit tests use immediate promises. Use `380ms` cover and `520ms` reveal durations in production. Render a fixed, pointer-blocking, `aria-hidden="true"` curtain whose `data-state` mirrors `phase`.

- [ ] **Step 4: Mount the curtain in the persistent layout**

Render `<SiteRouteCurtain />` once beside the layout content. Style each phase so the curtain starts below the viewport, covers it bottom-to-top, continues above it, then resets without a visible reverse jump.

- [ ] **Step 5: Add browser acceptance coverage**

Extend `tests/e2e/public-site.spec.ts` to observe a non-idle curtain state while entering the gallery and about routes, verify the final URL and heading, and confirm navigation to a story route does not activate the curtain.

- [ ] **Step 6: Run full verification**

Run: `npm test && npm run typecheck && npm run build && npm run test:e2e -- tests/e2e/public-site.spec.ts tests/e2e/lightbox.spec.ts`

Expected: 0 failures on desktop and mobile; reduced-motion content remains visible.

- [ ] **Step 7: Commit Task 2**

```bash
git add app/composables/useRouteCurtain.ts app/components/site/RouteCurtain.vue app/layouts/default.vue app/assets/css/main.css tests
git commit -m "feat: add route curtain transitions"
```

## Self-review

- Spec coverage: homepage chapter/gallery/about motion, native smooth scrolling, route targets, direct-load behavior, reduced-motion fallback, and cleanup each map to a task and test.
- Type consistency: `CurtainPhase`, `isCurtainTarget`, and `useRouteCurtain` use the same names across implementation and tests.
- Proportion: two independent behaviors are separate tasks; no additional animation framework or layout refactor is introduced.

