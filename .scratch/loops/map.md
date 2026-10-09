# Map: Loops

Goal: ship 3–5 portfolio Loops of the VR website that clearly beat the Steel Hat phone clip, then build the full-Film layer when a real Film is wanted. Tickets live in `issues/`. The frontier is every ticket that is `open` with all its `Blocked by` tickets `resolved`; the lowest number goes first.

## Notes

- `AGENTS.md` principles apply: rendered frames are the validation; grill-with-docs, to-spec, to-tickets, implement and handoff run only when the user types them.
- Tickets point to the ADRs and glossary instead of repeating them. Tickets marked "(user)" are ones only the user can do.

## Decisions so far

- Loops are the default output; v1 scope, delivery, the frame-0 rule, the Steel Hat bar: [ADR-0010](../../docs/adr/0010-loops-are-the-default-output.md).
- Bookend Seam check: [ADR-0011](../../docs/adr/0011-bookend-seam-is-checked-on-scene-state.md).
- Vocabulary: [GLOSSARY.md](../../GLOSSARY.md). Brief templates: [docs/brief-template/](../../docs/brief-template/).
- Grilling history (Rounds 7–9): [round 9 handoff](../handoffs/2026-10-09-round-9-handoff.md).

## Fog

- Whether HyperFrames + Three.js can get close to Ultramock at all (02, 06).
- Render time with DOF and bloom at 60fps; GPU versus software WebGL in headless Chrome (02).
- Multi-Shot Loops under Three.js: one canvas or WebGL context per Shot sub-composition (12).
- Whether a simple phone body is workable in CSS 3D (07, 08).
