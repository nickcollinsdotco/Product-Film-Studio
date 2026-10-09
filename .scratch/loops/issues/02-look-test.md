# Look test: CSS fake against Three.js against the control

Type: prototype
Status: open

Timebox one working session, in `.scratch/look-test/`, using the prototype skill. The control (01) is optional: if the user has made a free-tier Ultramock export, match framing and timing to it and compare against it; otherwise compare against `references/ultramock/*.mp4` and `references/own/steel-hat-phone.mp4`. The like-for-like comparison with a paid control waits for 06.

Setup: the VR website Screen on a bare tilted plane, dark void with Backlight, one focus shift between two Focus areas, 4:3, 60fps, 5s. No devices, no Recordings.

- Version 1: CSS screen-space ramp (stacked `backdrop-filter` layers with gradient masks).
- Version 2: Three.js, image texture with mipmaps and anisotropic filtering, real DOF, bloom, grain.

Measure:
- frames against the control (or the Ultramock showcase clips), and against `references/own/steel-hat-phone.mp4` at the same display height, sharpness judged on paused frames;
- render time; Studio playback; what `check` and its motion audit do with a canvas (ADR-0007 caveat); WebGL determinism;
- Version 2 rendered natively at 1600×1200 and 1920×1440, compared at card size on a 2x display (1920×1440 only if in-focus type is visibly sharper);
- frame 0 rendered twice per version as PNG before encoding, to set the Seam thresholds (ADR-0011);
- bitrate, grain and banding together against the 6 MB cap at 4–5 Mbps; if visible grain doesn't hold, dither only.

Done when: a findings note with contact sheets and numbers for each bullet is linked here under `## Answer`.

## Answer

Findings note: [`.scratch/look-test/FINDINGS.md`](../../look-test/FINDINGS.md). Contact sheets are in `.scratch/look-test/sheets/` (git-ignored: client Screen and third-party frames; local only). Run on 2026-10-09 against the free-tier control (`references/ultramock/control-free*`), with Focus areas `title → rail` (boxes in 1x px: `title` 1000,220–1360,660; `rail` 48,685–1464,850).

- **Frames.** At the same display height both versions are visibly sharper than the free control video (720p) and Steel Hat. Against the Pro-like 1920×1440 still `control-free 02.png`, Version 2 at its first settings was softer (title p99 edge gradient 91 against 119). After two fixes, texture LOD bias −0.5 and a gentler aperture, it's on par or better (142). Version 1's in-focus type equals Version 2's first settings (121 against 123). Bloom had no effect on type.
- **Render time** (1600×1200, 300 frames, hardware GPU): Version 2 2m 36s (1920: 3m 36s); Version 1 1m 18s. Version 2's shading costs 1.6 ms per frame, so capture sets the time.
- **Studio.** Version 2 plays in real time when the pane is visible. Nothing inside the canvas is editable on the timeline. A false "Root timeline not bound" warning appears in the console. Version 1 wasn't measured.
- **`check` on a canvas.** It passes. Contrast checks 0 elements. The motion audit's `keepsMoving` does see canvas motion: it flags a frozen canvas as `motion_frozen`. DOM-box assertions can't target in-canvas objects.
- **WebGL determinism.** Frame 0 rendered twice is byte-identical, for both versions, and so is the render's frame 1. A whole Version 2 render twice: 299 of 300 frames identical, the last off by 1 LSB in one pixel. The noise floor on this machine is 0, so Seam thresholds can be near-exact (proposal: max |Δ| ≤ 2 LSB or PSNR ≥ 60 dB, t=D and t=0 rendered in the same run). Other GPUs or SwiftShader weren't tested.
- **Resolution.** At an 800 CSS px card on a 2x display, 1600 and 1920 are indistinguishable. At 960 CSS px, 1920 is marginally crisper on small captions. 1920 costs +38% render time.
- **Bitrate, grain, banding.** About 2.9 MB per 5s at 5 Mbps and 2.4 MB at 4 Mbps, so the 6 MB cap holds a ~10s Loop at 5 Mbps. **Dither alone doesn't survive H.264 at 4–5 Mbps** (clear bands at ×6 contrast). **Grain at 0.03 does survive** (about half its high-frequency energy is kept, and it prevents the banding). This reverses ADR-0010's "dither only" fallback. At normal contrast, banding is barely perceptible on this dark Backlight. 4 and 5 Mbps look the same on type.

Left open for the user's review. Inputs for 06 (user decisions): resolution, Seam thresholds, grain policy and cap, and whether Version 2 beats a paid control.

