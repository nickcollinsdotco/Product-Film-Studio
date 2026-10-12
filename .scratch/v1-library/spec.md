# Spec: the v1 Loop Library

Status: ready-for-agent

Decisions: [ADR-0012](../../docs/adr/0012-v1-is-light-css-loops.md) (v1 scope), ADR-0003, 0004, 0006, 0007, 0009, 0011 as amended there. Vocabulary: [GLOSSARY.md](../../GLOSSARY.md). Replaces the shelved ticket 11 in `.scratch/loops/`.

## Problem Statement

Nick wants short, silent portfolio Loops of real product Screens that are quick, cheap and simple to make, in the style of his own Steel Hat clips: a Screen in a browser or phone frame on a flat brand-colour Backdrop, tilting, scrolling and settling on what matters. Today the only working tool is Quick Loop, a one-off web app that renders one Screen into one continuous move. It can't put several Shots in a Loop, reuse Shot templates across Projects, hold Project-level settings such as the brand colour, export one Loop at several Frame sizes, or check that a Bookend's Seam is invisible. Each new Loop is a fresh, untracked job, and nothing carries over to full Films later.

## Solution

A small Library, built from Quick Loop's working CSS rather than rebuilt, plus two commands. Each Loop is one entry file in its Project, written by Claude from the Loop card. It places Scroll and Hold Shots on the timeline and previews in HyperFrames Studio at the Loop's primary Frame size. Project settings (brand colour, Backdrop, Device frame, primary Frame size) live once per Project. One export command renders any Loop at any Frame size preset (Landscape, Story, Square, Portrait, Classic) or a custom size, at an optional new length, as a half-size Draft or a full-size Final render, and writes the portfolio Rendition within 6 MB. Before a Bookend renders, the export runs the Seam check on scene state and writes an image of the end and start frames for checking by eye. The first production Loop, of the VR website, proves the whole path at 16:9 and 9:16.

## User Stories

