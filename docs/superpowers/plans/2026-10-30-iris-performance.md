# Smooth iris rendering

Native execution in existing feature worktree; base64e5e6f. User reports severe stutter, worse on large screens, and requires each blade to rotate smoothly out of view.

Diagnosis: profile actual1280x900 and3840x2160 navigation, both with/without iris and ambient effects. The existing nine animated inverse SVG clips cause repeated large-area rasterization. Corrected repeatable4K samples show p95 around53ms/max253ms, versus around6ms with the iris hidden. Profile code must wait for completed return navigation and ignore missed/no-animation samples. Preserve reference geometry, closed center, growing central view, header, palette and old camera source.

Implementation choice: one reusable GPU canvas, one analytical full-screen draw instead of per-blade SVG clipping. Precomputed blade axes animate smooth rotation plus radial withdrawal using a continuous acceleration curve. Bound backing pixels regardless of display/DPR; prewarm and reuse context; stop RAF at rest/unmount. Provide a bounded Canvas2D fallback for unavailable/lost WebGL. No external library, server or data changes. Keep route1100ms and cancellation/error logic.

1. Establish repeatable before metrics; renderer/model RED tests for bounded buffer, closed/middle/open raster output, smooth pose, cleanup/fallback. Tests must verify actual rendered output, not only mathematical coverage.
2. Implement renderer and persistent animation host; retain continuous background and reduced-motion behavior. Validate shapes and comparable frame traces before claiming improvement.
3. Full unit/typecheck/build, public desktop/mobile and local publishing/security; GPU/fallback screenshots at4K/portrait. One fresh final review and one verified material-fix pass, authorized branch sync, leave local preview running. No merge/deploy. Hardware frame measurements describe this machine only.

Verification: model RED→GREEN2/2; lifecycle regression RED→GREEN (disposed renderer and active context loss); actual GPU/2D raster tests at three sizes/two palettes. Full unit92/92, public browser30/30, isolated local publishing/security6/6, typecheck and production build passed. Script syntax and diff whitespace checked. Same-machine4K normal headless RAF P95 improved53ms→6ms; full qualified measurements in docs/performance/iris-2026-10-30.md. One fresh final review found no material code defects. Corrected measurement metadata to explicitly identify headless execution; it does not establish display FPS. Source unchanged after the passing suites.
