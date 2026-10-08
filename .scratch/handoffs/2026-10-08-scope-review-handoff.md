# Handoff: Product Film Studio, design grilling paused before a scope review

> **Superseded in part** by `2026-10-08-round-7-handoff.md` and [ADR-0010](../../docs/adr/0010-loops-are-the-default-output.md): Loops are now the default output. Where the two differ, the later one wins.

Date: 2026-10-08. Branch: `poc/hyperframes-pipeline`. Repo: `C:\Users\nfbco\Documents\GITHUB\Product-Film-Studio`.

## What the next session is for

The user is about to propose a **change of scope toward short looping clips**, instead of (or as well as) 15–20s product films. Start by hearing that proposal. Then re-grill **only the decisions it actually affects**, using the same round format (numbered questions, each with a recommended answer). Don't re-open settled decisions unless the scope change genuinely contradicts them, and say so explicitly when it does.

## Read first (source of truth, not duplicated here)

- `AGENTS.md`: working principles. grill-with-docs, to-spec, to-tickets, implement and handoff run **only when the user types them**, so recommend them rather than invoking them. Rendered frames are the validation for anything visual.
- `GLOSSARY.md`: the settled vocabulary. Use it strictly: Project / Film / Edit / Shot template / Shot / Landing / Transition / Library / Primitive / Renderer / Surface / Device frame / Default theme / Product brand / Backlight / Sign-off / Brief / Shot list / Contact sheet / Draft render / Final render.
- `docs/adr/0001`–`0009`. All are accepted except **0006 (Captures frozen, proposed)**: `hyperframes capture` output is still unverified.
- `docs/adr/0007-how-primitives-drive-the-renderer.md` and `docs/spikes/q1-renderer-spike.md`: the spike result (below).
- `docs/brief-template/` (film-brief-template.md, film-brief.md, project.md): the user's Brief template, committed in 021b79e. It already has `workflow: full | short` and an "8 to 10s" short version, which is relevant to looping clips.
- `docs/poc.md`: the proof-of-concept pipeline. Commands: `npm run check:poc | preview:poc | render:poc`.
- Spike evidence: `.scratch/q1-renderer-spike/` (FINDINGS.md log, variants, `out/` contact sheets, `evidence/` diffs).

## Spike result (ADR-0007, accepted)

Primitives tween renderer-neutral **scene state**, and one draw function per Renderer renders it. Shot-level retiming in Studio works for every approach; Studio only edits host clip timing. A Shot's internal timeline **never stretches**: move = shift, trim end = cut, trim start = offset, extend = hold the last frame. Keyframe-level editing inside Shots isn't available; that was accepted as a nice-to-have.

Rules for every Shot template:
- no inner clip timing
- template-prefixed ids
- a `*.motion.json` sidecar

Transitions are literal tweens on the Edit's host clips.

## Open questions (Round 6, ON HOLD pending the scope change)

- **R6 Q1: do audits apply to Surfaces?** Proposal: Surfaces and their content are exempt from layout and contrast audits, because depth of field deliberately blurs them and product UI isn't ours to fix. Everything we author (type, Cursor, Sign-off) stays fully audited. Still unverified: whether HyperFrames' `data-layout-ignore` also exempts the **contrast** audit (docs only say "never audited"). If it doesn't, the Library would filter those findings.
- **R6 Q2: what does an extended Shot do?** Proposal: every Shot template ends in a long `camera.drift` that runs past its nominal end, so trims cut it and extensions reveal more instead of freezing (the spike proved extension = hold).

**Likely collision with looping clips:** a seamless loop needs the last frame to equal the first. Open-ended drift and "extend = hold" both work against that. Revisit Q2 inside the loop discussion, not before.

## Decisions settled in conversation but not in ADRs or the glossary

These were judged too easy to reverse to deserve ADRs. Probe the ones the scope change touches.