1. As Nick, I want to describe a Loop in a Loop card (Screen and Focus path, the rest defaulted), so that making a Loop starts from a few lines, not a tool session.
2. As Nick, I want Claude to turn a Loop card into the Loop's entry file, so that I never hand-write composition HTML.
3. As Nick, I want each Loop to have one entry file as its single source, so that there's nothing to keep in sync across ratios.
4. As Nick, I want a Loop to hold several Shots in sequence, so that a Bookend can hold, move and come back.
5. As Nick, I want a Scroll Shot that moves down (or up) a tall Screen and lands on a named Focus area, optionally zooming in, so that I get the Steel Hat scroll look.
6. As Nick, I want a Hold Shot that stays on one Focus area with one slow move (push in, pull out or tilt settle), so that a Loop can open and close on a settled framing.
7. As Nick, I want a Shot to start exactly where the previous one ended unless I ask for a cut, so that a multi-Shot Loop reads as one continuous move.
8. As Nick, I want a Shot's template inferred from the Focus path (moves down the Screen to an area: Scroll; stays on one area: Hold), so that I rarely name templates.
9. As Nick, I want to be told when a Focus path asks for a sideways move between two areas without scrolling, so that I pick a path v1 can do instead of getting a wrong render.
10. As Nick, I want to set the brand colour, Backdrop, Device frame and primary Frame size once per Project, so that every Loop in it is consistent.
11. As Nick, I want a Loop card to override any Project setting, so that one Loop can differ when it needs to.
12. As Nick, I want a brand-colour Backdrop (flat fill), a void Backdrop (flat near-black) and a Backlight Backdrop (near-black with a soft glow in the brand colour), so that I can match the Steel Hat look or a dark look.
13. As Nick, I want the default Backdrop to be brand colour when the Product brand has a strong colour and Backlight otherwise, so that I rarely choose it.
14. As Nick, I want a browser Device frame (2D window chrome) and no frame (a rounded card), as Quick Loop draws them today, so that desktop sites look right immediately.
15. As Nick, I want a phone Device frame drawn from a bezel image and tilted no more than about 20°, so that mobile Screens can be shown like the Steel Hat phone clip without looking like cardboard.
16. As Nick, I want a bold tilt that eases to upright while the page scrolls, so that I can recreate the Steel Hat phone move.
17. As Nick, I want every Loop to open on a lit, settled framing, so that frame 0 works as the poster and the first thing seen on every repeat.
18. As Nick, I want Focus areas proposed by Claude from the Screen and shown to me as one labelled overlay image, so that I approve or correct them in one reply.
19. As Nick, I want Focus areas stored next to their Screen and shared by every Loop that uses it, so that I approve them once.
20. As Nick, I want to make a Screen from a live URL with Quick Loop's capture (full page, cookie banners hidden), so that sites I can run don't need manual screenshots.
21. As Nick, I want to preview a Loop in HyperFrames Studio at its primary Frame size, so that I can scrub and retime Shots.
22. As Nick, I want the primary Frame size set explicitly in the Loop's settings, not taken from list order, so that preview size never changes by accident.
23. As Nick, I want to extend or shorten a Shot in Studio and have its move stretch to fit, so that retiming never leaves a frozen tail.
24. As Nick, I want one export command that takes a Loop and a Frame size, so that every output comes from the same place.
25. As Nick, I want the presets Landscape (16:9), Story (9:16), Square (1:1), Portrait (4:5) and Classic (4:3), each with a 1600 px long edge, so that I pick a ratio by name.
26. As Nick, I want to export at custom dimensions when I ask, so that an odd placement still works.
27. As Nick, I want a clear error for custom dimensions H.264 can't encode (odd numbers), so that I don't get a broken file.
28. As Nick, I want to export at a different length and have every Shot scale proportionally, so that a 10s Loop can become an 8s one without re-editing.
29. As Nick, I want frame rate to default to 60fps and be overridable, without the motion's speed or the Loop's duration changing, so that 30fps stays an option.
30. As Nick, I want a half-size Draft render, so that I can judge composition and motion quickly.
31. As Nick, I want a full-size Final render, so that the shipped Loop is at full quality.
32. As Nick, I want the export to write the portfolio Rendition as H.264 (High, yuv420p, faststart, no audio) at 5 Mbps, dropping the bitrate only when a long Loop would exceed 6 MB, so that every Loop fits the portfolio budget.
33. As Nick, I want the export to fail loudly if the Rendition still exceeds 6 MB, so that I never upload an oversize file by mistake.
34. As Nick, I want each export's output named by Loop, Frame size and Draft or Final, so that files from different exports never overwrite each other.
35. As Nick, I want the temporary files an export creates deleted afterwards, so that disk space doesn't pile up.
36. As Nick, I want a Bookend's Seam checked on scene state for pose (the end matches the start exactly), so that the Loop's join is exact.
37. As Nick, I want the Seam checked for movement continuity (speed into the Seam equals speed out of it), so that the Loop doesn't lurch at the join.
38. As Nick, I want the Seam checked for a duplicate frame while in motion (the last frame equal to frame 0 while the Seam is moving), so that the join doesn't hitch, while a still hold across the Seam is allowed.
39. As Nick, I want a side-by-side image of the end (t = D) and start (t = 0) of every Bookend, so that I can confirm the Seam by eye.
40. As Nick, I want the Seam check to warn on a Draft render and block a Final render, so that drafts stay fast and a broken Seam never ships.
41. As Nick, I want Tours to skip the Seam check, so that their deliberate jump isn't flagged.
42. As Nick, I want the Shot templates to follow a few explicit layout rules per Frame size (the card fits the frame; in portrait a browser frame's viewport grows to fill the height), so that one Loop exports sensibly at every preset.
43. As Nick, I want the first production Loop (VR website, browser frame, Bookend: Hold on the hero, Scroll to the rail, back) rendered and validated at 16:9 and 9:16, so that v1 is proven on real work.
44. As Nick, I want one representative Scroll Shot compared at 30 and 60fps (1600 px, 5 Mbps) for smoothness, compression and render time, so that the 60fps default is locked on evidence.
45. As Nick, I want the Library copied into each Project with a version stamp, so that a Project keeps rendering the Library it was made with (ADR-0004).
46. As Nick, I want Quick Loop to keep working unchanged, so that throwaway jobs still have a fast tool.

## Implementation Decisions

- **Library.** One source at the tool repo root, copied into each Project by a sync command that stamps the Library version (ADR-0004). Contents: the Loop model, the CSS Renderer, the Scroll and Hold Shot templates, and the Project-settings loader. No general-purpose scene framework; only what several Shots per Loop, reusable Shot templates and Project-level settings need.
- **Loop model (pure, deep module).** A plain JavaScript module with no DOM, so it runs in the browser and in Node. Given a Loop (its Shots with their template, parameters, start and duration), a Frame size, the Screen's size and Focus areas, and t, it returns the scene state: Surface (scroll offset, tilt), Camera (zoom and centre), Device frame and Backdrop. Built by lifting Quick Loop's layout and closed-form state maths, not rewriting it.
  - Shot timing is time-based: each Shot's moves are fractions of its own duration, so a Shot stretches to its host clip's duration (ADR-0012, ADR-0007 as amended). Frame rate never changes speed or duration.
  - Each Shot's opening state is the previous Shot's closing state unless the Edit places a cut.
  - Layout rules per Frame size are explicit and few: the card is sized to fit the frame with margins; in portrait ratios a browser frame's viewport grows to fill the height (Quick Loop's fill), while the page keeps its desktop layout width. Further rules are added only when a real Loop needs them.
  - Template inference from a Focus path: moving down or up a tall Screen to an area is a Scroll; staying on one area is a Hold; a sideways move between areas without scrolling is rejected with a message.
