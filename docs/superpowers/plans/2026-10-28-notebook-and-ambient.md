# Editable copy, personal notebook and ambient backgrounds

Native execution in existing feat/public-site worktree; base d1d8751. User's four-part request is the specification. Existing Node/Nuxt/SQLite/sharp stack, themes, gallery and cyclist artwork remain. No external service or dependency required.

## Design and boundaries

- Backend edits home quotation/entrance and About title/statement/intro/name/tagline. Store separately from legacy photo selections, with current copy as defaults and literal plain-text rendering.
- About becomes a modern personal activity wall: compact introduction, author sidebar on desktop/top on mobile, readable 18px posts, date/topic, optional title, multiline text and up to nine images. No fabricated personal posts, comments or social accounts. Existing navigation remains “关于我”.
- Posts support drafts and published state plus public/private visibility. Private means owner-only in backend; public API never includes private or draft data, even for logged-in visitors. Images are uploaded independently of gallery photos; image URLs require a currently public parent post or an authenticated admin. Public-to-private changes must also revoke fresh image access; post image responses use no-store. Original files stay private.
- Public feed uses bounded keyset pagination. A post's view is recorded after it has actually been visible, with anonymous visitor/post/24h dedup; refresh and duplicate observers do not inflate counts. Private counts cannot be incremented publicly.
- Background preview: optional persisted visitor switch; theme-driven Canvas stars/meteors or subtle rainy pond with fish, pads, lotus and ripples. Bounded particle counts/DPR/30fps, no network assets, pointer-transparent; pause offscreen/hidden, in image dialogs and during route curtains. No effects in admin. Text/cards remain legible. Default enabled to preview; switch can disable immediately.
- Gallery curtain retains approved camera, no text; shorten normal route timing from2.3s to about1.9s, reduce static hold and synchronize press/open/fade/curved exit. Keep covered phase for slow navigation.
- Preserve all owner photos, EXIF, accounts, counters and settings. Back up live SQLite before additive schema startup. Do not publish demo posts into owner's database.

## Task 1: Data, visibility and public/admin APIs

Add shared content/post types and defaults, additive notebook tables and an independent NotebookStore using existing DB connection. Test first: defaults/edit validation; text/image publication; pagination; draft/private exclusion; direct media checks after withdrawal; image ownership; view dedup and nonpublic rejection; existing photo data untouched. Add authenticated CRUD/upload routes and bounded public feed/copy/view routes. Keep legacy settings API compatible.

## Task 2: Owner editing and modern activity wall

Add admin navigation, post list/editor with multi-image uploads, explicit draft/public/private feedback and removal; add copy editing alongside preserved legacy settings. Wire home text and About feed to public APIs. Public image dialog supports keyboard closure; view observer cleans up timers and requests. Browser QA uses isolated data and credentials; test actual create/edit/reload/privacy/copy updates and non-gallery images. Desktop/mobile typography and empty/error/pagination states.

## Task 3: Ambient rendering and refined curtain

Implement independent Canvas renderer, preference switch and lifecycle cleanup. Theme comes from existing root data attribute; decorative layer never intercepts input. Test pause/start/stop cleanup and preference persistence, theme switching and image/dialog interactions. Update curtain tests to new timings. Inspect frames/screenshots in both themes; no physical device frame-rate guarantee.

## Task 4: Verification and sync

Run full unit/integration/component suite, typecheck, public desktop/mobile and isolated publishing/notebook browser suites, production build in separate build directory. Inspect real screenshots. One fresh read-only final review, one fix pass for material findings, then authorized commit/push/update existing PR. Keep local preview running. Remove only this plan's scratch workspace after completion.

## Review focus

Privacy of every post/image API and cached responses; no gallery exposure of post uploads; image association/revocation; persisted defaults/migrations; view-count behavior; upload limits and draft failures; pagination ordering; canvas observers/RAF/DPR disposal; text sizing/contrast in both themes; reduced-motion and stored preference; camera phase consistency and navigation waits.

## Completion

Implementation complete in ac7033e (data/APIs), 7069c39 (copy/editor/feed), bacbc9a (ambient/curtain) and the final verified fix commit. Full unit/component/integration suite81/81; public desktop/mobile Playwright24/24; isolated photo+post publishing/security browser suite6/6; typecheck and production build pass after review fixes. Real screenshots inspected in both themes and mobile, with preview posts in a separate database only. Main user data was backed up before additive changes.

One fresh read-only review identified admin HTML caching, failed-copy-load overwrites and concurrent first-visit cookie counts, plus observer timing under overlays. The observer issue was regraded from Minor to Important because it reproducibly counted before the About curtain cleared, contrary to the visible-reading requirement. All four received failing browser regressions then a single fix pass: private/no-store admin HTML; guarded copy loading with retry; visitor cookie established in initial public document; visibility-aware counting with timer cancellation/rearming. All suites passed afterward. Production artifact smoke also passed public/private SSR and APIs, secure cookies, blocked unattached images, daily dedup and private/no-store owner HTML.

Storage remains nondestructive: removed uploads/soft-deleted media are retained and original publication time is preserved. Fresh private media requests are denied; previously downloaded public copies cannot be erased. Actual screenshots/browser tests were checked, without claiming physical-device frame-rate measurements. No deferred minor findings remain. Local preview stays on port3000; ongoing GitHub branch sync is authorized, no merge or deployment performed.
