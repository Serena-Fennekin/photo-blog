# Gallery browsing and camera capture time

The user requested gallery-only public browsing, removal of the record-details link, correction of an eight-hour EXIF discrepancy, and approximately 150% sizing for the lightbox information panel.

- [x] Replace public record navigation with gallery photo links; keep batches as an administrator organization tool and redirect existing record URLs to the gallery.
- [x] Preserve camera wall time and its explicit EXIF offset during extraction. Display legacy UTC values in Asia/Shanghai, matching the existing uploader and verified original; leave explicit camera offsets intact.
- [x] Enlarge panel typography and controls, allow long values to wrap and short-window panels to scroll, retaining the complete-image viewport constraint.
- [x] Verify original upload metadata, legacy timestamps, desktop/mobile browsing and image bounds; synchronize the authorized GitHub branch.

Evidence: the reported original contains `DateTimeOriginal=2026:08:19 12:37:12` and `OffsetTimeOriginal=+08:00`; its public metadata contains `2026-08-19T04:37:12Z`. The existing UI slices the UTC text without applying a time zone. Disabling EXIF date revival preserves the camera's original representation.

Validation: the new date and link tests failed against the previous implementation, then passed after the changes. The full suite passed 68 tests; desktop/mobile public acceptance passed 14 tests and local publishing acceptance passed 2 tests. Type checking and the production build passed. Manual inspection of the reported photo now shows `2026-08-19 12:37` with the enlarged information panel and complete portrait image.

The first public browser run exhausted its 30-second whole-journey budget after a 19.98-second cold homepage load and multiple intentional curtains. Its individual functional assertions succeeded up to the final curtain wait. The multi-page walkthrough now has a 60-second total budget, retaining the existing per-assertion limits; the complete rerun passed.