- **Seam check** (in the Loop model; Bookends only). Three checks on scene state, nothing more: no general motion analysis. Assumptions, each testable: scene state is a flat set of numbers (scroll, zoom, Camera centre, tilt) compared per value; Δ is one frame at the export's frame rate; velocities are compared with a small fixed tolerance per value (about 0.01 px or 0.01° per frame); "in motion" means `state(Δ) ≠ state(0)` beyond that tolerance, so an ease's residue near rest counts as rest (ADR-0011, amended in ticket 04). Angular values (tilt angles, and any rotation added later) are compared by their shortest signed difference modulo 360°, so −180° and 180° count as equal and a velocity across the wrap isn't read as a jump; v1 tilts stay within about ±30°, but the check doesn't rely on that. The checks are a state-based approximation: passing them doesn't prove the Seam looks smooth. Ticket 09's review by eye is the final visual check.
  - Pose: `state(D) == state(0)` exactly.
  - Movement continuity: `state(D) − state(D − Δ)` equals `state(Δ) − state(0)` within float tolerance; both zero when the Seam is at rest.
  - Duplicate frame: fails only if `state(D − Δ) == state(0)` while the Seam is in motion (`state(Δ) ≠ state(0)`). A still hold across the Seam passes. This refines ADR-0011's unconditional rule, which would fail every Bookend that rests at both ends; ADR-0011 is amended to match.
  - A failed check blocks a Final render; a Draft render warns and continues.
  - The side-by-side image of t = D and t = 0 is always written for a Bookend, and the Seam is also reviewed by eye.
- **CSS Renderer.** Draws scene state into the DOM: Backdrop, card, Device frame, Screen image, scroll, tilt and zoom. Lifted from Quick Loop's paint and seek. Device frames: none, browser (2D chrome, as Quick Loop), phone (a bezel image over the Screen, Y-tilt limited to about 20°; for now a simple drawn shape Nick approved, ticket 11).
- **Shot templates (Scroll, Hold).** HyperFrames sub-compositions that receive their parameters as variables (ADR-0003). Each registers a paused timeline sized from its host clip's duration (loops ticket 05's host-clip lookup), whose update asks the Loop model for state and has the Renderer draw it. This replaces Quick Loop's root-level seek listener, which isn't proven inside a mounted Shot. Rules from ADR-0007 apply: no clip timing on inner elements, ids prefixed per template, a motion sidecar per template.
- **Project settings.** One per Project, loaded synchronously by every Loop entry: brand colour, Backdrop, default Device frame, default primary Frame size. Loop cards override per Loop. The human source is the Project sheet; Claude transcribes it.
- **Loop entry file.** One per Loop in its Film folder (ADR-0009 as amended). Its root size is the Loop's primary Frame size; it places Shot host clips with timing and parameters; Transitions are Edit-owned (a cut by default). Written by Claude from the Loop card; never generated over (ADR-0003).
- **Focus areas.** Read from the Screen's sidecar (loops ticket 09: 1x px boxes at the stored layout width; `whole` built in). An overlay command draws the labelled boxes on the Screen for approval, using the image library already in the repo.
- **Screen capture.** Quick Loop's URL capture (headless Chrome, full page, cookie banners and listed selectors hidden) exposed as a command that writes a Screen into a Project (ADR-0006, accepted).
- **Export command** (in the tool repo, not synced). Inputs: Project, Loop, Frame size (preset name or W×H), optional length, optional frame rate (default 60), Draft or Final. Steps:
  1. Load the Loop; for a Bookend, run the Seam check and write the t = D / t = 0 side-by-side image.
  2. Write a temporary copy of the Loop's entry with the target size stamped on the root and, if a length is given, every host clip's start and duration (and Edit-owned Transition tweens) scaled proportionally. Draft halves the size.
  3. Render it with HyperFrames at the frame rate.
  4. Encode the portfolio Rendition: H.264 High, yuv420p, faststart, no audio. Target 5 Mbps; if 5 Mbps can't fit 6 MB at the Loop's length, lower the bitrate to fit. 6 MB is a hard limit on the encoded file: check its actual size afterwards and fail with a clear message if it's still over.
  5. Delete the temporary copy and intermediates.
