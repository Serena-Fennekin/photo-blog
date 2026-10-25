# Photography Journal Admin and Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixture content with SQLite, add the secured single-admin publishing workflow, local-development media processing, settings, and 24-hour deduplicated photo views.

**Architecture:** Drizzle repositories implement the public `ContentRepository` defined in the public-site phase and expose separate authenticated admin services. Upload and image processing use provider interfaces with a local filesystem implementation, allowing the OSS phase to replace infrastructure without changing publishing logic.

**Tech Stack:** Nuxt 4, TypeScript, SQLite WAL, Drizzle ORM, Zod, Argon2id, Vitest, Nuxt Test Utils, Playwright

**Spec:** `docs/superpowers/specs/2026-10-25-photo-journal-design.md`

## Global Constraints

- Complete `2026-10-25-photo-journal-public-site.md` first and preserve its public interfaces.
- The workspace is not currently a Git repository; execute this plan only after the public-site plan has initialized it with user approval.
- Use a single administrator account; do not implement registration or roles.
- Session cookies are `HttpOnly`, `Secure` in production, and `SameSite=Lax`.
- Uploaded originals are private; development originals live under an ignored local storage directory.
- A publishable record contains multiple ordered photos and one selected cover.
- Public EXIF uses the exact whitelist from the spec; never persist GPS or device serial number in public JSON.
- View counting is approximate, private, non-blocking, and deduplicated per anonymous visitor/photo/24 hours.
- Every database state change that spans tables uses a transaction.

## Review Focus

- Concurrent requests for the same visitor/photo/window must increment the total exactly once — Task 6 test.
- An expired or revoked session must fail every admin write even if the page remains open — Task 2 test.
- Publishing must reject a record with no ready photos or a cover outside that record — Task 4 test.
- A failed photo in a batch must remain retryable without losing successful uploads or their order — Task 3 test.
- Removing the currently selected automatic/manual hero photo must retain the last valid hero fallback — Task 5 test.

---

## File Structure

```text
server/
  db/client.ts, schema.ts, migrations/
  repositories/drizzle-content-repository.ts
  repositories/admin-story-repository.ts
  auth/password.ts, session.ts, require-admin.ts
  media/media-provider.ts, local-media-provider.ts, exif-policy.ts
  services/admin-story-service.ts, media-service.ts, settings-service.ts, view-service.ts
  api/admin/auth/*
  api/admin/stories/*
  api/admin/media/*
  api/admin/settings/*
  api/public/photos/[id]/view.post.ts
app/
  middleware/admin.ts
  layouts/admin.vue
  pages/admin/*
  components/admin/*
  composables/useAdminStoryEditor.ts
scripts/create-admin.ts
tests/unit, tests/integration, tests/component, tests/e2e
```

## Task 1: SQLite schema, migrations, and production content repository

**Files:**
- Create: `drizzle.config.ts`, `server/db/client.ts`, `server/db/schema.ts`, `server/db/migrations/0001_initial.sql`
- Create: `server/repositories/drizzle-content-repository.ts`
- Modify: `nuxt.config.ts`, `.gitignore`, `package.json`
- Test: `tests/integration/database-schema.test.ts`, `tests/integration/drizzle-content-repository.test.ts`

**Interfaces:**
- Consumes: public `ContentRepository` and types from phase one.
- Produces: `createDatabase(path: string): AppDatabase` and `createDrizzleContentRepository(db: AppDatabase): ContentRepository`.

- [ ] **Step 1: Write failing migration and repository tests**

