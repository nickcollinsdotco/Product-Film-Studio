# 01: Library: Quick Loop's render fixes

**What to build:** Library Loops get the image fixes Quick Loop got on 2026-10-14: zoom resizes the Screen instead of scaling it, so type is rasterised at its on-screen size; a transparent margin keeps tilted edges anti-aliased; a layered shadow fades as the zoom fills the frame; seeded dither stops dark gradients banding. Quick Loop stays as it is (ADR-0012). Bump the Library version and sync it into DeoVR.

**Blocked by:** None (can start immediately)

**Status:** done

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [x] A Draft of DeoVR's `home-bookend` shows crisp type at full zoom on paused frames, compared with the current render
- [x] Tilted Surface edges are clean at 8°; the shadow reads as layered and fades at full zoom; no visible banding on the Backdrop or shadow
- [x] Seam check still passes; tests pass
- [x] Rendered frames inspected before calling it done

## Notes (2026-10-14)

- Library 0.4.0, synced into DeoVR and the fixture. The geometry is a pure `CssRenderer.place(state, frame)`, tested in Node: at zoom 1 the Surface sits at its layout bounds; a zoom resizes every length (perspective included) and lands the Camera centre mid-frame, as the old camera scale did.
- **Shadow fade** differs from Quick Loop's on purpose: Quick Loop fades over its one focus zoom; the Library has no target zoom, so the shadow fades from zoom 1 to the zoom at which the Surface fills the frame's width (a 1.08× push keeps most of it).
- The phone's single shadow is now the layered one, so it fades too; rendered on the fixture phone Loop and looks right.
- Dither noise is built once per frame size and shared by every Shot.
- Checked on DeoVR `home-bookend` at 1600×900 (a Draft at 3200×1800 gives a full-size frame through the Draft encode): small type at 1.39× visibly sharper than before (`renders/vr-01/type-cmp.png`, before on top); edges clean at 8° tilt, no corner fringe (`edge.png`); Seam passes.