- **Use and volume:** your own products plus client work; about 1–4 films a month; solo, driven through Claude Code, with Studio for review and Shot-level timing. First test case: **VR website** (assets ready, no music yet), then the app prototype. **Film-first**: build the Library while making the first real Film. The POC (`films/poc/`) stays until the Library exists, then gets replaced by a committed fixture Project used as a smoke test.
- **Output:** 16:9 and 9:16 Edits first-class; 4:5 and 4:3 later. 60fps, 1080p master, 4K as an export option. Draft renders at 30fps.
- **Look:** the references (Ultramock, arqe.ai) are vocabulary and a quality bar, not templates. Default theme is dark only for now (light added when a real Film needs it), overridable per Product brand and per Film. Geist and Geist Mono. Backlight is subtle, with its strength as a Product brand token. Sign-off is neutral and small, final moment of the end card only.
- **Fonts:** a missing Product brand font falls back to Geist in a Draft render and gets flagged. A Final render blocks unless the Brief accepts the fallback.
- **Product brand:** a fixed token set, drafted by Claude from Screens or the live site and approved by the user.
- **v1 Primitives:**
  - `camera.pushIn / pan / drift / rackFocus`
  - `surface.present / tilt / focus / scroll / swap` (a device is a Surface with a Device frame, so there's no `device.present`)
  - `cursor.move / click / scroll`
  - `type.reveal / exit` (blur-in default, mask-up, per-word)
  - Deferred: `camera.orbit`, arrays of Surfaces, 3D device bodies, `drag`.
- **Timing:** Landings are placed manually on chosen strong beats, with no auto-snapping. The music grid informs the edit but doesn't dictate it. Silent Films use seconds.
- **Transitions:** `cut`, `blurDissolve`, `matchMove`, with 0.3–0.8s overlaps. Owned by the Edit. Edits can re-pace, reorder and drop Shots.
- **Cursor:** an oversized soft cursor by default. For Recordings, Claude drafts `<recording>.cursor.json` keyframes; a mouse-logger gets built only if that proves inadequate on a real recording.
- **Ingest:** `npm run ingest <project>`. Recordings standardised to a fixed 60fps, H.264, fast-start. A manifest records each Screen's size and pixel density. Logos are SVG only. Originals go in `assets/_source/`.
- **Process:** Brief → Shot list ✅ → Contact sheet ✅ → Draft render → Studio timing pass ✅ → Final render (✅ = approval gate). Smaller or experimental films may skip stages.
- **Sync:** a minimal copy of the whole Library plus a version stamp (ADR-0004). Per-Project git (ADR-0008) makes re-syncs reviewable.

## Verified facts worth not re-checking

- HyperFrames 0.8.141 is pinned. Studio lists every top-level entry file, including ones in subfolders (ADR-0009).
- Paths that climb out of the project with `../` break Studio preview (ADR-0004).
- Studio's keyframe editor only reads literal inline tweens; helpers show read-only with "Unroll" (spike).
- `render --composition <file>` selects an Edit. `--variables` and `--variables-file` exist.
- `render --format` supports mp4, webm, mov (transparency), gif and png-sequence. That's relevant to loops for the portfolio and web.
- Environment quirks (winget, FFmpeg PATH refresh, Chrome) are in Claude's auto-memory (`windows-env-quirks`).

## Reference research (not saved in the repo)

- **Ultramock (ultramock.io):** photoreal 3D devices, low-angle screen close-ups, strong depth of field, blur-in type, coloured backlight, 60fps. Note that ultramock.com is an unrelated tool.
- **arqe.ai:** flat UI planes in 3D, grids and carousels drifting, oversized cursor, Suisse Intl, light and dark, 30fps, delivered at 16:9, 4:3, 9:16 and 3:4. arqe's showcase includes many **short looping social clips (carousels, orbits, "frames")**, which may be useful reference for the scope change.
- **The user's portfolio:** project cards are about 4:3, and there's one 4:5 video.
- The reference MP4s and contact sheets were downloaded to `%TEMP%\pfs-refs\`, which is temporary and may be gone. The user has added a git-ignored `references/` folder.

## Git state

The user committed checkpoints `021b79e` and `ae8c1ba` (glossary, ADRs, Brief template, skills). Uncommitted: the ADR-0007 update (accepted), `docs/spikes/`, `.scratch/`. Nothing is pushed and there's no PR. Commit only when asked.

## Suggested skills

- **grilling** and **domain-modeling**: to continue the interview and keep `GLOSSARY.md` and the ADRs current. The user starts these via `/grill-with-docs`, so recommend that rather than invoking it. Likely new terms to settle: Loop, loop point, clip versus Film.
- **hyperframes:hyperframes**, then **hyperframes:hyperframes-core** and **hyperframes:hyperframes-animation**: for seek-safe looping (finite `repeat`, matching end and start states) and for transparent or WebM output.
- **hyperframes:motion-graphics**: HyperFrames' own workflow for short (under 10s), design-led, often looping pieces. Check how its conventions fit before inventing new ones.
- **prototype**: if the feel of a loop (seam, pacing) is the open question, prototype and render it rather than debating it.
- Later, when the user types them: **to-spec**, then **to-tickets** / **implement**.
