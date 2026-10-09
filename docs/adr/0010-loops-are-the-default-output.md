---
status: accepted
---

# Loops are the default output; full Films are occasional

The plan was Film-first: 15–20s product films with titles, music and an end card, building the Library on the first real Film. The default output is now the Loop: a short, silent, untitled Film of one Screen that plays on repeat, about 3–5 per Project, with a full Film made only occasionally. Portfolio cards autoplay muted and the page supplies the words, so a Loop matches where the work is actually seen, and the first good output arrives sooner. The cost is that the hard part moves from story and type, which Claude handles well, to image quality (depth of field, bloom, grain, banding, the Seam), which can only be judged by rendering.

Whether we build Loops ourselves, or make them in Ultramock and build only the full-Film layer, is decided by a bake-off: an Ultramock control and a look test (pending). If it points to buying, the Steel Hat Loop is made in Ultramock as a second control instead of being rebuilt here. The VR website stays the first test case.

## Consequences

- Loops are Films. Edit, Shot, Transition, Draft render and Final render apply unchanged, and each Loop is a Film folder under `films/` (ADR-0009).
- A Loop's only routine Edit is 4:3, with 16:9 and 9:16 on request; full Films keep 16:9 and 9:16 (ADR-0005). The 4:3 render size is pending.
- Loops skip the Shot list and Contact sheet. A Project's Loops are Draft rendered in one batch and reviewed together at card size; the only approval gate is the Final render. Full Films keep the full process.
- v1 Loops use Screens only. Recordings, the Cursor and the type Primitives belong to the full-Film layer.
- Scroll Shots use one tall Screen, not a Recording, with any pinned header captured separately. A 3x mobile page exceeds the 16k GPU texture limit, so a Three.js Renderer must tile it.
- v1 Device frames for Loops are none and a simple phone body: a flat-shaded rounded slab with real thickness, not photoreal. A flat image of a phone on a tilted plane reads as cardboard. Until Orbit exists, the phone sits at a fixed tilt.
- Every Loop opens on a lit, settled framing. Frame 0 is the poster when autoplay is blocked and the first thing seen on every repeat, so a separate poster image wouldn't fix a dark opening. A Reveal comes only after a cut, and only when named.
- Delivery is one H.264 MP4 per Edit (High profile, yuv420p, faststart, no audio track). Framer serves the uploaded file byte for byte, so our encode is what viewers get, and each Loop has a file-size budget: provisionally 6 MB, because a page shows several Loops. The look test tests bitrate, grain and banding together; if 4–5 Mbps can't hold visible grain at 60fps, we use dither only rather than raise the cap. AV1/WebM is out until we know Framer's Video component takes more than one source.
- The bar for Loops on the portfolio is the Steel Hat phone clip (`references/own/steel-hat-phone.mp4`), and for full Films the Steel Hat laptop Film. A Loop ships only if its Seam passes its shape's check, its in-focus type is visibly sharper on paused frames at the same display height, and its motion lands on a named Focus area.
- Loops deliberately follow the structure of Ultramock's showcase clips. They stand apart through image quality and the Steel Hat bar, not through structure.

## Supersedes

Decisions settled in conversation on 2026-10-08, recorded in `.scratch/handoffs/2026-10-08-scope-review-handoff.md`:

- Film-first, building the Library on the first real Film.
- About 1–4 films a month. Now about 3–5 Loops per Project plus an occasional full Film.
- 16:9 and 9:16 first-class, 4:5 and 4:3 later. Now true for full Films only.
- Approval gates at the Shot list, Contact sheet and Studio timing pass. Now true for full Films only.
- v1 Primitives `cursor.*` and `type.*`. Moved to the full-Film layer, and `type.reveal` is renamed `type.enter`.
- "References are vocabulary and a quality bar, not templates." Superseded for Loops, which template Ultramock's structure on purpose. Still holds for full Films.
