# Memory and Cycling Editorial Revision

> Native execution using superpowers:executing-plans. Continue in the existing worktree and preserve the running preview. User annotations specify the design and authorize copywriting; no additional approval gate is needed.

**Goal:** Use the quotation as the homepage opening, center copy on photographs returning us to a past moment, and connect photography to cycling.

**Design:** Keep the established paper/forest palette and serif typography. Remove the old photo hero rather than restyle it again. Introduce unequal desktop photo columns with the right column lowered; preserve source order and centered full-width photos on mobile. Reduce page labels, let the writing carry the about page, and use accessible green/amber badges for publication state. Reserve a quiet center footer slot for an actual future registration number; never fabricate one.

**Task 1 — Editorial pages and settings**
- [x] Make GalleryInvitation the sole homepage h1, replace 看见 with 记录下来, remove HomeHero and its unused animation/styles.
- [x] Rewrite featured, home-about and about copy around memory, photography and cycling; remove about footer and redundant index.
- [x] Shrink gallery/about h1, enlarge gallery introduction; add uneven desktop columns and a mobile reset preserving DOM order.
- [x] Remove obsolete visible hero controls from admin settings; retain legacy API fields without a destructive data migration and accept featured-only settings updates.
- [x] Add footer registration placeholder, configurable with NUXT_PUBLIC_ICP_NUMBER, with a real registration link only when configured.

**Task 2 — Photo manager**
- [x] Remove前移/后移 buttons and hints, retain and verify drag ordering.
- [x] Mark 已发布 green and 草稿 amber in both themes, retaining status text and checkbox selection.

**Task 3 — Verification and sync**
- [x] Run focused component/data checks (RED→GREEN where behavior changes), complete unit/type/build checks and desktop/mobile browser suites.
- [x] Exercise drag ordering and state labels on isolated data, inspect desktop/mobile screenshots, obtain one fresh final read-only review.
- [x] Synchronize the already-authorized development branch and existing PR; keep preview and user data intact.

**Review Focus:** Missing first-screen content after hero removal; stale legacy hero settings blocking featured-only saves; desktop offsets leaking into mobile or breaking DOM order; selection checkbox losing its accessible name; placeholder presenting a fake registration number; drag-only UI losing its sorting persistence.

## Completion record

76 unit/component/integration checks, 18 public desktop/mobile browser cases and 2 isolated publishing/navigation cases passed, with typecheck and production build. Fresh final review identified keyboard sorting as a regression after button removal; a focus/reorder/reload assertion was observed RED, then passed after card keyboard controls, preserved focus and announced position were added. Visible reorder buttons remain removed. Existing photo data was not migrated or changed for this iteration. The development preview remains on port 3000.
