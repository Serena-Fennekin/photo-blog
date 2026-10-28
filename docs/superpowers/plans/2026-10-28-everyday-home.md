# Everyday Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** A relaxed, finite photography homepage with explicit duplicate feedback.

**Architecture:** Keep Nuxt/Vue, existing animation system, SQLite and local image pipeline. Add private content hashes, bounded homepage selections and a finite responsive photo section.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, SQLite, sharp, Vitest, Playwright.

**Spec:** docs/superpowers/specs/2026-10-28-everyday-home.md

## Global Constraints

- Keep approved camera/cyclist transitions and global damped scrolling.
- At most 6 manual homepage selections; default 4 published photos.
- Preserve originals, EXIF, counters and administrator credentials.
- Back up before changing existing local metadata; Native execution remains in this worktree.

## Review Focus

- Duplicate files renamed or submitted alongside valid new files must not create duplicate records.
- Old photos need fingerprint backfill without changing IDs or EXIF; absent originals must not break the site.
- Withdrawn/deleted selections must not leak publicly, and settings must reject unknown/draft selections.
- Long captions and mixed image ratios must remain inside desktop/mobile viewport.
- An invitation is the next screen after the hero; no unlimited homepage listing or accidental animation regressions.

### Task 1: Independent photo feedback and bounded homepage data

Files: shared/types/admin.ts; server/db/journal-store.ts; new server/media/photo-identity.ts; new server/db/upgrade-photo-metadata.ts; local media provider; admin API and repository adapters; tests/integration/home-library.test.ts.

- [x] Write tests for exact duplicates, soft deletion, legacy fingerprinting, existing city text, selection limit and privacy.
- [x] Run the new tests and observe missing functionality.
- [x] Implement fingerprints, repeat-publication no-op, bounded selections and one-time metadata cleanup.
- [x] Verify targeted tests; retain global independent-photo behavior.

### Task 2: Everyday homepage and admin controls

Files: HomeHero.vue; new FeaturedPhotos.vue; index.vue; main.css; useHomeAnimations.ts; admin/index.vue; admin/settings.vue; about/footer/fixtures; home component and public browser tests.

- [x] Update component assertions for the new copy and finite photo section.
- [x] Replace pointed image hero, move invitation directly after hero, use two columns desktop and one centered mobile column.
- [x] Add a maximum-six selection control and duplicate upload feedback with a link to the existing photo.
- [x] Remove obsolete chapter component/CSS and current city copy. Verify responsive structure and continued animation replay.

### Task 3: Verification and integration

- [x] Run unit/integration tests and typecheck, public browser suite and isolated publishing flow with duplicate checks.
- [x] Inspect desktop/mobile screenshots using agent-browser; verify real local data invariants after metadata upgrade.
- [x] Build with a separate production build directory; use one fresh final code reviewer as required by Native execution workflow.
- [x] Fix material findings with focused tests, commit and synchronize the already-authorized development branch/PR.

## Verification record

75 unit/component/integration tests passed; 18 public browser tests and 2 isolated publishing/navigation tests passed. The final desktop/mobile layout regression was rerun after reserving space for floating navigation. Typecheck and the final production build passed. A fresh read-only final review found no actionable issues. Existing photo IDs, original paths, EXIF, dates, counters, credentials and sessions were checked against the pre-change backup and preserved. The development preview remains on port 3000.
