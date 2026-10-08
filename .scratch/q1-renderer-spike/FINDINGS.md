# Q1 renderer spike: findings log

Spike for ADR-0007 (how Primitives drive the Renderer). Scenario: push-in plus rack focus between two Surfaces, 5s, 1920×1080.

The spike agent stopped twice: the session ended, then it hit the API session limit, at about 21:3x on 2026-10-08. It never wrote this file. The main session salvaged the entries below from the evidence the agent left on disk. **Observed** means read directly from an evidence file or frame. **Inferred** means reasoned from code, not checked.

## Variants

| Variant | How it's built |
| --- | --- |
| `a-state/` | Primitives tween a plain `scene` object. The timeline's `onUpdate` runs `renderCss3d()`, which writes transform and blur to the DOM. |
| `b-native/` | Primitive helpers with object arguments (`camera.pushIn(tl, {to, at, duration})`) live in an external `primitives.js` and emit tweens on DOM elements. |
| `b2-inline/` | The same tweens written inline in the composition script, with no helpers. |
| `b3-helpers/` | Helpers defined inline in the composition script, with positional arguments and a literal selector (`cameraPushIn(tl, 350, 0.5, 3)`). |
| `c-hybrid/` | The camera is a native element tween. Only focus distance is scene state; `onUpdate` derives depth-of-field blur from it. |
| `edit/` | A host Edit that mounts all five as sub-composition clips, for the Shot-level retime test in Studio. |

## Entries

### Lint, all variants (observed)
Evidence: `evidence/lint-*.txt`. Every variant has 0 errors and 1 warning: `nested_structure_needs_subcomposition`, because the camera rig contains the Surfaces. Expected: the warning goes away once a Shot is a sub-composition, which is the plan anyway. **No difference between variants.**

### `check`, all variants (observed)
Evidence: `evidence/check-*.json`. The runtime audit is clean. The motion audit ran (`enabled: true`, 101 samples in c-hybrid). `ok: false` in every variant comes from **layout** (`content_overlap`) and **contrast** (29 `contrast_aa_failure` in c-hybrid) on the fake dashboard text. Contrast failures on deliberately blurred, receding Surfaces are probably false positives that depth of field will always trigger. Inferred: this needs a policy (ignore contrast on out-of-focus Surfaces, or a way to suppress it per Surface). `check-edit.json` has 0 warnings and the same layout/contrast pattern. **No difference between variants.**

### Static `keyframes` analysis (observed): THE KEY DIFFERENTIATOR
Evidence: `evidence/keyframes-*.json`.

| Variant | Tweens HyperFrames can see |
| --- | --- |
| a-state | 2, both `__unresolved__` targets (the plain state object), no timing |
| b-native | **0**: helpers in an external file are invisible |
| b2-inline | 3: `#camera` 0.5–3.5, `#surface-a` 1.5–3.0, `#surface-b` 1.5–3.0 |
| b3-helpers | 3: identical to b2-inline, so inline helpers with positional args **are** parsed |
| c-hybrid | 2: `#camera` 0.5–3.5, plus the focus tween as an unnamed "hold" 1.5–3.0 |

Inferred: HyperFrames' tooling (and probably Studio's keyframe editor, which needs to find the tweens in source) sees tweens only when their call sites are statically resolvable in the composition file. Plain-object targets and helpers in external files are opaque. This matters for keyframe-level retiming, which is only nice to have, more than for Shot-level retiming, which is required.

### Draft renders and contact sheets (observed)
Evidence: `out/<variant>.mp4`, `out/sheet-<variant>.png`, `out/sheet-all.png` (frames at 0.5, 1.5, 2.25, 3.0, 4.5s). **Visual parity across all five variants.** The push-in is visible. Surface A racks from sharp to blurred between 1.5 and 3.0s. Surface B sits mostly outside the frame on the right, so its blurred-to-sharp turn is only partly visible. That's a scenario framing weakness, not a variant difference.

### Studio, Shot-level retime test (NOT COMPLETED)
Evidence: `edit/` host project, `out/edit-baseline.mp4`, `out/sheet-edit-baseline.png`. Last observation before the agent stopped: in Studio, clip buttons for the mounted Shots are labelled like "Shot A State, 0.0 to 5.0 seconds" (35 px/s). The agent was looking for trim handles. **Not yet verified:** moving or trimming a Shot clip, whether motion renders correctly after a retime, and keyframe editability per variant in Studio. The `edit/` preview server was left running.

