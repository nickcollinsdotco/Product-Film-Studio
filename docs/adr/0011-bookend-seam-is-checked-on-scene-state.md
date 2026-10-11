---
status: accepted
---

# A Bookend's Seam is exact, and checked on scene state and on pixels

> **Partly superseded by [ADR-0012](0012-v1-is-light-css-loops.md) (2026-10-10):** v1 keeps the Seam check simple: the end matches the start by eye, plus a basic automated comparison. The pixel thresholds (SSIM/PSNR, measured noise floor) are dropped, and grain seeding waits with grain. The basic comparison is the scene-state checks below (pose, speed, no duplicate frame) plus a side-by-side image of t = D and t = 0, judged by eye. The checks are a state-based approximation, not proof of perceptual smoothness; angles are compared by shortest difference modulo 360°. Details: `.scratch/v1-library/spec.md`.

A Bookend's last Shot must end exactly on its first Shot's opening state: Camera, focus and Surfaces, and their speed, so that the Seam can't be seen. Because Primitives tween scene state (ADR-0007), the Library can assert this exactly and cheaply. The rendered pixels are checked too, as evidence that the Renderer agrees. We rejected matching Camera and focus only, which lets a dark Reveal opening restart visibly (as TLDR does), and judging the Seam by eye, which doesn't scale to a batch of Loops.

## Consequences

- **Pose.** The opening pose is reached at t = D, the Edit's duration, which is never rendered. The Library asserts `sceneState(D) == sceneState(0)` exactly. The pixel check compares PNG snapshots at t = D and t = 0 (SSIM/PSNR), taken before encoding so H.264 noise stays out of the threshold. Thresholds come from the look test, by rendering frame 0 twice per Renderer to measure its noise.
- **Speed.** The Library compares `state(D) − state(D − 1 frame)` with `state(1 frame) − state(0)`. Both sides at rest (ease out into the pose, ease in out of it) is the simple, valid case.
- **No duplicate frame.** The Library also asserts `sceneState(D − 1 frame) != sceneState(0)`. *Amended (2026-10-11):* only while the Seam is in motion, i.e. when `sceneState(1 frame) != sceneState(0)`. A still hold across the Seam (resting at both ends) passes, since a repeated frame at rest can't be seen; the unconditional rule would fail every Bookend that rests at both ends. This is a scene-state check, because if both sides are at rest, frame D − 1 and frame 0 can be identical in pixels while the motion is still correct.
- **Grain and dither** are seeded from t mod D, so t = D renders the same grain as t = 0.
- **A Bookend's last Shot is fixed to the end.** Extending it in Studio stretches its move. It never drifts past the end and never freezes. This is the one exception to ADR-0007's "a Shot's timeline never stretches". *Superseded (2026-10-10, [ADR-0012](0012-v1-is-light-css-loops.md)):* in v1 every Shot stretches, so this is no longer an exception. A Studio extend writes the new `data-duration` on the host clip, and the Shot reads it from there (`root.dataset.duration` is stripped on mount, so the catalog's `focus-swap` pattern doesn't work). Render picks it up; Studio preview needs a reload (ticket 05).
- The check warns on a Draft render and blocks the Final render. A Tour only gets the duplicate-frame check, because its Seam jumps by design.