Use a temporary database to assert all spec entities exist, WAL is enabled, published queries exclude draft/hidden/deleted records, gallery cursor order is deterministic, and public photos contain only whitelisted EXIF columns.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/integration/database-schema.test.ts tests/integration/drizzle-content-repository.test.ts`

Expected: FAIL because database modules and migration do not exist.

- [ ] **Step 3: Define schema and implement `ContentRepository`**

Create tables for admins, sessions, stories, photos, categories, story categories, settings, photo view totals, view deduplication, and jobs. Use soft-delete/status fields, foreign keys, unique slugs, ordered photo positions, and indexes for public listing and expiry cleanup.

- [ ] **Step 4: Run repository verification**

Run: `npm test -- tests/integration/database-schema.test.ts tests/integration/drizzle-content-repository.test.ts && npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json drizzle.config.ts nuxt.config.ts .gitignore server/db server/repositories tests/integration
git commit -m "feat: add sqlite content persistence"
```

## Task 2: Single-admin authentication and session enforcement

**Files:**
- Create: `server/auth/password.ts`, `server/auth/session.ts`, `server/auth/require-admin.ts`
- Create: `server/api/admin/auth/login.post.ts`, `server/api/admin/auth/logout.post.ts`, `server/api/admin/auth/me.get.ts`
- Create: `scripts/create-admin.ts`, `app/middleware/admin.ts`, `app/pages/admin/login.vue`, `app/layouts/admin.vue`
- Test: `tests/unit/password.test.ts`, `tests/integration/admin-auth.test.ts`, `tests/e2e/admin-auth.spec.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(hash, plain): Promise<boolean>`.
- Produces: `createSession(adminId, event): Promise<void>`, `destroySession(event): Promise<void>`, `requireAdmin(event): Promise<{ id: string; username: string }>`.

- [ ] **Step 1: Write failing auth tests**

Assert Argon2id hashes, generic invalid-credential responses, login throttling, rotated session IDs, expired/revoked rejection, HttpOnly/SameSite cookie flags, and unauthenticated admin-route redirects.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/password.test.ts tests/integration/admin-auth.test.ts`

Expected: FAIL because auth modules do not exist.

- [ ] **Step 3: Implement authentication and admin creation**

`scripts/create-admin.ts --username <name>` must read the password without echo, reject weak passwords, and upsert exactly one configured administrator. Protect all `/api/admin/**` routes with server middleware and all `/admin/**` pages except login with route middleware.

- [ ] **Step 4: Verify auth**

Run: `npm test -- tests/unit/password.test.ts tests/integration/admin-auth.test.ts && npx playwright test tests/e2e/admin-auth.spec.ts`

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add server/auth server/api/admin/auth scripts app/middleware app/layouts/admin.vue app/pages/admin/login.vue tests
git commit -m "feat: secure single administrator access"
```

## Task 3: Local media provider, EXIF policy, and resilient batch upload

**Files:**
- Create: `server/media/media-provider.ts`, `server/media/local-media-provider.ts`, `server/media/exif-policy.ts`
- Create: `server/services/media-service.ts`, `server/api/admin/media/upload.post.ts`, `server/api/admin/media/[id]/retry.post.ts`
- Create: `app/components/admin/BatchPhotoUploader.vue`
- Modify: `.gitignore`, `nuxt.config.ts`
- Test: `tests/unit/exif-policy.test.ts`, `tests/integration/local-media-provider.test.ts`, `tests/component/batch-photo-uploader.test.ts`

**Interfaces:**
- Produces: `MediaProvider.createUpload(input): Promise<UploadTarget>`, `inspectOriginal(key): Promise<InspectedPhoto>`, `createDerivatives(key, photoId): Promise<DerivativeSet>`, `deleteObject(key): Promise<void>`.
- Produces: `sanitizeExif(input: UnknownExif): PublicExif` with only the seven approved fields.

`createUpload` consumes `{ uploadId: string; filename: string; mime: string; bytes: number }`. `UploadTarget` contains `{ method: 'multipart' | 'POST'; url: string; key: string; fields?: Record<string,string>; expiresAt: string }`; the local driver uses `multipart`, while the OSS driver in phase three uses signed `POST`.

- [ ] **Step 1: Write failing media tests**

Assert MIME/size validation, unique object keys, EXIF removal of GPS/serial fields, separate `uploaded|processing|ready|failed` states, retained successful photos after one batch failure, and retry of only the failed photo.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/exif-policy.test.ts tests/integration/local-media-provider.test.ts tests/component/batch-photo-uploader.test.ts`

Expected: FAIL because media interfaces and uploader do not exist.

- [ ] **Step 3: Implement the provider boundary and local development driver**

Store development originals under `storage/private/` and generated display files under `storage/public/`; stream files instead of buffering an entire batch. The component shows independent upload and processing progress per photo and stable client IDs.

- [ ] **Step 4: Verify media workflow**

