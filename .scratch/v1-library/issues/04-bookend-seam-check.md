# 04: Bookend Seam check

**What to build:** Before a Bookend renders, the export checks its Seam on scene state and writes an image of t = D beside t = 0. A failed check blocks a Final render and warns on a Draft. Tours skip it. Rules as amended in ADR-0011 and stated in the spec.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Pose: `state(D) == state(0)` exactly
- [ ] Movement continuity: velocity into the Seam equals velocity out of it within a fixed float tolerance; both zero at rest
- [ ] Duplicate frame: fails only if `state(D − Δ) == state(0)` while the Seam is in motion; a still hold across the Seam passes
- [ ] Angular values are compared by shortest signed difference modulo 360°
- [ ] Documented as a state-based approximation, not proof of perceptual smoothness; no general motion analysis
- [ ] The side-by-side image of t = D and t = 0 is written for every Bookend
- [ ] Tests (Loop model): pose pass and fail; continuity pass at rest and in motion, fail on a lurch; duplicate frame fails in motion, passes on a hold; angles across the ±180° wrap. Export: a broken fixture Seam blocks Final and warns on Draft
