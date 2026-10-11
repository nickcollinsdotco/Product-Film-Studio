# 04: Bookend Seam check

**What to build:** Before a Bookend renders, the export checks its Seam on scene state and writes an image of t = D beside t = 0. A failed check blocks a Final render and warns on a Draft. Tours skip it. Rules as amended in ADR-0011 and stated in the spec.

**Blocked by:** 01

**Status:** done

- [x] Pose: `state(D) == state(0)` exactly
- [x] Movement continuity: velocity into the Seam equals velocity out of it within a fixed float tolerance; both zero at rest
- [x] Duplicate frame: fails only if `state(D − Δ) == state(0)` while the Seam is in motion; a still hold across the Seam passes
- [x] Angular values are compared by shortest signed difference modulo 360°
- [x] Documented as a state-based approximation, not proof of perceptual smoothness; no general motion analysis
- [x] The side-by-side image of t = D and t = 0 is written for every Bookend
- [x] Tests (Loop model): pose pass and fail; continuity pass at rest and in motion, fail on a lurch; duplicate frame fails in motion, passes on a hold; angles across the ±180° wrap. Export: a broken fixture Seam blocks Final and warns on Draft

## Notes (2026-10-11)

- **Where it lives.** `LoopModel.seamCheck(stateAt, { duration, fps })` and `seamOf(loop, { fps })` in `library/loop-model.js`; `tools/library/seam.mjs` reads an entry into a Loop and draws the image; `export.mjs` runs it before rendering.
- **Loop shape** is `data-loop-shape="bookend" | "tour"` on the entry root. No shape: Draft warns, Final blocks. The fixture `hold` and `hold-scroll` Loops are marked `tour`; `bookend.html` (passes) and `bookend-broken.html` (fails pose) are new.
- **Tolerance, not exact ≠.** "In motion" and the duplicate-frame equality use the per-value speed tolerance (0.01 px or degree per frame, 1e-4 zoom). Exact inequality would read an ease's millionths of a pixel as motion and fail the VR Bookend's shape (still tail into the Seam, ease out of it). Pose stays exact. Recorded in ADR-0011 and the spec.
- **Seam image** `<loop>-<W>x<H>-<draft|final>-seam.png` beside the render: t = D left, t = 0 right, drawn by the Project's own CSS Renderer and Loop model in HyperFrames' Chrome (`hyperframes snapshot` can't pick a composition or show t = D, where every clip has ended). Checked against the real Draft's frame 0: same framing, mean difference about 2/255 (H.264 chroma and edges).
- **Final** is a minimal flag for now (full primary size, `-final` name) so the check can block it; ticket 05 owns the Rendition.
- **Known overlap:** `seam.mjs` reads host clips from HTML the way `shot.js` reads them from the DOM. If a Shot gains a field, change both.