### 2026-10-08 21:45 · Correction + additions from the spike agent (observed)
- **Correction, rack focus framing:** the "Surface B mostly outside the frame" observation is from the first layout. The agent then moved Surface B (`left:1100px; top:80px`, CSS only, same in every variant) and re-ran lint/check/render/sheets. All current `out/*.mp4`, `out/sheet-*.png` and `evidence/check-*.json` are from the new layout. Full-res `out/frames/a-state-0.5-vs-4.5.png` shows t=0.5 A sharp / B blurred and t=4.5 pushed in, A blurred, **B sharp and readable** ("Proposal · $48k" rows legible). The B turn is verified.
- **Pixel parity:** md5 b2-inline == b3-helpers (byte-identical MP4). PSNR vs b2-inline: b-native 62.5 dB, a-state 50.5 dB, c-hybrid 50.9 dB (all invisible differences). Script: `tools/sheets.sh`.
- **Motion audit discriminates:** `x-frozen/` = a-state without `onUpdate`; `evidence/check-x-frozen.json` reports `motion_frozen` on `#camera`. All 5 real variants: motion audit 101 samples, 0 findings (sidecar `index.motion.json`).
- **keyframes diagnostics beyond --json:** `--shot` onion works only for statically resolved targets (a-state, b-native: "no statically resolved animated element"); `--ghost` is canvas-only. So a-state/b-native get no `keyframes` coverage at all; check's motion audit and snapshots still cover them.
- **Source reading (inferred until Studio confirms):** Studio parses only the first inline script containing `gsap.timeline` (`findTimelineScript` in `node_modules/hyperframes/dist/chunk-374QQGBQ.js`). It inlines helpers only when they are top-level `function f(...)` / `const f = (...) => {}` with identifier params or literal defaults (no destructuring), called as bare statements, whose body calls the timeline by the same identifier. Namespaced member calls like `camera.pushIn()` are never inlined. Inlined tweens get provenance `helper` -> "Generated by f() — not directly editable" + "Unroll to edit" (`ComputedTweenNotice.tsx`, `gsapEditOutcome.ts`). Clip move/trim capability (`timelineEditCapabilities.ts`) depends only on the clip having an id and finite duration; composition clips always qualify. No Studio UI writes `data-variable-values`.

### 2026-10-08 21:40 · edit/ host baseline (observed)
- Evidence: `edit/index.html`, `edit/compositions/<v>.html` (generated by `tools/build.mjs edit`), `edit/lib/primitives.js`, `evidence/check-edit.json`, `out/edit-baseline.mp4`, `out/sheet-edit-baseline.png` (`tools/edit-sheet.sh`), pristine copy `out/edit-pristine/`.
- Setup: Shots at 0/5/10/15/20/25 s, 5 s each, track 0: shot-1 a-state, shot-2 b-native, shot-3 b3-helpers, shot-4 b2-inline, shot-5 c-hybrid, shot-6 b2-inline again (same template twice, identical inner ids). b-native's Library loaded once in the host head. One literal host Transition tween: fade shot-2 opacity 0->1 at 5 s.
- Result: lint 0/0. Render OK (30 s). Sheet inspected: every Shot shows push-in + rack focus at local 0.5/2.25/4.5, including onUpdate-driven a/c and the reused template. Inner id collisions across Shots did not break anything.

### 2026-10-08 21:45 · Studio first look at edit/ (observed, screenshot)
- Evidence: Studio at http://localhost:3110/#project/edit, screenshot `C:\Users\nfbco\.t3\userdata\browser-artifacts\browser-screenshot-localhost-muzxqyo5-248c0621.png`.
- Result: Timeline shows Track 1 with 6 clips named "Shot A State", "Shot B Native", "Shot B3 Helpers", "Shot B2 Inline", "Shot C Hybrid", "Shot B2 Inline"; a "Visual" lane under the track shows **2 keyframe diamonds at ~5 s** (the host Transition tween). Compositions panel lists each template file. Clip DOM: `button[data-el-id="index.html#shot-N"]` with `data-clip-start/end`.

## Open
- [ ] Studio: Shot-level move and trim of each variant's clip in `edit/`, then re-render and compare to `edit-baseline`.
- [ ] Studio: keyframe diamonds, "Unroll to edit" or "Computed value", per variant.
- [ ] Rerun the rack focus with both Surfaces fully in frame.
- [ ] Policy for contrast and layout findings on out-of-focus Surfaces.

