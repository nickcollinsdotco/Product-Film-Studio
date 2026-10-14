# 02: Library: high-quality Final encode

**What to build:** a Final render goes through a PNG sequence, then FFmpeg's error-diffusion RGB→YUV conversion (Quick Loop's path), into the portfolio Rendition. Drafts keep the fast direct render. The Rendition rules don't change: 5 Mbps, lowered only to stay within 6 MB.

**Blocked by:** None (can start immediately)

**Status:** done

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [x] A Final render of `home-bookend` is ≤ 6 MB, H.264 High, yuv420p, faststart, no audio
- [x] Dark gradients show less banding than the current Final at the same bitrate, judged on paused frames
- [x] The Seam check runs and blocks as before; temporary frames are deleted afterwards
- [x] Drafts are no slower than today

## Notes (2026-10-14)

- A Final renders a PNG sequence, then two-pass x264 at the Rendition bitrate through `scale=…error_diffusion`, tagged BT.709 (`setparams`, since PNGs carry no tags and the output flags alone didn't stick; the test caught it).
- Banding: a Backlight variant of `home-bookend`, Draft encode against Final, both with the dither, so only the encode differs. At 8× level boost the Draft shows hard concentric bands with hue steps; the Final is much smoother (`renders/vr-01/glow-cmp.png`, Draft left).
- `home-bookend` Final: 5.93 MB at 4.8 Mbps; Seam passes. A 9.5s Final takes about 3 min against 40s for the Draft path. Drafts are unchanged.
- The export reports `source` (`video` or `png-sequence`), asserted in the tests.
