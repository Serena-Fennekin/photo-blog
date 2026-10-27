# Flat Photo Gallery Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans, continuing the user's chosen Native method in the existing isolated worktree.

**Goal:** Remove the group model entirely while retaining all user photos and making batch upload a convenience for independent photos.

**Architecture:** One SQLite photo row owns metadata, processing and publication state. A transactional, backed-up legacy migration removes group relationships; existing authentication, local media and view tables remain intact. Public and administrator interfaces use independent photo APIs.

**Tech Stack:** Existing Nuxt/Vue/TypeScript, native SQLite, Sharp, exifr, Vitest and Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-27-flat-photo-gallery-design.md`.

## Global Constraints
- Preserve photo IDs, original/display files, EXIF, counters, categories and administrator credentials.
- No group entities, group covers or persisted upload-batch objects. Homepage hero selection remains independent.
- Batch uploads remain serialized with 25MB/50MP per-file limits and independent failures.
- Keep private originals, authenticated writes, draft isolation, 24-hour view deduplication and the approved motion.
- Navigation20px; category labels18px; maintain mobile navigation and complete-image sizing.

## Review Focus
- Legacy published/draft/deleted groups and failed photos migrate without publishing hidden images or losing files.
- Migration rollback and repeated initialization cannot duplicate content or remove a working database.
- Multi-select actions and reorder reject stale/foreign IDs atomically; retry retains per-photo metadata.
- Publishing, withdrawing and deleting one photo cannot alter unrelated photos or expose withdrawn hero metadata.
- Upload failures, narrow viewports and long metadata must leave valid photos and controls usable.

### Task 1: Flat persistence and migration
Files: `server/db/journal-store.ts`, new `server/db/migrate-flat-photos.ts`, `shared/types/admin.ts`, `app/types/content.ts`, `server/fixtures/content.ts`, `tests/integration/flat-photos.test.ts`.
Interfaces: `PhotoAsset`; `AdminPhoto`; `JournalStore.listPhotos/getPhoto/createPhoto/updatePhoto/updatePhotos/reorderPhotos/replaceAsset/publicPhotos`.
- [x] Write migration, publication isolation, independent edits/order, bulk atomicity, retry and hero regression tests; observe failures.
- [x] Back up local data; implement transactional migration and flat schema, preserving non-content tables.
- [x] Verify persistence tests and include the data boundary in the atomic refactor commit.

### Task 2: Public gallery and photo APIs
Files: repositories/service contracts, home/photo components, public endpoints, media access, administrator API; delete group endpoints, pages and components.
Interfaces: `ContentRepository.listHomePhotos/listGallery/getPhotoContext/getPublicSettings`; `GET/POST /api/admin/photos`, `GET/PATCH/DELETE /api/admin/photos/:id`, `POST /api/admin/photos/bulk`, `PUT /api/admin/photos/order`, `POST /api/admin/photos/:id/retry`.
- [x] Replace old contract tests with flat-photo assertions; observe old behavior failing.
- [x] Implement the flat contracts, global lightbox siblings and standalone homepage moments; enlarge navigation/categories.
- [x] Run repository/component tests and include the consumers in the atomic refactor commit.

### Task 3: Independent administrator workflow
Files: `app/pages/admin/index.vue`, new `app/pages/admin/photos/[id].vue`, settings/layout/CSS, local browser acceptance.
Interfaces: upload returns one `AdminPhoto`; all editing and bulk actions address photo IDs only.
- [x] Write browser acceptance for direct batch upload, independent publication/categories/editing, failures, privacy and no group-cover controls.
- [x] Implement the photo grid, batch selection/actions, ordering and single-photo editor; remove old editor.
- [x] Verify the complete local workflow and include the UI in the atomic refactor commit.

### Task 4: Verification and handoff
- [x] Run the whole test suite, type checking, public/local browser acceptance and production build; verify actual migration against the saved baseline.
- [x] Obtain one fresh whole-change review as required by the Native execution skill; resolve important findings with regressions.
- [x] Restore the local server, update README/local instructions and plan results, and synchronize the authorized GitHub branch.

## Execution record
- User correction explicitly supersedes the old group-based specification; no additional approval pause is needed for the authorized refactor.
- Existing `feat/public-site` worktree starts clean at `b03c939`.
- Ruling: copy legacy group metadata onto each photo, preserving existing photo captions; this retains user content while removing every group relationship. Duplicate old notes can be edited independently afterward.
- Ruling: preserve the homepage hero selector because it selects one standalone photo, not a group cover. Latest mode follows the latest published photo.
- Ruling: commit the persistence, repository and UI changes atomically because removing the old type contract makes their intermediate combinations incompatible. Isolated migration tests ran first; the full suite and independent review ran before the combined commit. The cost is one larger review range instead of individually deployable intermediate commits.
- Initial flat persistence regressions failed against the old group store (missing independent operations), then passed after replacement. The final suite has 69 passing tests, including migration backup/idempotence/rollback, publication privacy, bulk atomicity, more than 100 independent photos, retries, latest hero selection and SQLite reopening. Type checking passed.
- Browser acceptance passed 18 desktop/mobile public tests and 2 local publishing/navigation tests. External demo-image requests use controlled SVG responses only in tests, eliminating unrelated CDN-load timeouts. Real uploaded images remain covered by Sharp/media integration and local publishing acceptance.
- One fresh read-only reviewer found an Important migration visibility issue: legacy published content with a failed/missing cover was effectively hidden. A failing regression reproduced exposure of its ready sibling; migration now retains such photos as drafts. Regression RED→GREEN and the full 69-test suite passed.
- Final: the reviewer called unbroken homepage metadata a Minor inherited issue. Regraded Important for the new auto-filename title workflow because valid input was permanently clipped. Desktop/mobile browser regressions reproduced clipping, then passed with shrinkable columns and wrapping. No deferred findings remain.
- Review exclusions resolved: the executor compared actual user data with the consistent pre-migration backup; IDs, EXIF, image metadata, original-file references, captions, notes, locations, categories, administrator credentials, sessions and view totals were preserved. Seven photos and one administrator remain; the view total was 13 at verification, the original file was present, the old group table was absent and SQLite integrity/foreign-key checks passed.
- Actual migration was performed with the verified production build on a temporary local port before restoring the development server on port3000. The application is still local; no cloud services or public image downloads were enabled.
- README/local instructions now describe independent-photo management. Manual inspection verified the actual gallery has 7 flat photos, all primary navigation links compute to20px, category labels to18px, and the isolated administrator grid has independent selection/edit/publish controls with no cover controls.