### 2026-10-08 22:05 · Studio Shot-level edit 1: trim end of shot-1 (a-state) 5 s -> 4 s (observed)
- Method: Studio UI in the t3 browser tab; selected the clip with a real click, then dragged the right trim handle (col-resize, 14 px) 35 px left with synthetic PointerEvents dispatched in the page (the preview tool has no native drag). Studio's live trim preview tracked (`data-clip-end=4` mid-drag).
- Source change (diff vs `out/edit-pristine/index.html`): shot-1 `data-duration="5"` -> `data-duration="4"` and Studio added `data-playback-start="0"`. Nothing in `compositions/a-state.html` changed except hf-id stamping (below).
- After a full page reload the timeline shows "Shot A State, 0.0 to 4.0 seconds".
- Caveat: a second drag attempt before reloading showed a toast "Unable to patch timeline element shot-1 in index.html" and left the UI showing 0–5 until reload. Treat as a stale-UI artefact of rapid scripted edits; the file was correct.
- Side effect (observed): on first open Studio stamped `data-hf-id="hf-xxxx"` onto every element in `index.html` and all 5 template files, and normalised `data-layout-allow-overlap` to `data-layout-allow-overlap=""`. It also created `edit/.hyperframes/` (backup, preview cache, hf-ids-stamped.json) and `edit/.thumbnails/`. A generator that rewrites these files would fight Studio (consistent with ADR 0003 rejecting a generator).
- Compiler note (observed in served preview HTML): every Shot host gets `data-hf-scene-no-swap="a script outside the scene selects #camera"`, i.e. reusing the same inner ids (`#camera`) across Shot templates disables a HyperFrames scene optimisation. Rendering is still correct (baseline sheet). Inferred: Shot templates should prefix inner ids or use classes.

### 2026-10-08 22:20 · Studio Shot-level edits 2–9 on every variant's clip (observed)
- Method as edit 1 (real click to select, synthetic pointer drag on clip body or 14 px trim handle, page reload between edits; disk checked after each). Evidence: `evidence/edit-index-studio.diff`, `evidence/edit-index-after-studio.html`.
- Edits and resulting source (all written by Studio into `edit/index.html` only):
  | Clip | Variant | Studio action | Result on disk |
  | --- | --- | --- | --- |
  | shot-1 | a-state | trim end −1 s, then move +1 s | `data-start="1" data-duration="4" data-playback-start="0"` |
  | shot-2 | b-native | trim end −1 s, then move +1 s | `data-start="6" data-duration="4" data-playback-start="0"` |
  | shot-3 | b3-helpers | trim end −1 s, then move +1 s | `data-start="11" data-duration="4" data-playback-start="0"` |
  | shot-4 | b2-inline | trim **start** +1 s | `data-start="16" data-duration="4" data-playback-start="1"` |
  | shot-5 | c-hybrid | trim end −1 s, then move +1 s | `data-start="21" data-duration="4" data-playback-start="0"` |
  | shot-6 | b2-inline (2nd use) | extend end +2 s past root end | `data-duration="7"`; Studio also grew root `data-duration` 30 -> 32 |
- Every move/trim/extend was accepted for every variant; Studio never opened or changed the Shot template files for these (template diffs = hf-id stamping only). Shot-level timing lives entirely on the host clip, so it is independent of how the Shot's internals are authored (as source reading predicted).
- **Edit-owned Transition tween was rewritten too:** `tl.fromTo("#shot-2", {opacity:0}, {opacity:1, duration: 0.5, ...}, 5)` became `duration: 0.4 ..., 6`, i.e. Studio moved it with the clip and scaled its duration by the trim ratio (4/5). So literal host-level tweens on a Shot host follow Shot retimes; tweens inside the Shot template are not touched.
- UI caveat: after some edits the clip labels were stale until reload (e.g. left trim showed "16.0 to 21.0" while the file had 16 + 4 s). Disk is the source of truth.

### 2026-10-08 22:35 · Render after Studio retimes + comparison (observed)
- Evidence: `out/edit-retimed.mp4` (lint 0/0, 32 s), `out/sheet-edit-retimed.png` (inspected; column labels "local" there are clip-relative), `evidence/retime-compare.txt`, `tools/retime-compare.sh`, frames in `out/frames/cmp/`.
- Method: for each Shot, frames at clip-relative 0.5/1.75/3.0/3.9 s compared (PSNR) with the baseline render at the Shot-local time predicted by "internal timeline offset by `data-playback-start`, cut at the new end" vs a control "internal timeline scaled to the new duration".
- Result, all 5 variants identical in behaviour:
  - cut/offset model matches: 44–49 dB at every sample, every Shot (a-state, b-native, b3-helpers, b2-inline, c-hybrid, b2 reuse).
  - scaled model fails mid-motion: ~13 dB at clip-time 1.75. **The Shot's internal timeline never scales with `data-duration`.** Trim end = cut; trim start = `data-playback-start` offset (shot-4 starts 1 s into its motion); move = shift.
  - Gaps left by the moves (t=0.5, 5.5, 10.5, 15.5) are empty host background (YAVG 22).
  - **Extend past the template's inner timing blanks the Shot:** shot-6 at 5.5/6.5 s shows the Shot root background + tag but no camera rig/Surfaces (5.9 dB), because the template's inner `#camera`/Surfaces carry their own `class="clip" data-start="0" data-duration="5"`.
