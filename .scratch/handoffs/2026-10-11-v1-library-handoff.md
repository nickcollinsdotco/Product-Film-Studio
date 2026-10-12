# Handoff: v1 Loop Library under way; next are tickets 04–06

> Superseded by `2026-10-12-v1-library-07-handoff.md`.

## Waiting on Nick

Nothing open as of 2026-10-11. These come up later, when the ticket that needs them is reached:

- v1-library 07: approve Focus areas for `home-full-1512@3x` on the overlay; add the private remote for `projects/deo-vr`.
- v1-library 09: sign off the first VR Loop.
- v1-library 11 (deferred): phone bezel image, or approve a simple drawn one.

Date: 2026-10-11. Repo `C:\Users\nfbco\Documents\GITHUB\Product-Film-Studio`, branch `poc/hyperframes-pipeline`, HEAD `96b9a34` (nothing pushed). Supersedes `2026-10-09-round-9-handoff.md`.

## Read first (source of truth, not repeated here)

- `AGENTS.md`: working principles, plus the **Reporting to Nick** protocol (end with a For you block; status words; handoffs live here).
- `GLOSSARY.md`; ADRs in `docs/adr/`, especially **0010** (Loops default), **0011** (Bookend Seam check, amended 10-11), **0012** (v1 is light CSS 3D Loops; decided in loops 06).
- **Spec:** `.scratch/v1-library/spec.md`. **Tickets:** `.scratch/v1-library/issues/01–11` (the `Status:` and `Blocked by:` lines are in bold near the top of each).
- **Map:** `.scratch/loops/map.md` (Decisions so far, Fog). Loops tickets 07, 08 and 10–12 are shelved, replaced by the v1 spec.
- Implementation notes from the tickets already done: the `## Notes` sections of v1-library `01-tracer-hold-loop.md` and `03-scroll-and-multi-shot.md` (sub-composition script scoping, runtime paths, duplicate template instances, continuity across Shots).

## State

- v1-library **01** tracer, **02** overlay and **03** Scroll/multi-Shot are done (commits `a89f856`, `96b9a34`, `4ddd507`). Overlay: `npm run library:overlay -- <screen>`. Code is in `library/`, `tools/library/` and `fixtures/hold-loop/`. Run `npm test` for the tests and `npm run library:export` for a Draft. Quick Loop (`tools/quick-loop/`) stays unchanged; lift from it, don't edit it.
- **Ready for an agent:** 04 Seam check, 05 Frame sizes/Rendition, 06 browser frame and Backdrops, 07 VR Project setup, 08 fps check (needs 05), 10 URL capture. 09 is the first VR Loop milestone (needs 03–08).
- Uncommitted from this session: `.scratch/loops/issues/13-vr-loops.md` now has `Blocked by: v1-library 09 (replaces shelved 12)`, plus this handoff and the Superseded note on the round-9 handoff.
- Open risk carried from 03: the cached-bitmap blur at close zoom couldn't show on the 1x fixture Screen. Check it on the first 3x Screen (07/09).

## Next

04, 05 and 06 in any order, then 07, 08 and 09. Nick drives each with `/implement`.

## Environment

- FFmpeg isn't on Git Bash's PATH: `export PATH="$PATH:$LOCALAPPDATA/Microsoft/WinGet/Links"`. `drawtext` segfaults, so make contact sheets without labels.
- HyperFrames 0.8.141 is pinned. Don't run `hyperframes init` in this repo.
- `references/` and contact sheets are git-ignored (client material). Commit only when Nick asks. Delete temp renders after export.

## Suggested skills

- **implement** (Nick types `/implement`): each ready v1-library ticket. It runs **tdd** and **code-review** itself.
- **hyperframes:hyperframes**, **hyperframes:hyperframes-core**, **hyperframes:hyperframes-cli** (`snapshot --at`, `render`, `check`): templates, export and render inspection.
- **hyperframes:hyperframes-keyframes**: only if a Shot's camera path needs seek-safe keyframes.
- **domain-modeling**: if 04, 05 or 08 change an ADR (Seam rules, the 6 MB cap, the 60fps default).
- **handoff** (Nick types it): before ending mid-ticket or with items still waiting on Nick.
