# Curtain compositing regressions

User confirms the iris movement, but reports an end-of-transition white flash and a brief header wobble on About navigation. Native fixes in the existing feature worktree; base dc96518. Keep iris geometry/timing and cyclist animation.

1. Reproduce browser compositing output and record navigation/snapshot geometry. Add focused regressions before fixes: transparent output must not carry light into another compositor; original navigation must stay above snapshots without repainting the old header; scrollbars must not shift navigation.
2. Correct transparent GPU output using matching premultiplied context/shader, and keep the live header stable and separate from cloned content. Make only these rendering corrections.
3. Run relevant desktop/mobile and full unit suites, typecheck/build, visually inspect live navigation. One fresh final review, then authorized GitHub sync. Leave preview/data untouched.

Evidence: Chrome's standard screenshot compositor preserves transparent final pixels already, so this alone cannot reproduce the user's embedded-browser artifact. GPU readback exposes nonzero RGB under zero alpha. Test that compositing boundary directly and use portable premultiplied output. About snapshot contains another painted header, which covers the live navigation; assess scrollbar changes at the large viewport too.

Implemented matching premultiplied shader/context, persistent live header above the curtain, hidden snapshot navigation preserving its flow, and stable scrollbar space. Iris geometry/timing and cyclist motion unchanged. GPU readback was [181,199,191,0] before and transparent black after; header coverage regression failed before and passed after on desktop/mobile. A standard-compositor comparison and photo-modal stacking guard also pass. Full unit92/92, public browser38/38, typecheck and production build passed. Live navigation kept header x/y unchanged across covered/revealing/idle. Fresh final review pending.
