# Edits re-lay themselves out per aspect ratio instead of being cropped

> **Ratios partly superseded by [ADR-0010](0010-loops-are-the-default-output.md) (2026-10-08):** a Loop's only routine Edit is 4:3, with 16:9 and 9:16 on request. The ratio list below still applies to full Films. Re-layout instead of cropping stands for both.

> **Partly superseded by [ADR-0012](0012-v1-is-light-css-loops.md) (2026-10-11):** in v1 a ratio is an export setting, not a separate Edit file. A Loop has one source; Shot templates re-lay themselves out by a few explicit rules per ratio, with no per-ratio choreography. Presets are 16:9, 9:16, 1:1, 4:5 and 4:3 at a 1600 px long edge, plus custom sizes. Re-layout instead of cropping still stands.

16:9 and 9:16 are first-class Edits; 4:5 and 4:3 come later. Each Shot template lays itself out for the target ratio rather than having every Edit cropped from one master, so type, framing and camera paths stay intentional in every ratio. This costs per-ratio layout work in every Shot template. Each Edit is its own entry file, rendered with `hyperframes render --composition`, and Edits of a Film may differ in pacing, order and which Shots they include.
