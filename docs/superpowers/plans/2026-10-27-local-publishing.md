# Local publishing and approved transitions implementation plan

> **For agentic workers:** Use superpowers:executing-plans, Native execution in the existing `feat/public-site` worktree.

**Goal:** A local photography website with the approved transitions and an authenticated, persistent multi-photo publishing workflow.

**Architecture:** Preserve the public ContentRepository contract. SQLite stores content, sessions and view deduplication; a local media provider keeps originals private and serves sanitized display derivatives. Vue admin pages consume authenticated APIs in the same Nuxt application.

**Tech Stack:** Nuxt 4, Vue, TypeScript, SQLite, Argon2id, Sharp, exifr, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-25-photo-journal-design.md`; approved camera prototype v12 and cyclist prototype v19.

## Global constraints

- Native execution, preserve system Node 20; run the Nuxt project with a separate compatible Node runtime.
- Gallery curtain totals 2300ms. About directly reveals the real destination with the approved male rider, white helmet, gray-white frame and connected pedaling. No English interstitial or home curtain.
- Local demo needs no cloud account. Originals never appear in public URLs. Cloud deployment remains phase three.
- One administrator, password hashing, server-enforced sessions, same-origin writes and rate limiting.
- Batch upload, drafts, ordered photos, cover selection, publishing, withdrawing, categories and manual/latest home cover.
- Public views count only visible photos and deduplicate a visitor/photo for 24 hours.

## Review focus

- Small viewport and resize during transition must fully clear rider and route snapshots.
- Unauthenticated requests, forged origin and expired sessions cannot mutate content or read originals.
- Invalid uploads and partial batch failures preserve successful photos and permit retry.
- Draft/unpublished/deleted content and private EXIF must never leak into public API responses.
- Repeated/concurrent views and publish/unpublish operations must persist across process restarts.

## Tasks

- [x] 1. Replace generic curtain with camera and cyclist components; test navigation ordering and responsive exit geometry.
- [x] 2. Add SQLite persistence and ContentRepository; test draft isolation, publishing validation, settings fallback and view deduplication using temporary databases.
- [x] 3. Add Argon2 login/sessions, same-origin protection, local batch media conversion and EXIF whitelist; verify actual image processing and rejection cases.
- [x] 4. Build administrator login/setup, story editor, category/settings screens; connect photo-visible counts and touch navigation; cover lifecycle in browser tests.
- [x] 5. Run unit/component tests, type checking, production build and browser acceptance; document local startup and backup/storage paths; update progress and synchronize authorized GitHub development branch.

## Execution record

- Existing linked worktree confirmed; initial Git status clean.
- Ruling: use Node's SQLite driver with parameterized SQL instead of adding Drizzle for this phase. The existing repository boundary remains unchanged; migrations and transactions stay explicit. This reduces native dependency setup on Windows. A later ORM migration would require adapting only repository implementations.
- Ruling: implement first-admin initialization in a localhost-only setup flow, disabled after the administrator exists, so the user can choose credentials privately without sending a password through chat. Production requires CLI initialization.
- User already authorized Native execution and continuing website implementation; no additional plan approval pause.
- Independent review found three important lifecycle issues, all fixed with regressions: withdrawn hero metadata could remain public, pending lightbox requests could reopen or reorder a closed viewer, and editing during upload could lose changes. Hero fallback now selects only published photos, lightbox requests carry a generation token, and the editor locks while its upload/save operation is active.
- Minor review fixes: retrying a failed item remains possible at the 100-photo limit, and removing a photo updates its group's modification time.
- Same-day records now sort by publication time after capture date, and republishing refreshes that time. This resolves a browser regression in latest-record homepage selection.
- Ruling: withdrawal privacy takes precedence over cached hero metadata. If no published photos remain, the homepage renders its empty state instead of exposing an unavailable or withdrawn photo.

## Verification and handoff

- 60 unit, component and integration tests passed; Nuxt type checking passed.
- 8 public browser tests passed across desktop and mobile; 2 local publishing/navigation browser tests passed. Browser data and administrator credentials are confined to ignored `.superpowers/` test directories.
- Production build passed using `JOURNAL_BUILD_DIR=.superpowers/production-build`, allowing the development server to remain available on port 3000. Known upstream sourcemap and experimental SQLite warnings do not prevent build or runtime operation.
- Production HTTP smoke verified the homepage, private API rejection and disabled production setup. The backup command generated a database that reopened with `integrity_check=ok`; the interactive administrator command was checked against a separate test database with password echo disabled.
- The actual local website remains available on port 3000, with two seeded demo records and an uninitialized administrator. The owner can create their own credentials at `/admin/login` without sharing them in chat.
- Source and documentation are prepared for the already authorized `feat/public-site` branch and attached pull request #1. No production deployment, paid resource provisioning, main-branch merge or original-download endpoint is part of this phase.
