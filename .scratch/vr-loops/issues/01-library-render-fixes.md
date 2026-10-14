# 01: Library: Quick Loop's render fixes

**What to build:** Library Loops get the image fixes Quick Loop got on 2026-10-14: zoom resizes the Screen instead of scaling it, so type is rasterised at its on-screen size; a transparent margin keeps tilted edges anti-aliased; a layered shadow fades as the zoom fills the frame; seeded dither stops dark gradients banding. Quick Loop stays as it is (ADR-0012). Bump the Library version and sync it into DeoVR.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [ ] A Draft of DeoVR's `home-bookend` shows crisp type at full zoom on paused frames, compared with the current render
- [ ] Tilted Surface edges are clean at 8°; the shadow reads as layered and fades at full zoom; no visible banding on the Backdrop or shadow
- [ ] Seam check still passes; tests pass
- [ ] Rendered frames inspected before calling it done
