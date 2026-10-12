# 08: 30 vs 60fps check

**What to build:** Lock the 60fps default on evidence (ADR-0012).

**Blocked by:** 03, 05

**Status:** done

- [x] One representative Scroll Shot rendered at a 1600 px long edge and 5 Mbps, at 30 and at 60fps
- [x] Compared for smoothness (by eye), compression quality and render time; results recorded here
- [x] 60fps kept unless the test shows a material downside for most uses; no benchmarking framework

## Notes (2026-10-12)

- **Test Loop.** One Scroll Shot, 6s Tour, VR home Screen (`home-full-1512@3x.png`) from `hero` to `look-closer` in the browser frame on the pink Backdrop: a long, fast scroll over small grey type, the hardest case for both judder and compression. Final, Landscape 1600×900, 5 Mbps Rendition. Throwaway entry, deleted after.
- **Smoothness.** Per-frame scroll step at peak speed, measured by aligning consecutive frames: 21 px at 60fps, 42 px at 30fps. With no motion blur in v1, 42 px jumps on small type read as judder; 60 halves the step. (Measured, not watched: Claude can't play video. Renders kept for Nick to watch.)
- **Compression** (each Rendition against its own CRF 10 render): 60fps SSIM 0.990, PSNR 41.7 dB (min 38.1); 30fps SSIM 0.987, PSNR 40.1 dB (min 35.3). At the same bitrate 60 is slightly *better*: consecutive frames differ less, so inter prediction is cheaper. Sizes 4.07 MB (60) and 3.97 MB (30); both well under 6 MB. Same frame side by side: small grey meta text marginally softer at 30.
- **Render time.** Whole export (render + two-pass encode): 24s at 60, 16s at 30. HyperFrames render alone: 19s and 14s. About 1.5×, a few seconds per Loop.
- **Decision: 60fps stays the default** (ADR-0012). No material downside: render cost is small in absolute terms, quality per bit is equal or better, motion is smoother. `--fps 30` remains for a destination that needs it.
- Renders: `renders/library/deo-vr/scroll-1600x900-final.mp4` and `…-final-30fps.mp4` (git-ignored, about 8 MB; delete after watching).

## Comments

- 2026-10-12, Nick watched both: 30fps looks horrible; 60 makes a big difference. Default confirmed.
