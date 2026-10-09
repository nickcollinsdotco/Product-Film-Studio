# Edits re-lay themselves out per aspect ratio instead of being cropped

> **Ratios partly superseded by [ADR-0010](0010-loops-are-the-default-output.md) (2026-10-08):** a Loop's only routine Edit is 4:3, with 16:9 and 9:16 on request. The ratio list below still applies to full Films. Re-layout instead of cropping stands for both.

16:9 and 9:16 are first-class Edits; 4:5 and 4:3 come later. Each Shot template lays itself out for the target ratio rather than having every Edit cropped from one master, so type, framing and camera paths stay intentional in every ratio. This costs per-ratio layout work in every Shot template. Each Edit is its own entry file, rendered with `hyperframes render --composition`, and Edits of a Film may differ in pacing, order and which Shots they include.