Run: `npm test -- tests/unit/exif-policy.test.ts tests/integration/local-media-provider.test.ts tests/component/batch-photo-uploader.test.ts && npm run typecheck`

Expected: all commands exit 0 and no fixture writes outside the temporary test directory.

- [ ] **Step 5: Commit**

```bash
git add server/media server/services/media-service.ts server/api/admin/media app/components/admin .gitignore nuxt.config.ts tests
git commit -m "feat: add local batch media workflow"
```

## Task 4: Group-story editor, preview, publishing, and soft deletion

**Files:**
- Create: `server/repositories/admin-story-repository.ts`, `server/services/admin-story-service.ts`
- Create: `server/api/admin/stories/index.get.ts`, `server/api/admin/stories/index.post.ts`, `server/api/admin/stories/[id].get.ts`, `server/api/admin/stories/[id].patch.ts`, `server/api/admin/stories/[id]/publish.post.ts`, `server/api/admin/stories/[id]/unpublish.post.ts`, `server/api/admin/stories/[id].delete.ts`
- Create: `app/composables/useAdminStoryEditor.ts`, `app/components/admin/StoryEditor.vue`, `app/components/admin/PhotoSorter.vue`, `app/pages/admin/index.vue`, `app/pages/admin/stories/new.vue`, `app/pages/admin/stories/[id].vue`
- Test: `tests/integration/admin-story-service.test.ts`, `tests/component/story-editor.test.ts`, `tests/e2e/admin-publishing.spec.ts`

**Interfaces:**
- Consumes: authenticated admin, media photo IDs, database transaction.
- Produces: `saveDraft(input: StoryDraftInput): Promise<StoryAdminModel>`, `publishStory(id: string): Promise<StoryAdminModel>`, `unpublishStory(id: string): Promise<void>`, `softDeleteStory(id: string): Promise<void>`.

`StoryDraftInput` is exactly:

```ts
type StoryDraftInput = {
  id?: string; title: string; slug?: string; note?: string;
  capturedOn: string; location?: string; categoryIds: string[];
  photos: Array<{ photoId: string; position: number; caption?: string; alt: string }>;
  coverPhotoId: string | null;
}
```

- [ ] **Step 1: Write failing publishing tests**

