# Handoff: Loops direction settled (Rounds 7–9); next is the Ultramock control and the look test

Date: 2026-10-09. Repo: `C:\Users\nfbco\Documents\GITHUB\Product-Film-Studio`, branch `poc/hyperframes-pipeline`, HEAD `3e443ba` (nothing pushed). Supersedes `.scratch/handoffs/2026-10-08-round-7-handoff.md` wherever they differ; that one is now stale on most decisions.

## Read first (source of truth, not repeated here)

- `AGENTS.md`: working principles. grill-with-docs, to-spec, to-tickets, implement and handoff run only when the user types them, so recommend them. Rendered frames are the validation for anything visual.
- `GLOSSARY.md`: Loop, Loop shape, Bookend, Tour, Seam, Freeze, Backdrop, Project sheet, Focus area (built-in `whole`), Focus path (`→` move, `/` cut). Use these terms strictly.
- `docs/adr/0010-loops-are-the-default-output.md`: the direction, v1 Loop scope (Screens only; Device frames none and a simple phone body; tall Screen for Scroll, tiled under Three.js), frame-0 rule, delivery (H.264, 6 MB provisional cap, dither-only fallback), the Steel Hat bar, and the Supersedes list.
- `docs/adr/0011-bookend-seam-is-checked-on-scene-state.md`: the seam check design.
- Pointer notes on ADR-0002 (under review, decided after the Steel Hat remake), 0005, 0007, 0009.
- `docs/brief-template/project.md` (Project sheet with Loop cards, shapes, Shot template inference, review rules) and `film-brief.md` (full Film). `film-brief-long.md` is superseded.
- `docs/spikes/q1-renderer-spike.md`, `.scratch/q1-renderer-spike/`: ADR-0007 spike.

## State

Grilling is done: the user confirmed shared understanding after Round 9. The frontier is empty until the look test. **Waiting on the user** to export the Ultramock control.

## Plan (agreed order)

1. **Ultramock control** (user): Pro, 60fps, highest resolution. Same VR website Screen, same two focus areas, same focus shift; tilt, Backdrop and duration as close as Ultramock allows. If no 4:3 export: 16:9 at 4K, centre-crop to 4:3, note the crop. Build the HyperFrames versions' framing and timing to match the control, not the other way round.
2. **Look test** (`.scratch/`, prototype skill, timebox one working session). One VR Screen on a bare tilted plane, dark void with Backlight, one focus shift between two areas, 4:3, 60fps, 5s. No devices, no Recordings.
   - Version 1: CSS screen-space ramp (stacked `backdrop-filter` layers with gradient masks).
   - Version 2: Three.js, image texture (mipmaps, anisotropic filtering), real DOF, bloom, grain.
   - Measure: frames against the control; render time; Studio playback; what `check` and the motion audit do with a canvas (ADR-0007 caveat); WebGL determinism.
   - Render Version 2 natively at **1600×1200 and 1920×1440** (not downscaled). Pick 1920×1440 only if in-focus type is visibly sharper at card size on a 2x display.
   - Render frame 0 twice per version, as PNG before encoding, to measure noise: that sets the Seam thresholds (ADR-0011).
   - Test bitrate, grain and banding together against the 6 MB cap (4–5 Mbps at 10–12s). If visible grain doesn't hold, use dither only; don't raise the cap.
   - Compare all versions and the control against `references/own/steel-hat-phone.mp4` at the same display height (square against 4:3), sharpness judged on paused frames (30fps against 60fps).
