# Photography Journal Public Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-quality public photography journal with fixture-backed content, including the time-chapter homepage, gallery, lightbox, story pages, themes, and accessible motion.

**Architecture:** A Nuxt application server-renders public routes and hydrates interactive Vue components. Public content is read through a `ContentRepository` boundary backed by fixtures in this phase, so the SQLite implementation in phase two can replace it without changing pages.

**Tech Stack:** Node.js 22+, npm, Nuxt 4, Vue 3, TypeScript, GSAP, Vitest, Nuxt Test Utils, Playwright

**Spec:** `docs/superpowers/specs/2026-10-25-photo-journal-design.md`

## Global Constraints

- Work in the repository root; keep `prototype-photo-journal/` unchanged as a visual reference only.
- The workspace is not currently a Git repository; obtain user approval and initialize Git before executing commit steps.
- Use npm and commit `package-lock.json`.
- Public copy is Chinese-first; do not add a long-form article content type.
- Theme values are exactly `system`, `dark`, and `light`; default is `system`.
- Public EXIF may contain only camera, lens, focal length, aperture, shutter, ISO, and captured date.
- No original-download UI, user accounts, comments, likes, or favorites.
- Respect `prefers-reduced-motion`; motion must never block navigation.
- Every task follows test-first development and ends with the listed verification and commit.

## Review Focus

- A corrupt saved theme value must fall back to `system` without flashing the wrong theme — Task 2 test.
- A system-theme change must update an open page only while preference is `system` — Task 2 test.
- An empty or unknown gallery category must return a valid empty state rather than a failed page — Task 4 test.
- Opening a lightbox from a deep scroll position and closing it must restore scroll and keyboard focus — Task 5 E2E test.
- Reduced-motion users must get no GSAP timeline while all content remains visible — Task 6 test.

---

## File Structure

```text
app/
  app.vue                         # application root
  assets/css/main.css             # design tokens, theme palettes, global layout
  components/site/                # header, footer, theme selector
  components/home/                # hero, time chapters, gallery invitation
  components/gallery/             # filters, masonry grid, cards, lightbox
  components/story/               # story header and ordered photo sequence
  composables/useThemePreference.ts
  composables/usePhotoLightbox.ts
  composables/useHomeAnimations.ts
  layouts/default.vue
  pages/index.vue
  pages/gallery.vue
  pages/stories/[slug].vue
  pages/about.vue
  types/content.ts
server/
  api/public/home.get.ts
  api/public/gallery.get.ts
  api/public/photos/[id].get.ts
  api/public/stories/[slug].get.ts
  repositories/content-repository.ts
  repositories/fixture-content-repository.ts
  repositories/index.ts             # active repository provider
  services/public-content-service.ts
  fixtures/content.ts
shared/
  schemas/public-query.ts
tests/
  unit/                           # composable and service tests
  component/                      # Nuxt component tests
  e2e/                            # Playwright user flows
```

## Task 1: Application shell and public content contract

**Files:**
- Create: `package.json`, `package-lock.json`, `nuxt.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
- Create: `app/app.vue`, `app/layouts/default.vue`, `app/assets/css/main.css`
- Create: `app/types/content.ts`, `server/repositories/content-repository.ts`, `server/repositories/fixture-content-repository.ts`, `server/repositories/index.ts`, `server/fixtures/content.ts`
- Test: `tests/unit/fixture-content-repository.test.ts`

**Interfaces:**
- Produces: `ContentRepository`, `StorySummary`, `StoryDetail`, `GalleryPhoto`, `PhotoContext`, `PublicSettings`, `GalleryPage`.
- Produces: `createFixtureContentRepository(): ContentRepository`.
- Produces: `getContentRepository(): ContentRepository` returning the configured singleton.

Use these shared shapes throughout all three plans:

```ts
type PublicExif = {
  camera?: string; lens?: string; focalLengthMm?: number; aperture?: number;
  shutter?: string; iso?: number; capturedAt?: string;
}
type PublicImage = { src: string; srcset: string; width: number; height: number; alt: string }
type GalleryPhoto = {
  id: string; storyId: string; storySlug: string; storyTitle: string;
  caption?: string; image: PublicImage; exif: PublicExif; viewCount: number;
}
type StorySummary = {
  id: string; slug: string; title: string; note?: string; capturedOn: string;
  location?: string; categories: Array<{ slug: string; name: string }>;
  cover: GalleryPhoto; previewPhotos: GalleryPhoto[];
}
type StoryDetail = StorySummary & { photos: GalleryPhoto[] }
type PhotoContext = { photo: GalleryPhoto; siblings: GalleryPhoto[]; index: number }
type PublicSettings = {
  heroMode: 'manual' | 'latest'; heroPhoto: GalleryPhoto | null;
  lastValidHeroPhoto: GalleryPhoto | null;
}
type GalleryPage = {
  items: GalleryPhoto[]; nextCursor: string | null;
  categories: Array<{ slug: string; name: string }>;
}
```

- [ ] **Step 1: Write the repository contract test**

Test `createFixtureContentRepository()` for published-only stories, chronological ordering, cursor pagination, category filtering, one photo context with ordered siblings, and an unknown slug returning `null`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/fixture-content-repository.test.ts`

