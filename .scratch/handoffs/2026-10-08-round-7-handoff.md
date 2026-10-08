# Handoff: scope change to Loops, Round 7 decided

> **Superseded** by `2026-10-09-round-9-handoff.md`, and by ADR-0010, ADR-0011 and the glossary, which now record Rounds 7–9. Where they differ, the later ones win.

Date: 2026-10-08. Branch: `poc/hyperframes-pipeline`. Repo: `C:\Users\nfbco\Documents\GITHUB\Product-Film-Studio`. Follows `.scratch/handoffs/2026-10-08-scope-review-handoff.md` (read that first; this doc only covers what happened since).

**No docs have been updated for the new direction.** GLOSSARY.md, the ADRs and `docs/brief-template/` still describe the old Film-first plan. The user had said "don't update any docs until we've agreed the new direction". Round 7 below is now agreed, apart from Q1 (bake-off pending) and the open items in "Next round". Confirm with the user before writing docs, then follow the update list at the end.

## Read first

- `AGENTS.md`: working principles. grill-with-docs, to-spec, to-tickets, implement and handoff run only when the user types them, so recommend them rather than invoking them. For anything visual, rendered frames are the validation.
- `GLOSSARY.md`, `docs/adr/0001`–`0009`, `docs/spikes/q1-renderer-spike.md`: settled model before this session.
- `docs/brief-template/project.md`: the user's new Project sheet with clip cards, six patterns and a TLDR worked example. It still uses pre-Round-7 vocabulary (see Q6).
- `docs/brief-template/film-brief.md`: the **slim** brief that inherits from project.md (front matter says "must have a filled project.md"). `docs/brief-template/film-brief-template.md`: the **long**, older brief. Verified by reading both: the user's description had them the other way round.
- Reference clips: `references/ultramock/{tldr-dashboard,evil-charts,vercel}.mp4` (git-ignored). Frames and contact sheets pulled this session: `.scratch/scope-review/ref-frames/` (untracked).

## The user's proposal (summary)