- **First production Loop** is an integration milestone, not a feature: it proves the path at 16:9 and 9:16. Problems found there are fixed locally (a layout rule, a template parameter) before any architectural change is considered. The phone frame isn't on its path.
- **Presets:** Landscape 1600×900, Story 900×1600, Square 1600×1600, Portrait 1280×1600, Classic 1600×1200. Custom sizes must be even in both dimensions.
- **Quick Loop** is left as it is. The Library copies its code; the two may drift.

## Testing Decisions

- A good test drives a public interface and checks observable results: scene state values, output file properties, check verdicts. Never internal helpers or DOM structure. Visual quality isn't tested; it's judged on rendered frames (AGENTS.md).
- Runner: Node's built-in test runner. No new dependency.
- **Seam 1, the Loop model (most tests, fast).** Cases:
  - a Shot stretched to a longer host duration reaches the same states at the same fractions;
  - a length change scales every Shot proportionally;
  - frame rate doesn't change state at a given t;
  - a Shot opens on the previous Shot's closing state;
  - each preset's layout keeps the card inside the frame, and portrait browser fill fills the height;
  - template inference: Scroll, Hold, and rejection of a sideways path;
  - Seam check: angular values compared across the ±180° wrap; pose pass and fail; continuity pass (at rest and in motion) and fail (a lurch, as in Ultramock's looped control); duplicate frame fails in motion and passes on a still hold.
- **Seam 2, the export command (few tests, slow).** On a small synthetic fixture Loop committed to the repo (a generated Screen, no client material), at small sizes: output dimensions per preset and custom; odd custom size rejected; duration after a length override; frame rate in the output; Rendition within 6 MB; a Bookend with a broken Seam blocks Final and warns on Draft; temporary files removed.
- Prior art: none in the repo; the look test's measurement tools (`.scratch/look-test/tools/`) and loops ticket 05's probe show the render and snapshot calls the export test drives.

## Out of Scope

- Everything ADR-0012 defers: Three.js, depth of field, grain, bloom, motion blur, Recordings, type, the Cursor, more than one Screen per Loop, the laptop frame, the Drift, Reveal and Orbit Shot templates.
- A review page, batch Draft renders and contact sheets (until a Project has two Loops).
- Destination-specific encoding, sizing or tests for Instagram and X.
- A responsive composition engine, automatic reflow, per-ratio Shots or choreography, platform-specific rendering.
- Automatic frame-rate selection or a benchmarking framework.
- Pixel thresholds (PSNR/SSIM) for the Seam.
- Changes to Quick Loop.
- Full Films and their Shot list, Contact sheet and type.

## Further Notes

- **ADR-0011 amended** (2026-10-11): the duplicate-frame rule as refined above, angles modulo 360°, state-based approximation. Tickets: [`issues/`](issues/), 01 first; 11 (phone frame) deferred.
- **Phone bezel image:** the phone frame needs a bezel image Nick supplies (or approves). Not needed for the first production Loop, which uses the browser frame. Nick approved a simple drawn shape until real devices exist (2026-10-12, ticket 11).
- **Risks to check on the first renders:** Quick Loop's zoom scales an image layer marked for transform, which may keep a cached bitmap and soften type at close zoom; the phone bezel at 20° of tilt; the VR website in 9:16 with the fill rule (provisional; fix with the smallest local change).
- Square at 1600×1600 and 60fps needs H.264 level 5.1 (the other presets fit 4.2); some older phones can't decode it in hardware. Kept as decided.
- Studio preview needs a reload to show a stretched Shot; render is always right (loops ticket 05).
- `projects/deo-vr` isn't a HyperFrames project or its own repository yet (ADR-0008); the first Loop's work sets that up.
- A Loop ships after a Final render, compared by hand with the Steel Hat phone clip at the same display height.