3. **Build or buy** decided from the control and the look test. Build only if the Three.js version gets close to the control and the user wants Films, UI animating as UI, or one system per Project. If buy: make the Steel Hat Loop in Ultramock as a second control and skip step 4's HyperFrames version.
4. **If build: Steel Hat remake.** Tour, Scroll Shot on a tall Screen (capture the user's client site for private comparison; pinned header captured separately; tile above the 16k texture limit), simple phone body at a fixed tilt, brand-colour Backdrop, no DOF, scroll lands on a named focus area. Check composition on the first render: a portrait phone in 4:3 leaves a lot of empty Backdrop.
5. **ADR-0002 rewrite** (phone body and look test are the inputs).
6. VR Bookend → 3–5 VR Loops with batch review → full-Film layer.

## Open, by what unblocks it

- **After the look test:** final resolution, Seam thresholds, final file-size cap and grain policy, build or buy.
- **After build or buy:** where Focus areas are stored and how they're written (Claude proposes from the image, or DOM boxes from a Capture; user approves), revised v1 Primitive list (focus-area framing Primitive; `camera.orbit` if Three.js).
- **After the Steel Hat remake:** ADR-0002; browser and laptop frames for full Films; Orbit.
- **After an X test upload:** X derivative size (X's docs say 1280×1024 max; third parties say 1920×1200).
- **Unchecked facts:**
  - Do the portfolio cards (Framer) lazy-load? Needs the portfolio URL from the user.
  - Does a Studio extend update a sub-composition's `root.dataset.duration`? HyperFrames catalog components (e.g. `focus-swap`) read it; needed for a Bookend's last Shot to stretch (ADR-0011).
  - Multi-Shot Loops under Three.js (one canvas or WebGL context per Shot sub-composition?) are untested; the first Bookend covers it.

## References

- `references/` is git-ignored. Ultramock showcase: `references/ultramock/{tldr-dashboard,evil-charts,vercel}.mp4` (910×512 previews, multi-Shot, none loops seamlessly; TLDR opens on a dark corner and ends on a lit wide, so it isn't a Bookend).
- The user's own bars: `references/own/steel-hat-phone.mp4` (1080×1080, 30fps, 14.9s, one-Shot Tour, phone turning about 25° to upright while the page scrolls, flat red brand colour, corner logo, no DOF, silent AAC track) is the bar for Loops; `references/own/steel-hat-laptop.mp4` (23s full Film) is the bar for full Films.
- Pulled frames and contact sheets: `.scratch/scope-review/ref-frames/` (local only, git-ignored).
- Portfolio is on Framer, which serves uploaded video byte for byte (no re-encode) and has a poster setting (not used: frame 0 must be a lit, settled framing anyway).

## Environment notes

- FFmpeg and ffprobe aren't on Git Bash's PATH: prefix `export PATH="$PATH:$LOCALAPPDATA/Microsoft/WinGet/Links";`. `drawtext` segfaults (no fontconfig), so make unlabelled contact sheets. Use `-fps_mode`, not `-vsync`.
- HyperFrames 0.8.141 is pinned and uses its own headless Chrome. Plugin docs: `~/.claude/plugins/cache/hyperframes/hyperframes/0.8.141/` (`skills/hyperframes-animation/adapters/three.md`, `adapters/html-in-canvas-patterns.md`, `rules/depth-of-field-blur.md`, `docs/catalog/blocks/canopy-part-title.mdx` for `BokehPass`). Don't run `hyperframes init` in this repo.
- Commit only when the user asks.

## Suggested skills

- **prototype**: the look test (step 2), in `.scratch/`.
- **hyperframes:hyperframes**, then **hyperframes:hyperframes-animation** (Three.js adapter, HTML-in-Canvas, DOF), **hyperframes:hyperframes-core**, **hyperframes:hyperframes-cli** (`snapshot --at`, `render`, `check`): building and measuring the look test.
- **hyperframes:hyperframes-keyframes**: if the camera path through focus areas needs seek-safe 3D keyframes.
- **domain-modeling**: when look-test results settle resolution, thresholds and the cap (update ADR-0010, ADR-0011, ADR-0002 later).
- Recommend, don't invoke: **grill-with-docs** for the post-look-test round (build or buy), then **to-spec**, **to-tickets**, **implement**; **handoff** before ending mid-task.