The default output becomes a short **clip**, not a 15–20s film. Main references are three Ultramock showcase clips (ultramock.io/#showcase): TLDR dashboard, Evil Charts, Vercel. In the user's reading:
- they run 9–15s with no audio, titles or end card, and the product's own type does the talking;
- each films one high-res Screen from 2–4 angles ("focus areas", Ultramock's term), wide → close → close → back to wide, so it loops;
- the production value is all camera and image: a tilted plane in 3D, shallow depth of field (DOF), slow focus shifts, a device frame or none, and a dark void, brand-colour glow or pale studio backdrop;
- they follow six patterns: Hold, Reveal, Bookend, Drift, Scroll, Orbit (defined in `project.md`).

A Project would usually produce 3–5 clips, one per strong Screen or feature. The full film (15–20s, titles, key moments, end card, music, the agreed workflow) stays as the occasional bigger piece, ideally reusing clips as its Shots. Clips skip the Shot list and Contact sheet: the focus path does the Shot list's job, and review happens at the draft render, with several clips reviewed together.

## What the session found (facts, verified 2026-10-08)

**References** (ffprobe and ffmpeg scene detection):
- All three are 910×512 previews at 60fps, too low-res to judge fine sharpness.
  - TLDR: 9.0s.
  - Evil Charts: 15.0s.
  - Vercel: 15.13s.
- **They are multi-Shot edits, not single camera moves.**
  - TLDR: 3 Shots, with hard cuts at 3.0s and 6.0s. Screen wakes (UI fades on left to right) → extreme close drift on the leaderboard and "You have Pro access" card → screen wakes again and pulls back to a flat wide.
  - Vercel: 4 Shots, with cuts at 2.13s, 5.13s and 10.18s. Straight wide → close tilt on the hero → close with the page scrolling (small cursor visible) → wide with the monitor turned. The turn happens between Shots; there is no continuous orbit.
  - Evil Charts: no hard cuts. Slow drifts on a steeply tilted bare plane, joined by dissolves or fast moves (around 3s, and a dissolve around 11.3s). Bloom glow on the bars.
- **None loops seamlessly.** In all three, the last frame differs from the first and the loop restarts with a hard cut. Only TLDR ends on a wide.
- TLDR and Vercel use **photoreal 3D monitors** with a metal bevel, reflections and a stand. Evil Charts is a bare plane.

**Ultramock** (from ultramock.io, 2026-10-08):
- Runs in the browser on WebGL. Inputs: screenshots, recordings, browser tabs via an extension.
- You draw focus areas and it generates the camera motion.
- Real 3D devices; DOF with focus, falloff and bokeh; bloom, grain and sharpen.
- Free tier: 1280×720, up to 30fps, watermarked, 3 exports a day.
- Pro: up to 3840px edge (4K), 60fps, square and portrait, motion blur, transparent video, premium models and custom 3D scenes, and **MCP control (beta)**. The page lists Pro at both $10/mo and $20/mo.
- 4:3 export, length limits, licensing, batch and API are not stated.

**HyperFrames 0.8.141 docs** (plugin cache at `~/.claude/plugins/cache/hyperframes/hyperframes/0.8.141/`):
- `skills/hyperframes-animation/transitions/catalog.md:37`: tilt-shift is "don't use" because there's "no selective CSS blur".
- `skills/hyperframes-animation/rules/3d-camera-flight.md`: a `filter` on a `preserve-3d` element flattens it.
- `docs/guides/performance.mdx`: large `backdrop-filter` and `filter: blur()` layers are a performance cost.
- `skills/hyperframes-animation/adapters/three.md`: the Three.js adapter contract.
  - The page renders from `hf-seek` time, and root `data-duration` is required.
  - Assets must load before seeking.
  - No post-processing passes that depend on previous frames.
- `docs/catalog/blocks/canopy-part-title.mdx`: a shipped block using Three.js `BokehPass` for real DOF.
- `skills/hyperframes-animation/adapters/html-in-canvas-patterns.md`:
  - HTML-in-Canvas (`drawElementImage`) draws live DOM into a WebGL texture; one example is literally "product screenshot in a dark theater" with bloom.
  - It needs a Chrome flag: Studio preview shows a placeholder, and the renderer enables the flag automatically.
  - Plain image textures (Screens) don't need it.

**X video specs (conflicting)**:
- X's API best-practices page: uploads up to 1280×1024, at most 60fps, H.264 High; 1080p playback for subscribers.
- Third-party guides: 1920×1200 maximum.
- X re-encodes everything. Needs a test upload.

Sources:
- [docs.x.com best practices](https://docs.x.com/x-api/media/quickstart/best-practices)
- [Ayrshare X guide](https://www.ayrshare.com/docs/media-guidelines/x_twitter.md)
- [postfa.st X video specs](https://postfa.st/sizes/x/video)

**H.264 levels** (from the standard's level tables, not tested here):
- 1600×1200 at 60fps is 7,500 macroblocks per frame and 450k per second, which fits **Level 4.2**.
- 1920×1440 at 60fps is 10,800 per frame and 648k per second, which needs **Level 5.1**.

## My take as given to the user (condensed)

**1. Direction: mostly good.**
- It matches the real destination: portfolio cards autoplay muted, and the page supplies the words.
- First good output comes sooner.
- The Brief's "point" survives as the card's "Notice".
- The Film/Edit/Shot model fits Loops well, because the references are multi-Shot edits.

Risks:
- **Behaviour lost.** Still Screens show how a product looks, not what it does; Recordings and Cursor showed interaction design.
- **Distinctiveness.** The previous decision was "references are vocabulary and a quality bar, not templates", and this proposal templates Ultramock, a cheap, popular tool whose look will read as "made in Ultramock".
- **Legibility.** DOF on steep angles makes product type unreadable.

**Why not just use Ultramock?** For Loops alone, Ultramock already does the spec, including devices, and can be driven through MCP. Building our own loses on cost, and probably on quality for months, and device and lighting parity is the hardest and least differentiating part. Building only wins where Ultramock can't go:
1. Films: titles, several Surfaces, music, end card, match moves between Shots in one space. Ultramock output can only enter a Film as flat footage.
2. UI that animates as UI, driven from the DOM rather than a screen recording.
3. One system per Project, re-renderable from git.
4. Smaller gaps: 4:3, keeping NDA material local.

Otherwise: buy Ultramock and build only the Film layer.

**2. Scope moves rather than shrinks, into the hardest area.**
- Mostly gone: the type system, music sync, Landings, end card, Sign-off, Cursor, Shot list and Contact sheet authoring, per-ratio type layout.
- Added: real DOF, bloom, grain, Backdrops, a focus-area camera rig, 3x capture, devices if kept, loop seams, delivery encoding, batch review.
- That trades what Claude does best (story, type) for what it can only judge by rendering and iterating.

Where it gets hard:

| Tool | Hard parts |
|---|---|
| HyperFrames | No selective CSS blur. WebGL determinism. `check`, the motion audit and Studio keyframes can't see inside a canvas. Render time with DOF and bloom at 60fps is unknown. GPU versus software WebGL in headless Chrome is unverified (the POC log showed "drawelement capture · hardware gpu"). |
| GSAP | Easy: it tweens scene state. The rig maths is Library code. A one-Shot loop needs a camera path that ends where it starts. |
| FFmpeg | Banding in a dark void with glow and blur at 8-bit 4:2:0 needs grain or dither seeded from time. Exact frame count at the seam. No audio track. File size for a card. |

**Can CSS do DOF on a tilted plane?** No: CSS blurs a whole element at one radius in its local space. Two fakes:
- Bands: cut the plane into strips, each blurred differently. That costs one full blurred copy per strip, and the steps show.
- Screen-space ramp: stacked `backdrop-filter` layers with gradient masks. For a single plane this is close to physical, because blur ∝ |1/z − 1/z_focus| and 1/z is linear in screen space for a plane. It breaks with devices, several Surfaces or occlusion, gives a soft Gaussian rather than bokeh, gives no bloom, and is unverified in HyperFrames' capture.

Three.js gives real depth-based DOF, bloom and grain. Screens are bitmaps either way, so CSS's crisp-text advantage doesn't apply to Surfaces; use mipmaps and anisotropic filtering.

**ADR-0002:** probably flips to Three.js first for Surfaces, with HTML for type on top. Renderer-agnostic Primitives survive. Decide by the look test, not by argument.

Three.js weak spots:
- Recordings: rendering video frames deterministically inside WebGL is unverified.
- Tall Scroll screenshots exceed the GPU's 16k texture limit and need tiling.

**Orbit:** under Three.js, `camera.orbit` is just a camera path, so un-defer it. Photoreal device bodies stay hard. A device turning while it plays a recording is the hardest combination; build it last.

**3. Existing decisions:** the full table was given to the user; the outcome is in "Superseded and changed" below.
- **Clips as Film Shots:** nesting a whole Loop Edit inside a Film brings its seam and return-to-wide, leaves no room for type and has no Landings. Proposed instead: reuse the declarations (same Screen, focus areas and Shot template, laid out again with room for type), with focus arrivals acting as Landings. Never reuse rendered MP4s. Put to the user next round.

**4. Order of work:** the user's instinct (Hold and Bookend first, Film layer later) is right about the Film layer coming later. Pushback:
- Run the bake-off and look test before building Hold.
- A standalone one-Shot Hold Loop is in no reference and its seam is the hardest kind. Build Hold as a Shot template, and make the first shipped Loop a Bookend.

Proposed order:
1. Ultramock control.
2. Look test.
3. Camera rig, focus areas and the Hold template.
4. A Bookend Loop.
5. 3–5 real VR website Loops with batch review.
6. The Film layer when a real Film is wanted.

**ADR-0007 holds, and gets stronger.** Scene state plus one draw function makes Three.js a draw-function swap, which is the same shape as the HyperFrames Three.js adapter. Caveats:
- The spike never ran Three.js.
- Motion sidecars, `check` and the motion audit may not see motion inside a canvas; verify this in the look test.
- Rename "hold the last frame" to "freeze".

## Round 7: questions, recommendations and the user's decisions

**Q1. Build or buy for Loops?**
- Options: (a) build in-house; (b) use Ultramock for Loops and build only the Film layer; (c) bake-off first.
- Recommended (c). Build only if the HyperFrames Three.js test gets close to the control **and** the user wants one of: Films, UI that animates as UI, or one consistent system per Project. Otherwise (b).
- **Decided: (c).** The user assumes the control Loop is the same VR Screen and focus shift made in Ultramock, like for like.
- **Confirmed: yes.** Specifics for the next agent:
  - The control is the same VR website Screen, the same two focus areas and the same focus shift, with tilt, Backdrop and duration as close as Ultramock allows. Export from Ultramock Pro at 60fps and the highest resolution (the free tier is 720p, 30fps and watermarked).
  - **Build the control first, then match the HyperFrames versions' framing and timing to it.** Ultramock generates its own camera motion from focus areas, so it is the less controllable side.
  - If Ultramock can't export 4:3, export 16:9 at 4K and centre-crop to 4:3 for the frame comparison, and note the crop.
  - Optional, the user's call: a second control, a full Bookend in Ultramock, to judge whether it can make the Loop shapes at all. That matters to the build-or-buy decision but isn't like for like.

**Q2. Look test.**
- Setup: one real VR Screen on a bare tilted plane in a dark void with Backlight; one focus shift between two areas; 4:3, 60fps, 5s.
- Version 1: CSS's best fake (the screen-space ramp).
- Version 2: Three.js with an image texture, DOF, bloom and grain.
- Measures:
  - frames against the control;
  - render time;
  - Studio playback;
  - what `check` does with a canvas;
  - banding after the H.264 encode.
- No devices, no recordings. Lives in `.scratch/`, using the prototype skill.
- **Decided: yes, as described.** **Timebox: one working session.** Use the same Screen and focus shift as the control.
- Also render at both candidate resolutions (see Q8).

**Q3. Term.** "Clip" collides with HyperFrames' `clip` (`class="clip"`, host clips) and is on Shot's avoid list.
- **Decided: Loop, a kind of Film.** A Loop is short, silent and untitled, films one Screen, and plays on repeat. Edit, Shot and Draft render apply unchanged.
- A Film that isn't a Loop is a "full Film". No new term.

**Q4. What the patterns are.**
- **Decided:**
  - Hold, Reveal, Drift, Scroll and Orbit are **Shot templates** (the glossary already avoids "preset").
  - **Bookend** (ends on its opening framing) and **Tour** (never returns, like Evil Charts) are **Loop shapes**.
  - No glossary entry for "Pattern".

**Q5. Naming collisions.**
- **Decided, all three:**
  - The frozen last frame when you extend a Shot is renamed from "hold" to **freeze**. This is a wording change in ADR-0007, not a change of decision.
  - `type.reveal` becomes **`type.enter`**, pairing with `type.exit`.
  - `camera.drift` and `surface.scroll` keep their names. Rule: Primitives are always written in full as code, and a capitalised bare word means a Shot template.

**Q6. Brief vocabulary against the glossary.**
- **Decided, all of these:**
  - project.md §4 "Surfaces" becomes "Screens", and the card field becomes "Screen:".
  - Look table "Scene" becomes **Backdrop** (void | Backlight | studio light); "brand glow" is Backlight.
  - "House style: on/off" becomes "Sign-off: on/off", because "house style" is on the glossary's avoid list.
  - The clip card becomes the **Loop card**. "Focus path" stays as the field that acts as the Loop's Shot list.
- **File end state the user wants:** one brief template named `film-brief.md` (the slim one that inherits from project.md), and the long one renamed `film-brief-long.md` for reference.
  - Checked: the slim one is **already** `film-brief.md`. The only rename needed is `film-brief-template.md` → `film-brief-long.md`.
  - The only reference found is `project.md:10`, which already points to `film-brief.md`. The old handoff mentions both names; leave it alone, since it's history.
  - Not done yet.

**Q7. The seam and R6 Q2.**
- **Decided:**
  - A Loop closes with a **seam** Transition from its last Shot to its first: a cut by default, a dissolve allowed.
  - Every Shot may drift past its end (R6 Q2 accepted).
  - A one-Shot Loop uses a camera path that ends where it starts.
  - A seamless continuous take isn't a goal.
- **User's addition:** in a **Bookend**, the seam joins two framings that should be identical. The last Shot must end exactly on the first Shot's opening pose, including any drift. **Add an automated check comparing the last frame with the first at the seam.**
- Points to settle while designing that check:
  - **Avoid a duplicate frame.** The pose should be reached at t = duration, which is not rendered, so the last rendered frame is one frame of motion before the opening pose. Compare a snapshot at t = duration (`hyperframes snapshot --at`) with t = 0 and expect them to be near-identical, for example with FFmpeg `psnr`/`ssim`, threshold to be set in the look test. Also check that the last rendered frame is *not* identical to frame 0, which would cause a one-frame stall on loop.
  - **Check scene state as well as pixels.** Because of ADR-0007, the Library can assert sceneState(duration) == sceneState(0) exactly and cheaply, and the pixel check is the rendered evidence.
  - **Open:** does "opening pose" include Surface state (for example a Reveal's dark screen, as in TLDR) or only Camera and focus? And must velocity also match at the seam, so a drift doesn't stop and restart? See "Next round".

**Q8. Ratios.**
- **Decided: 4:3 master, and the only routine Edit for Loops.** 16:9 and 9:16 are on demand, since 4:3 works on X too. Full Films are unchanged (16:9 and 9:16).
- **Open: resolution.** The user's card displays at up to 950×719 CSS px (measured at full width on their 4K monitor), about 1900 device px wide on a 2x screen. They asked to weigh 1600×1200 against 1920×1440 for render time and file size. My weighing, **not yet put to the user**:
  - 1920×1440 matches a 2x card about 1:1. 1600×1200 is upscaled about 1.19×, which shows mainly on in-focus type, since most of the frame is blurred.
  - 1920×1440 is 1.44× the pixels: about 1.4× render time and about 1.3× file size at equal quality.
  - H.264 compatibility: 1600×1200 at 60fps is Level 4.2 (universal hardware decode); 1920×1440 at 60fps is Level 5.1 (fine on modern desktops and recent phones, less universal).
  - Close-ups are limited by the source. With 3x Screens, any close-up tighter than about half the Screen's width is upscaled from the source anyway, so extra master resolution only helps wides and mids.
  - X re-encodes and caps at 1280×1024 or 1920×1200 depending on the source, so X gets its own derivative (for example 1440×1080 or smaller). X shouldn't drive the master.
  - The card is 1.321:1, not exactly 4:3 (1.333). Fitting a 4:3 video crops about 0.9% of the width, so keep focus areas off the extreme edges.
  - **Recommendation:** in the look test, render the Three.js version natively at both sizes. Don't just downscale, because a downscaled render is sharper than a native render at the smaller size. Compare the two at card size on a 2x display. Default to 1920×1440 if in-focus type is visibly sharper; otherwise 1600×1200. Drafts stay at lower resolution and 30fps.

**Q9. Behaviour in Loops.**
- **Decided: (a).** v1 Loops use Screens only. Recordings and Cursor stay in the Film layer, so recordings inside Three.js are not in the look test.

**Q10. Loop review.**
- **Decided: yes.**
  - No Shot list or Contact sheet gates.
  - Batch draft-render all the Project's Loops.
  - Automatically grab stills at each focus arrival.
  - Review them at card size on one plain page.
  - The only gate is the Final render.

## Superseded and changed (mark as superseded in docs, don't delete)

From the previous handoff's "settled in conversation" list:
- **Film-first, building the Library on the first real Film:** superseded. The default output is Loops. Whether we build Loops ourselves depends on the Q1 bake-off. The VR website stays the first test case.
- **Volume of 1–4 films a month:** becomes about 3–5 Loops per Project plus an occasional full Film.
- **Output (16:9 and 9:16 first-class, 4:5 and 4:3 later):** superseded for Loops by Q8. Unchanged for full Films. 60fps stays. 30fps drafts stay.
- **"References are vocabulary, not templates":** under strain. The user is consciously templating Ultramock's structure. Not formally re-decided.
- **v1 Primitives:**
  - `type.reveal` becomes `type.enter`.
  - `cursor.*` and `type.*` move to the Film layer.
  - Proposed, not yet decided: a Primitive for framing a focus area; `camera.orbit` back in if we move to Three.js.
- **Cursor** (`cursor.json`, mouse-logger): deferred to the Film layer (Q9).
- **Process gates:** unchanged for full Films. Loops use the Q10 flow.
- **R6 Q2:** accepted for all Shots (Q7).
- **R6 Q1 (audits on Surfaces):** parked. Probably irrelevant if Surfaces render inside a canvas.

ADRs:
- **0002:** likely superseded by "Three.js first for Surfaces, HTML for type", **pending the look test**. Don't rewrite before then.
- **0005:** stands, and 4:3 is promoted for Loops. Edit it, or note it in a new ADR, after Q8's resolution is settled.
- **0006:** matters more now. A live-site capture could provide focus-area boxes.
- **0007:** wording "holds the last frame" becomes "freezes". The `*.motion.json` sidecar rule is unverified for canvas content.
- **0001, 0003, 0004, 0008, 0009:** stand. Loops are Film folders under `films/`.

## Next round (Round 8 frontier)

1. **Q7 follow-ups:** does a Bookend's opening pose include Surface state (a Reveal's dark screen) or only Camera and focus? Velocity continuity at the seam? Seam-check thresholds, and whether it runs as a Library test on scene state, a pixel check on renders, or both.
2. **Q8 resolution:** put the weighing above to the user, or let the look test decide.
3. **Focus areas:**
   - Glossary definition: a named region of a Screen the Camera can frame and focus on.
   - Where they live: probably Screen metadata in the ingest manifest, i.e. content, as in ADR-0003.
   - How they're written: Claude proposes them from the image, or they come from DOM boxes at capture; the user approves.
   - Depends on the Q1 outcome.
4. **Reusing Loops in full Films:** reuse the declarations, with focus arrivals as Landings, not nested Loop Edits or rendered MP4s. Depends on Q4, which is now settled, so it can be asked.
5. **Device frames in v1:** after the look test. Default stays a bare plane.
6. **Revised v1 Primitive list.**
7. **ADR-0002 rewrite:** after the look test.
8. **Delivery encoding:**
   - Portfolio: H.264, plus AV1/WebM?
   - Grain and dither policy against banding.
   - X derivative size, after a test upload.
9. **The Q1 decision itself:** after the control and the look test.

## Docs to update once the user confirms

Do these when the user gives the go-ahead. Use the domain-modeling skill's formats.
- **GLOSSARY.md:**
  - Retitle the intro, which still says "premium 15–20 second product films".
  - Add **Loop**, **Seam**, **Bookend**, **Tour**, **Backdrop**, and **Focus area** (pending its definition in Round 8).
  - List the Shot templates Hold, Reveal, Drift, Scroll and Orbit as examples under Shot template.
  - Add "freeze" for an extended Shot.
  - Update avoid lists: "clip" (HyperFrames meaning), "house style", "scene", "pattern", "preset".
  - Change the Landing example from "type reveal" to "type entrance".
- **`docs/brief-template/`:**
  - Rename `film-brief-template.md` to `film-brief-long.md`.
  - Apply the Q6 vocabulary to project.md and film-brief.md.
  - Clip card becomes Loop card, with Loop shapes and Shot templates as in Q4.
  - Default Edits: 4:3 only.
  - Add the Bookend seam rule.
- **ADRs:** ADR-0007 wording only for now. 0002 and 0005 wait (see above). Also consider an ADR for "Loops are the default output; full Films occasional", which is hard to reverse, surprising and a real trade-off.

## Environment notes (fresh account)

- **FFmpeg and ffprobe are not on the Git Bash PATH.** Prefix commands with `export PATH="$PATH:$LOCALAPPDATA/Microsoft/WinGet/Links";`. FFmpeg is 9.x.
- **The `drawtext` filter segfaults** (no fontconfig), so make contact sheets without labels. `-vsync` is not recognised; use `-fps_mode`.
- **Scene-cut detection:** `ffmpeg -i in.mp4 -vf "select='gt(scene,0.12)',metadata=print:file=-" -f null -`.
- **Other quirks** (winget path, system Chrome hangs, `hyperframes init` installs global skills) are in the old account's Claude memory under `windows-env-quirks`. In brief:
  - winget is at `%LOCALAPPDATA%\Microsoft\WindowsApps\winget.exe`.
  - HyperFrames uses its own pinned headless Chrome.
  - Don't run `hyperframes init` in this repo.
- **The HyperFrames Claude Code plugin is project-scoped** (`.claude/settings.json`), so a fresh account will be prompted to install it.

## Git state

- HEAD is `1ae09c1`.
- Untracked: `.scratch/q1-renderer-spike/`, `.scratch/scope-review/` and this file.
- Nothing is pushed. Commit only when the user asks.

## Suggested skills

- **grilling** and **domain-modeling**: continue Round 8, then write the agreed glossary, ADR and brief changes. The user starts these with `/grill-with-docs`, so recommend it rather than invoking it.
- **prototype**: for the Q2 look test (CSS versus Three.js, one session, `.scratch/`).
- **hyperframes:hyperframes**, then **hyperframes:hyperframes-animation** (`adapters/three.md`, `adapters/html-in-canvas-patterns.md`, `rules/depth-of-field-blur.md`), **hyperframes:hyperframes-core** and **hyperframes:hyperframes-cli** (`snapshot --at`, `render`, `check`): for building the look test and the seam check.
- **hyperframes:hyperframes-keyframes**: if camera paths through focus areas need seek-safe 3D keyframe patterns.
- Later, when the user types them: **to-spec**, then **to-tickets** and **implement**.