- Hold control (`edit-hold/`, `out/edit-hold.mp4`, `out/frames/cmp/hold-0.5-vs-6.5.png`): the same b2-inline template with the inner clip attributes removed, mounted in a 7 s host clip. Frames at 5.5 and 6.5 are pixel-identical to 3.9 (PSNR inf): **the Shot holds its final pose**. Rule for Shot templates: no clip timing on inner elements; the host clip owns visibility.
- Not done: a Studio "extend" on the untimed template (the hold test edited the host by hand, not in Studio). Inferred to behave the same, since Studio only writes host attributes.

### 2026-10-08 22:55 · Studio keyframe-level editability per variant (observed, nice-to-have criterion)
- Method: in `edit/` Studio, Compositions panel -> "Open composition <v>" (breadcrumb Master > <v>), select the Camera clip / Surface clip, read the Design panel's "Motion" section and the timeline rows. Screenshots: `C:\Users\nfbco\.t3\userdata\browser-artifacts\browser-screenshot-localhost-muzyzlb0-d7391051.png` (b2-inline), `...-muzz1qnf-7da59fd3.png` (b3-helpers).
  | Variant | Timeline (Camera row) | Camera Motion panel | Surface (blur) |
  | --- | --- | --- | --- |
  | b2-inline | "Other" lane, 2 diamonds (0.5 s, 3.5 s) + ease control | editable: "0.5s – 3.5s, power2.inOut", Length/Starts at/ease/From/To fields, no notice | Surface A Motion panel shows editable `filter` tween 1.5–3 s blur(0px)->blur(10px); **no keyframe lane on the timeline row for `filter`** |
  | b3-helpers | same lane + 2 diamonds | **"Generated by cameraPushIn() — not directly editable." + "Unroll to edit"** | not checked (inferred: same notice via surfaceFocus()) |
  | c-hybrid | same lane + 2 diamonds | **"Generated by cameraPushIn() — not directly editable." + "Unroll to edit"** | Surface A: "No animations on this element yet — add an effect below to animate it." (blur is per-frame onUpdate) |
  | b-native | no lanes on any row | "No animations on this element yet — add an effect below to animate it." | same |
  | a-state | no lanes on any row | "No animations on this element yet — add an effect below to animate it." | same |
- Retime in Studio, b2-inline: typed Camera "Starts at" 0.5 -> 1 (real keystrokes + Enter). Studio rewrote exactly one source line in `compositions/b2-inline.html`: `tl.fromTo("#camera", ..., 0.5)` -> `..., 1)` (`evidence/studio-keyframe-retime-b2-inline.diff`). Undone with Ctrl+Z (verified on disk). A synthetic `input` event without keystrokes did not commit.
- Unroll in Studio, b3-helpers: pressing "Unroll to edit" deleted the `function cameraPushIn(...)` definition and replaced the call `cameraPushIn(tl, 350, 0.5, 3)` with `tl.fromTo("#camera", { z: 0 }, { z: 350, duration: 3, ease: "power2.inOut" }, 0.5)` (`evidence/studio-unroll-b3-helpers.diff`). The semantic Primitive call is gone after unroll (confirms the user's concern). Undone with Ctrl+Z (verified on disk).
- Risk observed: for a-state and b-native Studio offers "+ Add effect" on #camera, which would add a second tween fighting the Primitive's motion (not tried).

### 2026-10-08 23:00 · a-state renders in the Studio player + cleanup (observed)
- Started `preview a-state` on :3111, opened `#project/a-state?t=4.5`. Inside Studio's preview iframe: `#camera` `translate3d(0px, 0px, 350px)`, `#surface-a` `blur(10px)`, `#surface-b` `blur(0px)`, `__timelines.main.time()` = 4.5. So the onUpdate renderer runs under Studio's own seeks (not only check/render). Screenshot `C:\Users\nfbco\.t3\userdata\browser-artifacts\browser-screenshot-localhost-muzz7agi-b0ccf2d8.png`.
- All preview servers stopped (`edit` :3110, `a-state` :3111); no hyperframes preview node processes remain; ports refuse connections. Temp source-map extraction deleted.
- Repo state: only `.scratch/q1-renderer-spike/` touched. Studio stamped `data-hf-id` into `edit/` files and `a-state/index.html` and created `edit/.hyperframes/`, `edit/.thumbnails/` (all inside the spike dir). `edit/index.html` keeps the Studio-retimed state; pristine copy in `out/edit-pristine/`.

### 2026-10-08 23:05 · REPORT.md not written by the spike agent
- The agent harness refuses new report `.md` files from subagents ("Subagents should return findings as text"). The full REPORT.md text was returned in the agent's final message for the main session to save. Open items in the list above are now done except the contrast/layout policy.
