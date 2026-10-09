# Look test (ticket 02): findings

PROTOTYPE, throwaway. One session on 2026-10-09. The VR website hero Screen (`home-hero-1512x982@3x.png`, 4536×2946) is on a bare tilted plane in a dark void with Backlight. One focus shift, `title → rail`: settled on `title` until 1.1s, the move runs 1.1–3.6s, settled on `rail` after. 4:3, 60fps, 5s. Both versions share the exact camera maths: Version 1's `matrix3d` is Version 2's view matrix done by hand, so framing matches frame for frame.

- Version 2 (Three.js): `templates/v2-three.template.html`. Mipmapped texture with 16× anisotropic filtering. 4× MSAA render target, half float. Custom depth of field: depth comes analytically from the Screen plane, so the blur extends softly past the plane's edges; a 96-tap golden-angle gather. UnrealBloom, then a grade pass with grain seeded by frame index `t mod D`, TPDF dither and the sRGB encode.
- Version 1 (CSS): `templates/v1-css.template.html`. A CSS 3D plane. Depth of field is five stacked `backdrop-filter` layers whose gradient masks sit either side of the screen-space focus line. Grain is a soft-light noise tile seeded by frame index; Backlight is a radial gradient.
- Build: `node tools/build.mjs <v1-css|v2-three> <width> [overrides-json]` writes `index.html`. Encode: `tools/encode.sh`. Metrics: `tools/sweep.py`, `tools/crops.sh`, `tools/shimmer.py`.
- Contact sheets and crops are in `sheets/`, which is git-ignored because the frames show the client Screen and third-party clips. Raw masters are in `out/` (also ignored; delete when done).

Machine: Windows, RTX 5070 Ti. HyperFrames' headless Chrome uses the hardware GPU (ANGLE D3D11, auto-probed). Software WebGL wasn't tested.

## Frames against the control and Steel Hat

The free control is 1280×720, 30fps, ~7.9 Mbps and watermarked. Neither the free control nor `steel-hat-phone.mp4` (1080×1080, 1.09 Mbps) is a like-for-like quality bar. The closest stand-in for Pro quality is the free 1920×1440 still `control-free 02.png`.

- **Same display height**: 1200 device px, i.e. a 600 CSS px card on a 2x display, paused, all sources scaled to it (`sheets/same-display-height-v2-v1-control-steelhat.png`). In-focus type in both versions is visibly sharper than both the free control video and Steel Hat.
- **Against the Pro-like still** (pre-encode against pre-encode; `sheets/control-still02-vs-v2-1920-*.png`). The measure is the 99th-percentile luma edge gradient on the title lines; higher is crisper.

  | Source | Title p99 gradient |
  | --- | --- |
  | Ultramock still 02 (1920×1440) | 119 |
  | Version 2, 1920, first settings (LOD bias 0, aperture 6) | 91 (visibly softer) |
  | Version 2, 1920, LOD bias −0.5 | 104 |
  | Version 2, 1920, LOD bias −0.5, aperture 3.5 | **142** (visibly on par) |

  Two things closed the gap. Trilinear mip filtering was softening the type, which a negative LOD bias fixes. And the first aperture made the in-focus band too narrow; Ultramock keeps the subtitle and meta row sharp too. Bloom had no measurable effect on type (identical numbers with bloom at 0).
- **Version 1 against Version 2** at 1600, on the in-focus word: Version 1 scores 121, Version 2 scores 123 at LOD bias 0 and 145 at −0.5. CSS rasterising is no worse than WebGL by default; WebGL pulls ahead only with the bias.
- **Shimmer from the negative LOD bias.** Measured on the in-focus rail type during the settled, drifting hold (frames 230–300): the mean temporal second difference on edge pixels, minus the flat-area baseline, which cancels the per-frame dither. Result: 0.67 LSB at bias −0.5 against 0.60 LSB at bias 0 (+11%). That's consistent with sharper edges under sub-pixel drift, and no aliasing showed. Not judged by eye in motion yet: review `sheets/v2-1600-tuned-5M.mp4`.
- **Tuned defaults now in the template**: LOD bias −0.5, aperture 3.5. The bitrate sweep, determinism and resolution masters above were rendered with the first settings (bias 0, aperture 6). Neither change touches the grade, so those results stand.

## Render time

1600×1200, 300 frames, PNG sequence, 5 workers, screenshot capture:

| | 1600×1200 | 1920×1440 |
| --- | --- | --- |
| Version 2 | 2m 36s | 3m 36s |
| Version 1 | 1m 18s | — |

Version 2's GPU cost is 1.6 ms per frame (DOF, bloom and grade, measured in Studio with `readPixels` sync), so render time is set by capture, not shading.

## Studio playback

- **Version 2** plays in real time when the Studio pane is visible: 3.00s of media in 3.00s of wall time, 145 distinct frames/s. A hidden pane throttles `requestAnimationFrame` to about 6fps, so measure visibly. The timeline shows no clips and no keyframes: nothing inside a Three.js Shot can be edited in Studio. Studio's console also logs "Root timeline not bound — render will freeze at t=0". That's false here (`data-no-timeline`, three adapter); the renders are correct.
- **Version 1** wasn't measured in Studio (out of time). Its GSAP timeline tweens a state object, which the Q1 spike found opaque to Studio's keyframe editor.