Expected: FAIL because the repository modules do not exist.

- [ ] **Step 3: Scaffold Nuxt and define exact domain interfaces**

Define `ContentRepository` with:

```ts
listHomeStories(limit: number): Promise<StorySummary[]>
listGallery(input: { category?: string; cursor?: string; limit: number }): Promise<GalleryPage>
getStoryBySlug(slug: string): Promise<StoryDetail | null>
getPhotoContext(photoId: string): Promise<PhotoContext | null>
getPublicSettings(): Promise<PublicSettings>
```

Implement deterministic fixtures that include at least two stories, mixed portrait/landscape ratios, two categories, sanitized EXIF, and both cover modes.

- [ ] **Step 4: Run quality gates**

Run: `npm test -- tests/unit/fixture-content-repository.test.ts && npm run typecheck && npm run build`

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json nuxt.config.ts tsconfig.json vitest.config.ts playwright.config.ts app server tests/unit/fixture-content-repository.test.ts
git commit -m "feat: scaffold photography journal public app"
```

## Task 2: Three-state theme and responsive site chrome

**Files:**
- Create: `app/composables/useThemePreference.ts`
- Create: `app/components/site/SiteHeader.vue`, `app/components/site/ThemeSelector.vue`, `app/components/site/SiteFooter.vue`
- Modify: `app/layouts/default.vue`, `app/assets/css/main.css`, `nuxt.config.ts`
- Test: `tests/unit/use-theme-preference.test.ts`, `tests/component/theme-selector.test.ts`

**Interfaces:**
- Consumes: Nuxt application shell from Task 1.
- Produces: `ThemePreference = 'system' | 'dark' | 'light'` and `useThemePreference(): { preference, resolvedTheme, setPreference }`.

- [ ] **Step 1: Write failing theme tests**

Assert default `system`, persistence under key `photo-journal-theme`, invalid-value fallback, explicit light/dark behavior, and live `matchMedia('(prefers-color-scheme: dark)')` updates only in system mode.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/use-theme-preference.test.ts tests/component/theme-selector.test.ts`

Expected: FAIL because the composable and selector do not exist.

- [ ] **Step 3: Implement theme bootstrap and responsive header**

Apply `data-theme="light|dark"` before hydration through Nuxt head script, render three labeled options, remember preference locally, and style both palettes with shared semantic tokens.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- tests/unit/use-theme-preference.test.ts tests/component/theme-selector.test.ts && npm run typecheck && npm run build`

Expected: all commands exit 0 with no hydration warning.

- [ ] **Step 5: Commit**

```bash
git add app nuxt.config.ts tests/unit/use-theme-preference.test.ts tests/component/theme-selector.test.ts
git commit -m "feat: add system light and dark themes"
```

## Task 3: Time-chapter homepage

**Files:**
- Create: `server/services/public-content-service.ts`, `server/api/public/home.get.ts`
- Create: `app/components/home/HomeHero.vue`, `app/components/home/TimeChapter.vue`, `app/components/home/GalleryInvitation.vue`
- Create: `app/pages/index.vue`
- Test: `tests/unit/public-content-service.test.ts`, `tests/component/home-page.test.ts`

**Interfaces:**
- Consumes: `ContentRepository` and public content types from Task 1.
- Produces: `getHomePageModel(repository): Promise<{ settings: PublicSettings; stories: StorySummary[] }>` and `GET /api/public/home`.

- [ ] **Step 1: Write failing homepage-model tests**

Assert manual hero selection wins, latest-story cover is used in automatic mode, and a missing automatic cover falls back to `lastValidHeroPhoto`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/public-content-service.test.ts tests/component/home-page.test.ts`

Expected: FAIL because the service, endpoint, and components do not exist.

- [ ] **Step 3: Implement the homepage model and UI**

Server-render the hero, dated story chapters, restrained short notes, responsive images, the mid-page artistic gallery link, and final about link. No client-only placeholder may replace core content.

- [ ] **Step 4: Verify homepage behavior**

Run: `npm test -- tests/unit/public-content-service.test.ts tests/component/home-page.test.ts && npm run build`

Expected: tests pass and generated server bundle contains the homepage route.

- [ ] **Step 5: Commit**

```bash
git add app/components/home app/pages/index.vue server/services server/api/public/home.get.ts tests
git commit -m "feat: build time chapter homepage"
```

## Task 4: Filterable paginated masonry gallery

**Files:**
- Create: `shared/schemas/public-query.ts`, `server/api/public/gallery.get.ts`
- Create: `app/components/gallery/CategoryFilter.vue`, `app/components/gallery/GalleryGrid.vue`, `app/components/gallery/GalleryCard.vue`
- Create: `app/pages/gallery.vue`
- Test: `tests/unit/gallery-api.test.ts`, `tests/component/gallery-page.test.ts`

