# 02: Focus area overlay

**What to build:** A command that draws a Screen's Focus areas (from its sidecar, loops ticket 09 format) as labelled boxes on the Screen, for approval in one reply.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Reads `<screen>.areas.json` (1x px boxes at the stored layout width) and draws each box with its name on the Screen, scaled to the Screen's real resolution
- [x] Writes one overlay image, using the image library already in the repo
- [x] Tested on a synthetic Screen and sidecar

## Notes

- `npm run library:overlay -- <screen-image> [--out <file>]` (`tools/library/overlay.mjs`). Default output `renders/overlays/<screen>.areas.png` (git-ignored; Screens can be client material).
- Drawn with sharp (an SVG composited on the Screen), not PIL: the v1 spec's "image library already in the repo". Box stroke and labels are sized in 1x px and scaled by image width / `layoutWidth`, so they read the same on 1x and 3x Screens (checked on a 3x upscale of the fixture).
- `whole` is skipped. Areas running past the Screen are warned about, not rejected. A missing `layoutWidth` is an error here, though `loop-model.js` falls back to the Screen's width.
- Tall 3x pages (e.g. 4536×14388) make a large PNG; pass `--out x.jpg` if that's a problem.
