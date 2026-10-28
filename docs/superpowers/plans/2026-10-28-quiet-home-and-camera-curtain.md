# Quiet homepage and theme-aware camera curtain

## Scope and design

Implement the user's six browser comments and gallery-transition request in the existing Nuxt site, using Native execution. The homepage contains only its quotation and gallery entrance; remove the note, selected-photo section and about teaser. Preserve the original quotation, increase its entrance link from 16px to 20px. About's heading must exceed its statement at every viewport. Use the shared shell's flex layout to place the existing footer at the document bottom on short and long pages, without fixing it over content.

Keep the approved camera artwork and 2.3-second gallery transition, delete its loading text. Reuse existing theme tokens (#eeeae0/#14201c backgrounds and existing text/surface tokens); retain existing typography. Replace vertical scene translation with a curved diagonal clip reveal. Couple animation stages to router phases: cover first, hold while route loads, then play shutter and reveal. Cycling remains unchanged. No backend, account, media, stored homepage-selection, or database migration changes; existing admin selection settings remain compatible even though this homepage no longer displays photos.

The implementation choice is a CSS ellipse sweep rather than a second cycling-style DOM snapshot or another animation library: existing hardware-accelerated CSS can shape this single flat curtain, while router phases prevent the old time-only animation from exiting before navigation completes.

## Task 1: Simplify pages and stage the camera transition

**Files:** index.vue, GalleryInvitation.vue, main.css, CameraTransition.vue, RouteCurtain.vue, useHomeAnimations.ts, relevant component/unit/browser tests, local-development.md.

1. Update public browser expectations for the new homepage, title hierarchy and footer document-bottom position; add camera component coverage and a delayed-navigation check. Run focused new tests before implementation and confirm the existing UI fails the new expectations.
2. Remove homepage photo fetching and unused public components/styles/animations. Keep server/admin selection compatibility. Update docs to describe the new homepage.
3. Use a column flex shell with growing main and nonshrinking footer; enlarge About h1 and gallery entrance.
4. Pass route phase to the camera component. Show no visible loading text. Cover with a curved clip, stay fully covered through loading, run shutter during revealing, and reveal on a second smooth curve. Preserve 552ms cover + 1748ms reveal timings and cleanup.
5. Run unit/component tests, typecheck, desktop/mobile public browser tests and production build in separate build directories. Review screenshots in both themes and capture animation stages. Do not exercise admin against user data.
6. Commit, obtain one fresh read-only review of this task's diff, resolve material findings in one verified fix pass, sync the authorized GitHub branch and leave local preview running.

## Review focus

- No extra home sections or public photo fetch remain; no accidental removal of owner photos or settings.
- Camera holds during delayed route navigation and cannot expose the previous page; no jumping text in DOM.
- Both theme colors, mobile/desktop aspect ratios, repeated navigation and animation completion.
- About heading exceeds statement, no horizontal overflow, footer reaches actual document bottom without overlay.
- Shared shell changes do not break lightbox position or the cycling snapshot.

## Validation record

Implemented. `npm test`: 74/74 across 16 files. Public Playwright desktop/mobile: 22/22, including delayed-navigation coverage, both themes and footer geometry at the user's tall viewport. Typecheck and production build passed; the latter used this plan's isolated build directory. Actual local-preview screenshots inspected for light/dark home, About, camera shutter/curved exit and mobile home; no browser errors. Final read-only review and GitHub sync pending.
