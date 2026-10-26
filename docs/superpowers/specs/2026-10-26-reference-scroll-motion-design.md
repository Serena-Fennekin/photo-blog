# Reference-Inspired Homepage Scroll Motion Design

## Intent

Retain the current PHOTO JOURNAL homepage layout, content hierarchy, themes, and route curtain while replacing its generic fade/side-slide entrances with the more editorial motion language observed on `brrphoto.netlify.app`: masked type reveals, photographs emerging from a dimmed state, deliberate stagger, restrained scroll-linked parallax, and a slow inertial scroll response.

The result should feel like turning through a photographic journal. Motion should direct attention from text to image and then to the next chapter; it must not make the page feel like a template demo.

## Goals

- Reveal authored headline lines through clipped masks, moving upward into view rather than fading the whole block.
- Reveal photographs with a short clip/scale/brightness transition, with captions arriving after the image.
- Sequence each section so label/date, title, image, note, and link do not enter simultaneously.
- Add gentle scroll-linked image parallax after the entrance animation, keeping the page's native scrolling behavior.
- Give desktop wheel and trackpad input a damped, slow catch-up motion so scrolling and section choreography feel like one continuous gesture.
- Preserve the existing desktop and mobile layouts, all three theme modes, sticky navigation, and route curtain.
- Preserve accessible static content when the operating system requests reduced motion.

## Non-goals and anti-goals

- Do not copy the reference site's layout, photographs, colors, text, or loading screen.
- Do not introduce pinned sections, transform the whole site shell, or create long waits before content becomes readable.
- Do not animate every element independently. Each section gets one composed editorial gesture.
- Do not change the gallery, lightbox, story, about, upload, or data/backend behavior in this change.

## Chosen approach

The selected approach is **motion-language replication**: preserve the current design and reproduce the reference site's animation grammar within it.

Alternatives considered:

1. **Motion-language replication (selected):** strongest visual improvement without discarding the approved page structure.
2. **Motion and layout replication:** would also rebuild the chapters as a large asymmetric photo collage; rejected because it changes the site's established hierarchy and creates a larger responsive-design project.
3. **Light motion tuning:** would only adjust the current easing and delays; rejected because it would not create the reference site's distinctive masked reveal.

For inertial scrolling, the selected implementation is **Lenis**:

1. **Lenis (selected):** adds real damping while preserving the existing fixed header, sticky gallery filters, and route-curtain structure.
2. **GSAP ScrollSmoother:** avoids a new dependency but requires a transformed wrapper and special treatment for fixed/sticky UI; rejected because this site already relies on both.
3. **Animation-only scrub:** softens parallax but does not change the physical scroll response; rejected because it does not provide the requested resistance.

## Motion choreography

### Hero

- The eyebrow, title, and lede receive authored reveal wrappers.
- Title and supporting copy rise through their masks in sequence using `power3.out`; the title is the dominant gesture.
- The hero frame reveals at the same time through a shallow bottom-to-top clip, slight scale reduction, and brightness recovery.
- Figcaption and vertical index enter last and quietly.
- No scroll-linked movement is added to the primary hero frame until the load sequence has settled.

### Time chapters

- The date and title use independent vertical masks instead of opposing horizontal fly-ins.
- The note and link follow with smaller vertical travel and shorter duration.
- The primary photograph reveals first; secondary photographs follow at roughly 120 ms intervals.
- Images begin slightly dimmed and enlarged, then settle to their natural brightness and scale.
- Once visible, desktop images move by a small `yPercent` over the time they cross the viewport. Mobile keeps the entrance choreography but uses a smaller parallax range.
- Each entrance plays once. Parallax remains scroll-linked and reversible because it describes spatial movement rather than an entrance.

### Gallery invitation

- The quotation mark makes one restrained scale/rotation gesture.
- The two authored copy lines rise through separate masks.
- The divider grows horizontally, followed by the gallery link.

### About block

- Label, body, and link use the same masked vocabulary with a compact stagger.
- The block remains visually quiet so the gallery invitation is still the page's concluding emphasis.

## Timing and behavior

- Entrance triggers begin when a section reaches approximately 80% of the viewport height.
- Main reveal durations stay between 0.65 and 1.05 seconds.
- Delays are created by timeline overlap, not by making the section wait off-screen.
- `power3.out` is the default reveal easing; image parallax uses a scrub value around `0.6–0.8` for a softened response.
- Native page scrolling remains in control. Existing CSS smooth scrolling may continue for anchor navigation only.
- The homepage initializes Lenis for desktop wheel/trackpad input with an initial `lerp` near `0.075` and a wheel multiplier near `0.85`. Browser QA may tune these values within a narrow range so the catch-up feels slow without exceeding roughly one second.
- Lenis and ScrollTrigger share GSAP's ticker. A Lenis scroll event updates ScrollTrigger, avoiding two competing animation loops.
- Touch dragging stays native (`syncTouch: false`); the reveal choreography remains enabled with shorter distances.
- Lenis is scoped to the homepage and destroyed when leaving it. Gallery, story, about, lightbox, and admin scrolling remain unchanged.
- `prefers-reduced-motion: reduce` skips GSAP setup and leaves every element fully visible with no clip, transform, filter, or opacity dependency.
- `prefers-reduced-motion: reduce` also skips Lenis, preserving immediate native scrolling.

## Implementation boundaries

- Extend the existing `data-home-motion` markers in `HomeHero.vue`, `TimeChapter.vue`, `GalleryInvitation.vue`, and the homepage about block.
- Add reusable mask/reveal styling to `app/assets/css/main.css`; do not add another animation library.
- Add the maintained `lenis` package and its base CSS. Create a small homepage-scoped composable that owns Lenis initialization, GSAP ticker synchronization, and cleanup.
- Refactor `useHomeAnimations.ts` into small choreography helpers inside the same module, while retaining scoped GSAP context cleanup.
- Continue dynamically importing GSAP and ScrollTrigger only on clients that allow motion.
- Dynamically import Lenis on the client only when motion is allowed; do not add it to the server-rendered path.
- Avoid runtime text splitting. Fixed authored lines may be explicit spans; dynamic story titles reveal as a single masked block so server rendering and accessibility remain predictable.

## Verification

- Unit tests verify reduced-motion bypass, scoped cleanup, once-only entrance timelines, and separate scrubbed parallax triggers.
- Unit tests verify Lenis receives the selected damping options, shares the GSAP ticker, updates ScrollTrigger, and is destroyed on homepage unmount.
- Component tests verify the reveal markup does not alter readable text or link semantics.
- End-to-end checks cover desktop and mobile scrolling, light/dark/system themes, and route-curtain navigation after animation.
- Browser QA captures the hero, a chapter entering, the invitation, and reduced-motion mode to check for clipping, layout shifts, image flashes, and stale transforms after navigation.

## Builder decisions

- Preserve the current palette, typography, and layout tokens; this is a motion redesign rather than a visual rebrand.
- Use CSS overflow/clip wrappers plus GSAP transforms instead of GSAP SplitText, avoiding a new dependency and unpredictable dynamic line splitting.
- Retain all motion on mobile but shorten travel distance and parallax range to avoid exposing empty image edges.
- Apply inertial scrolling only to the homepage's desktop wheel/trackpad path. This keeps touch gestures direct and prevents the global shell or lightbox from inheriting scroll state.