**Interfaces:**
- Consumes: `ContentRepository.listGallery()`.
- Produces: `GET /api/public/gallery?category=<slug>&cursor=<token>&limit=24` returning `GalleryPage`.

- [ ] **Step 1: Write failing gallery tests**

Assert a default 24-item limit, rejected malformed cursors, category URL synchronization, unknown-category empty state, preserved aspect-ratio placeholders, and appending the next page without duplicates.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/gallery-api.test.ts tests/component/gallery-page.test.ts`

Expected: FAIL because the API and gallery components do not exist.

- [ ] **Step 3: Implement gallery query validation and UI**

Use top category filters, query-string state, lazy responsive images, stable item keys, an accessible empty state, and explicit “加载更多” pagination. Do not request lightbox-size images in the grid.

- [ ] **Step 4: Verify gallery behavior**

Run: `npm test -- tests/unit/gallery-api.test.ts tests/component/gallery-page.test.ts && npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add shared server/api/public/gallery.get.ts app/components/gallery app/pages/gallery.vue tests
git commit -m "feat: add filterable photography gallery"
```

## Task 5: Accessible photo lightbox and story context

**Files:**
- Create: `server/api/public/photos/[id].get.ts`
- Create: `app/composables/usePhotoLightbox.ts`, `app/components/gallery/PhotoLightbox.vue`, `app/components/gallery/ExifPanel.vue`
- Modify: `app/components/gallery/GalleryCard.vue`, `app/pages/gallery.vue`
- Test: `tests/component/photo-lightbox.test.ts`, `tests/e2e/lightbox.spec.ts`

**Interfaces:**
- Consumes: `ContentRepository.getPhotoContext(photoId)`.
- Produces: `GET /api/public/photos/:id`, `openPhoto(photoId: string)`, `closePhoto()`, `nextPhoto()`, and `previousPhoto()`.

- [ ] **Step 1: Write failing lightbox tests**

Assert EXIF labels include only the whitelist, sibling navigation remains within the story, background locks while open, ESC/back closes, missing photo gives 404, and focus returns to the triggering card.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/component/photo-lightbox.test.ts`

Expected: FAIL because lightbox modules do not exist.

- [ ] **Step 3: Implement the lightbox**

Render it as a focus-trapped dialog, update URL history with the photo ID, prefetch only adjacent display images, and expose the owning story link and placeholder view count.

- [ ] **Step 4: Verify unit and browser behavior**

Run: `npm test -- tests/component/photo-lightbox.test.ts && npx playwright test tests/e2e/lightbox.spec.ts`

Expected: all tests pass, including scroll and focus restoration from a deep page position.

- [ ] **Step 5: Commit**

```bash
git add server/api/public/photos app/composables app/components/gallery app/pages/gallery.vue tests
git commit -m "feat: add accessible photo lightbox"
```

## Task 6: Story pages, motion, responsive and accessibility acceptance

**Files:**
- Create: `server/api/public/stories/[slug].get.ts`
- Create: `app/components/story/StoryHeader.vue`, `app/components/story/StorySequence.vue`
- Create: `app/pages/stories/[slug].vue`, `app/pages/about.vue`, `app/composables/useHomeAnimations.ts`
- Modify: `app/pages/index.vue`, `app/assets/css/main.css`
- Test: `tests/component/story-page.test.ts`, `tests/unit/use-home-animations.test.ts`, `tests/e2e/public-site.spec.ts`

**Interfaces:**
- Consumes: `ContentRepository.getStoryBySlug()` and lightbox interface from Task 5.
- Produces: story and about routes plus `useHomeAnimations(root: Ref<HTMLElement | null>): void`.

- [ ] **Step 1: Write failing route and motion tests**

Assert story order matches repository order, unknown slug yields 404, every content image has meaningful or intentionally empty alt text, and reduced motion creates no GSAP timeline while leaving content visible.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/component/story-page.test.ts tests/unit/use-home-animations.test.ts`

Expected: FAIL because routes and motion composable do not exist.

- [ ] **Step 3: Implement routes and progressive motion**

Dynamically load GSAP only on the client when motion is allowed, scope and clean up every animation context, and reduce pinned/parallax behavior on narrow screens.

- [ ] **Step 4: Run full phase acceptance**

Run: `npm test && npm run typecheck && npm run build && npx playwright test tests/e2e/public-site.spec.ts tests/e2e/lightbox.spec.ts`

Expected: all commands exit 0; Playwright covers desktop and mobile, three theme modes, gallery filtering, lightbox, story navigation, and reduced motion.

- [ ] **Step 5: Commit**

```bash
git add app server/api/public/stories tests
git commit -m "feat: complete public photography experience"
```

## Phase Acceptance

- `npm test`, `npm run typecheck`, `npm run build`, and public Playwright tests pass.
- The app runs entirely from fixtures without SQLite or OSS credentials.
- All public routes render useful HTML before client hydration.
- Phase two can replace only the repository provider and add admin routes without rewriting public components.
