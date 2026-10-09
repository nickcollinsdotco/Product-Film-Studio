# Look test: CSS fake against Three.js against the control

Type: prototype
Status: open
Blocked by: 01

Timebox one working session, in `.scratch/look-test/`, using the prototype skill. Match framing and timing to 01, not the other way round.

Setup: the 01 Screen on a bare tilted plane, dark void with Backlight, one focus shift between the same two areas, 4:3, 60fps, 5s. No devices, no Recordings.

- Version 1: CSS screen-space ramp (stacked `backdrop-filter` layers with gradient masks).
- Version 2: Three.js, image texture with mipmaps and anisotropic filtering, real DOF, bloom, grain.

Measure:
- frames against the control, and against `references/own/steel-hat-phone.mp4` at the same display height, sharpness judged on paused frames;
- render time; Studio playback; what `check` and its motion audit do with a canvas (ADR-0007 caveat); WebGL determinism;
- Version 2 rendered natively at 1600×1200 and 1920×1440, compared at card size on a 2x display (1920×1440 only if in-focus type is visibly sharper);
- frame 0 rendered twice per version as PNG before encoding, to set the Seam thresholds (ADR-0011);
- bitrate, grain and banding together against the 6 MB cap at 4–5 Mbps; if visible grain doesn't hold, dither only.

Done when: a findings note with contact sheets and numbers for each bullet is linked here under `## Answer`.