## `check` and the motion audit on a canvas (ADR-0007 caveat)

Evidence: `evidence/check-v2*.json`, `evidence/check-v1.json`.

- **Version 2** passes: lint 0, runtime 1 warning (an ANGLE shader-compiler note about a texture fetch in a loop), layout 1 info (`canvas_content_at_edge`). Contrast checks **0 elements**, so it can't flag blurred type, and can't check in-canvas type either.
- **Motion audit, Version 2**: off without a sidecar. With `index.motion.json` (`keepsMoving` within `#root`), it runs 101 samples and passes. A deliberately frozen copy (`hf-seek` pinned to t=0) fails with `motion_frozen`. **So liveness works on a canvas.** `appearsBy`, `before` and `staysInFrame` can only target DOM boxes, so they can't see objects drawn inside the canvas.
- **Version 1** is clean: motion 101 samples, contrast 0 elements (the type is part of the Screen image).

## WebGL determinism and Seam thresholds (ADR-0011)

- **Frame 0 twice**: `snapshot --at 0` run twice, plus the render's frame 1, gives byte-identical PNGs (same MD5), for **both versions**.
- **Whole render twice (Version 2, 1600)**: 299 of 300 frames are byte-identical. In the remaining frame (196), one pixel differs by 1 LSB (PSNR 115.7 dB).
- **Noise floor on this machine is zero**, so the pixel Seam check can be near-exact: for example, fail if any pixel differs by more than 2 LSB, or PSNR is below 60 dB. Not tested: another GPU, SwiftShader, or a Chrome update. Different machines will differ, so compare t=D against t=0 rendered in the same run.
- Grain seeded by `round(t·60) mod 300` gives t=D the same grain as t=0, as ADR-0011 requires.

## Resolution: 1600×1200 against 1920×1440

Sheets: `sheets/res-card800css-*.png`, `sheets/res-card960css-*.png`.

- **Card at 800 CSS px on a 2x display** (1600 device px): 1920 downscaled and 1600 native are indistinguishable.
- **Card at 960 CSS px** (1920 device px): 1920 native is marginally crisper on the small captions (`180° · 3D · 8K`). You only see it side by side.
- **Cost of 1920**: +38% render time, +37% master size.

## Bitrate, grain and banding against the cap

Encode: x264 two-pass, preset slow, High, yuv420p, faststart, no audio, maxrate = bitrate. Measured at frame 290 (settled, mid-GOP).

| Master | Size per 5s (4 / 5 Mbps) | Grain kept in void (HF std, master → 4M / 5M) | Void plateau fraction, 4M / 5M (banding; lower is better) | Banding at ×6 contrast |
| --- | --- | --- | --- | --- |
| dither only (grain 0) | 2.38 / 2.93 MB | 0.45 → 0.19 / 0.22 | 0.80 / 0.74 | clear bands |
| grain 0.015 | 2.39 / 2.92 MB | 0.69 → 0.32 / 0.34 | 0.55 / 0.49 | faint bands |
| grain 0.03 | 2.34 / 2.86 MB | 1.07 → 0.53 / 0.56 | 0.28 / 0.23 | none |

- **Dither alone doesn't survive H.264 at 4–5 Mbps; visible grain does.** That's the opposite of ADR-0010's fallback ("if visible grain doesn't hold, dither only"). Grain 0.03 is the lowest tested level that kept the void free of bands.
- **At normal contrast**, banding is barely perceptible even dither-only on this very dark Backlight (`sheets/void-normal-contrast-*.png`). A brighter Backlight would show it more.
- **The cap**: about 2.9 MB per 5s at 5 Mbps, so 6 MB holds about a 10s Loop at 5 Mbps, or 12s at 4 Mbps.
- **4 against 5 Mbps**: on in-focus type the difference is invisible at 2x zoom. Type PSNR is 38–41 dB when settled. Mid-move, grain costs some type fidelity: 32.8 dB at grain 0.03 against 35.9 dB without grain, at frame 200.

## Version notes

- **Version 2** depth of field takes depth analytically from the one Screen plane. Several Surfaces, or a phone body, need a real depth buffer: a standard change, but not built here.
- **Version 1** ramp is a straight screen-space band around one focus line. It can't give two Surfaces at different depths different blur, and it doesn't soften a Surface's edges against the void. It has no bloom, its soft-light grain is weak in the darks, and its Backlight was too faint to see (untuned).
- **What Version 1 does better**: renders 2× faster, `check` sees its DOM, and its in-focus type is as sharp as Version 2's default.

## Not done in the timebox

- Version 1 Studio playback.
- Version 1 at 1920.
- Version 1 bitrate sweep. The grade is the same idea, so the sweep result should carry over; unverified.
- Software-WebGL render.
- A 10s Loop at the cap.
- A Pro control comparison, which waits for 01.
