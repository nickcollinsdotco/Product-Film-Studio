# 02: Library: high-quality Final encode

**What to build:** a Final render goes through a PNG sequence, then FFmpeg's error-diffusion RGB→YUV conversion (Quick Loop's path), into the portfolio Rendition. Drafts keep the fast direct render. The Rendition rules don't change: 5 Mbps, lowered only to stay within 6 MB.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [ ] A Final render of `home-bookend` is ≤ 6 MB, H.264 High, yuv420p, faststart, no audio
- [ ] Dark gradients show less banding than the current Final at the same bitrate, judged on paused frames
- [ ] The Seam check runs and blocks as before; temporary frames are deleted afterwards
- [ ] Drafts are no slower than today
