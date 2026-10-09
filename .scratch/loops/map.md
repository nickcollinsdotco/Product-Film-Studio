# Map: Loops

Goal: ship 3–5 portfolio Loops of the VR website that clearly beat the Steel Hat phone clip, then build the full-Film layer when a real Film is wanted. Tickets live in `issues/`. The frontier is every ticket that is `open` with all its `Blocked by` tickets `resolved`; the lowest number goes first.

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
- Grilling history (Rounds 7–9): [round 9 handoff](../handoffs/2026-10-09-round-9-handoff.md).

## Fog

- Whether HyperFrames + Three.js beats a paid Ultramock control (01, 06). Against the free tier's 1920×1440 still it matches on in-focus sharpness once tuned (02).
- Seam thresholds across machines: frame 0 is byte-identical on one machine and GPU; another GPU, SwiftShader or a Chrome update is untested (02, 06).
- Depth of field with several Surfaces or a phone body under Three.js needs a real depth buffer; the look test used one analytic plane (07, 12).
- Multi-Shot Loops under Three.js: one canvas or WebGL context per Shot sub-composition (12).
- Whether a simple phone body is workable in CSS 3D (07, 08).