Assert multi-photo draft creation, drag-order persistence, cover membership, unique slug generation, publish rejection without ready photos, preview availability for drafts, unpublish removal from public queries, and soft delete without immediate media removal.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/integration/admin-story-service.test.ts tests/component/story-editor.test.ts`

Expected: FAIL because editor and service do not exist.

- [ ] **Step 3: Implement transactional editing and preview**

Validate inputs with shared Zod schemas, autosave explicit user changes after a short debounce, require a confirmation for delete, and enqueue delayed media cleanup rather than deleting originals inside the request.

- [ ] **Step 4: Verify the complete publishing flow**

Run: `npm test -- tests/integration/admin-story-service.test.ts tests/component/story-editor.test.ts && npx playwright test tests/e2e/admin-publishing.spec.ts`

Expected: an admin can create, upload multiple photos, reorder, choose a cover, preview, publish, edit, and unpublish.

- [ ] **Step 5: Commit**

```bash
git add server/repositories/admin-story-repository.ts server/services/admin-story-service.ts server/api/admin/stories app/composables app/components/admin app/pages/admin tests
git commit -m "feat: add group story publishing workflow"
```

## Task 5: Categories and homepage cover settings

**Files:**
- Create: `server/services/settings-service.ts`, `server/api/admin/categories/*`, `server/api/admin/settings/index.get.ts`, `server/api/admin/settings/index.patch.ts`
- Create: `app/pages/admin/categories.vue`, `app/pages/admin/settings.vue`, `app/components/admin/HeroModeControl.vue`
- Test: `tests/integration/settings-service.test.ts`, `tests/component/hero-mode-control.test.ts`

**Interfaces:**
- Produces: `setHeroMode(input: { mode: 'manual'; photoId: string } | { mode: 'latest' }): Promise<PublicSettings>`.
- Produces category create, rename, reorder, and deactivate operations; used by public repository from Task 1.

- [ ] **Step 1: Write failing settings tests**

Assert manual/latest switching, rejection of unpublished manual photos, retention of `lastValidHeroPhoto`, correct fallback after current photo removal, category ordering, and deactivated-category exclusion from public filters without deleting story links.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/integration/settings-service.test.ts tests/component/hero-mode-control.test.ts`

Expected: FAIL because settings modules do not exist.

- [ ] **Step 3: Implement settings and category management**

Use database transactions for reordering and settings updates. Render an explicit preview of the resolved hero next to the selected mode.

- [ ] **Step 4: Verify settings**

Run: `npm test -- tests/integration/settings-service.test.ts tests/component/hero-mode-control.test.ts && npm run typecheck`

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add server/services/settings-service.ts server/api/admin/categories server/api/admin/settings app/pages/admin app/components/admin tests
git commit -m "feat: manage categories and homepage cover"
```

## Task 6: Private 24-hour deduplicated photo views

**Files:**
- Create: `server/services/view-service.ts`, `server/api/public/photos/[id]/view.post.ts`, `server/tasks/prune-view-dedup.ts`
- Modify: `server/api/public/photos/[id].get.ts`, `app/components/gallery/PhotoLightbox.vue`
- Test: `tests/integration/view-service.test.ts`, `tests/component/photo-view-count.test.ts`

**Interfaces:**
- Produces: `recordPhotoView(input: { photoId: string; visitorId: string; now: Date }): Promise<{ total: number; counted: boolean }>`.
- Produces: `pruneExpiredViewKeys(now: Date): Promise<number>`.

- [ ] **Step 1: Write failing view tests**

Assert first-visible counting, same visitor/photo within 24 hours not counted, another photo counted, post-window recount, concurrent duplicate requests increment once, no raw IP persistence, rate limiting, and count failure not closing or blocking the lightbox.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/integration/view-service.test.ts tests/component/photo-view-count.test.ts`

Expected: FAIL because view service and endpoint do not exist.

- [ ] **Step 3: Implement atomic deduplication**

Use a random first-party anonymous cookie and an HMAC-derived dedup key. Insert the unique key and increment the aggregate in one SQLite transaction; return the current total whether counted or not.

- [ ] **Step 4: Verify view behavior**

Run: `npm test -- tests/integration/view-service.test.ts tests/component/photo-view-count.test.ts`

Expected: all tests pass, including the concurrent request case.

- [ ] **Step 5: Commit**

```bash
git add server/services/view-service.ts server/api/public/photos server/tasks app/components/gallery/PhotoLightbox.vue tests
git commit -m "feat: add deduplicated photo views"
```

## Task 7: Admin/public integration acceptance

**Files:**
- Modify: `server/repositories/index.ts`, `nuxt.config.ts`, `package.json`
- Create: `tests/e2e/content-lifecycle.spec.ts`, `tests/e2e/admin-session-expiry.spec.ts`
- Create: `docs/local-development.md`

**Interfaces:**
- Consumes: all phase-two services.
- Produces: environment-selected fixture or SQLite repository and documented local startup/seed workflow.

- [ ] **Step 1: Write failing lifecycle E2E tests**

Cover draft invisibility, publish visibility on homepage/gallery/story, sanitized EXIF, settings changes, unpublish disappearance, session expiry on an open editor, and preservation of uploaded photos after one failed batch item.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx playwright test tests/e2e/content-lifecycle.spec.ts tests/e2e/admin-session-expiry.spec.ts`

Expected: FAIL until repository wiring and full workflow are complete.

- [ ] **Step 3: Wire runtime configuration and document local development**

Use SQLite and local media by default in development, allow fixture mode only for isolated public UI work, and document migration, admin creation, storage paths, reset, and test commands.

- [ ] **Step 4: Run full phase acceptance**

Run: `npm test && npm run typecheck && npm run build && npx playwright test`

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add server/repositories/index.ts nuxt.config.ts package.json package-lock.json tests/e2e docs/local-development.md
git commit -m "test: verify complete content lifecycle"
```

## Phase Acceptance

- A local administrator can publish a multi-photo story without cloud credentials.
- Public pages are backed by SQLite and remain server-rendered.
- All admin writes reject missing, expired, or revoked sessions.
- EXIF sanitization and 24-hour view deduplication are enforced server-side.
- The media-provider boundary is ready for the OSS implementation in phase three.
