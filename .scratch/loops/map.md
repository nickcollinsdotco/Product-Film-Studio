# Map: Loops

Goal (2026-10-10): passable portfolio Loops that are quick, cheap and simple to make, in CSS 3D, guided by the Steel Hat clips; then the full-Film layer when a real Film is wanted. (Was: 3–5 VR Loops that clearly beat the Steel Hat phone clip.) Tickets live in `issues/`. The frontier is every ticket that is `open` with all its `Blocked by` tickets `resolved`; the lowest number goes first.

## Notes

- `AGENTS.md` principles apply: rendered frames are the validation; grill-with-docs, to-spec, to-tickets, implement and handoff run only when the user types them.
- Tickets point to the ADRs and glossary instead of repeating them. Tickets marked "(user)" are ones only the user can do.

## Decisions so far

- Loops are the default output; v1 scope, delivery, the frame-0 rule, the Steel Hat bar: [ADR-0010](../../docs/adr/0010-loops-are-the-default-output.md).
- Bookend Seam check: [ADR-0011](../../docs/adr/0011-bookend-seam-is-checked-on-scene-state.md).
- Vocabulary: [GLOSSARY.md](../../GLOSSARY.md). Brief templates: [docs/brief-template/](../../docs/brief-template/).
- 2026-10-09: the paid Ultramock control (01) is deferred for time and money. The look test (02) runs without it, against a free-tier export if one exists, otherwise the Ultramock showcase clips and the Steel Hat phone clip. Build or buy (06) still waits for 01.
- Studio extend reaches a Shot through the host clip's `data-duration`, not `root.dataset.duration` (stripped on mount); render stretches, preview needs a reload: [05](issues/05-studio-extend-duration.md).
- The portfolio's Framer cards lazy-load video and pause off-screen, so the 6 MB cap is per Loop as it scrolls into view: [03](issues/03-portfolio-lazy-load.md).
- Look test done: tuned Three.js matches the free Ultramock still on in-focus type, grain 0.03 survives 4–5 Mbps where dither alone bands, frame 0 is byte-identical on this machine; inputs for 06: [02](issues/02-look-test.md), [findings](../look-test/FINDINGS.md).
- Focus areas: `<screen>.areas.json` sidecar, 1x px boxes at layout width, proposed by Claude from the image, approved on a labelled overlay; no capture step yet: [09](issues/09-focus-areas.md).
- Ultramock control: free tier is enough for now, no Pro export; `control-free-02` is the like-for-like control, the 1920×1440 still the sharpness bar. 06 is unblocked: [01](issues/01-ultramock-control.md).
- X version: 960×720 60fps. X keeps a 1600×1200 original but serves 4:3 at 960×720 max, at about 350 kbps for a dark static scene. Grain is lost and the Backdrop blocks: [04](issues/04-x-test-upload.md).
- 2026-10-10, **build, lightly** (06, [ADR-0012](../../docs/adr/0012-v1-is-light-css-loops.md)): v1 is CSS 3D Loops in the Steel Hat style, no depth of field or grain; Three.js waits. Seam check by eye plus a basic automated comparison. Portfolio Rendition 6 MB at 5 Mbps. No destination-specific versions; one export command takes ratio, size and length. Ultramock Pro is the fallback. 07–12 are shelved; v1 tickets come from the v1 grilling.
- 2026-10-11, **v1 round 1** ([ADR-0012](../../docs/adr/0012-v1-is-light-css-loops.md)): built from Quick Loop's code inside the Library, no general framework. Scroll and Hold; Device frames none, browser, phone (PNG bezel); Backdrops brand colour, void, Backlight. Shots stretch to their duration. Frame size is an export setting (16:9, 9:16, 1:1, 4:5, 4:3 at 1600 px long edge, or custom), one source per Loop; first production Loop validated at 16:9 and 9:16. 60fps default pending one 30-vs-60 check. Seam: scene-state checks plus a t=D/t=0 image by eye. Ship when it looks right next to Steel Hat.
- 2026-10-11, **v1 round 2** (ADR-0012, `docs/brief-template/project.md`): a Loop card needs only Screen and Focus path; v1 inference is Scroll or Hold; each Loop names a primary Frame size; portrait browser uses Quick Loop's fill (provisional); half-size Draft plus a full-size Final render before shipping, no review page until two Loops; URL Screens via Quick Loop's capture (ADR-0006 accepted). **First production Loop:** VR website `home-full-1512@3x`, browser frame, Bookend (Hold on hero → Scroll to rail → back), validated at 16:9 and 9:16.
- 2026-10-11, **v1 spec** published: [`../v1-library/spec.md`](../v1-library/spec.md) (replaces shelved 11). Tickets 01–11 in [`../v1-library/issues/`](../v1-library/issues/) (11, phone frame, deferred); 01 first. ADR-0011 amended: duplicate-frame check only in motion; angles compared modulo 360°.
- Grilling history (Rounds 7–9): [round 9 handoff](../handoffs/2026-10-09-round-9-handoff.md).

## Fog

- Whether the VR website reads in 9:16 with the browser fill rule (first production Loop).
- Whether a PNG phone bezel holds up at about 20° of Y-tilt in CSS 3D (first render).
- Whether Quick Loop's CSS zoom keeps type sharp at close zoom (`will-change: transform` may scale a cached bitmap; first render).

Deferred with Three.js (ADR-0012):

- Whether HyperFrames + Three.js beats Ultramock Pro (06); only the free tier was tested (01). Against the free tier's 1920×1440 still it matches on in-focus sharpness once tuned (02).
- Seam thresholds across machines: frame 0 is byte-identical on one machine and GPU; another GPU, SwiftShader or a Chrome update is untested (02, 06).
- Depth of field with several Surfaces or a phone body under Three.js needs a real depth buffer; the look test used one analytic plane (07, 12).
- Multi-Shot Loops under Three.js: one canvas or WebGL context per Shot sub-composition (12).
