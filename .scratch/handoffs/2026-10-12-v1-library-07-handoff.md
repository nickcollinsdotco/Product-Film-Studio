# Handoff: v1 Loop Library, 04–06 done; next is 07 (VR Project setup)

## Waiting on Nick

- v1-library 07 (open since 2026-10-11): add the private remote for `projects/deo-vr`.
- v1-library 07 (open since 2026-10-12): confirm the Project sheet Claude wrote, `projects/deo-vr/project.md` (pink `#f86195`, brand-colour Backdrop, browser frame).
- v1-library 09: sign off the first VR Loop (later).
- v1-library 11 (deferred): phone bezel image, or approve a simple drawn one.

Date: 2026-10-12. Repo `C:\Users\nfbco\Documents\GITHUB\Product-Film-Studio`, branch `poc/hyperframes-pipeline`, HEAD `cf37cec`, nothing pushed. Supersedes `2026-10-11-v1-library-handoff.md`.

## Read first

- `AGENTS.md` (the reporting protocol), `GLOSSARY.md`, ADRs 0004, 0008, 0011, 0012 in `docs/adr/`.
- Spec `.scratch/v1-library/spec.md`; tickets `.scratch/v1-library/issues/` (Status lines). **Focus: `07-vr-project-setup.md`.**
- `## Notes` in tickets 01, 03, 05 and 06 (06 covers layout `bounds`, the portrait fill cap, Backdrops, per-Loop `data-settings`, and the edge-flicker fix).

## State

- Done: 01–06 (06 = `f6f01e7` + flicker fix `cf37cec`). Nick reviewed the 06 renders on 2026-10-12: flicker acceptable. The Backlight glow is **parked** (slight banding is OK for now).
- Ready: 07, 08 (fps check), 10 (URL capture). 09 needs 03–08.
- Open risk: possible soft text at close zoom (cached bitmap). Dropping `will-change` in 06 may have helped. Check it on the first 3x Screen (07/09).
- Renders in `renders/library/hold-loop/` (git-ignored, about 10 MB): Nick can delete them.

## For 07

- `projects/deo-vr` isn't a HyperFrames project or a git repository yet. Don't run `hyperframes init` in the tool repo; set the Project up by hand, as in `fixtures/hold-loop/`.
- Use `npm run library:sync -- <project>` and `npm run library:overlay -- <screen>`. `backdrop` is optional in Project settings (defaults by brand colour); `deviceFrame: "browser"` is expected for VR.
- `references/` is client material and git-ignored.

## Environment

- FFmpeg: `export PATH="$PATH:$LOCALAPPDATA/Microsoft/WinGet/Links"`. `drawtext` segfaults.
- HyperFrames 0.8.141 is pinned. `npm test` takes about 3.5 min (55 tests).
- Commit only when Nick asks. Delete temp renders after use.

## Suggested skills

- **implement** (Nick types it): ticket 07.
- **hyperframes:hyperframes-cli**, **hyperframes:hyperframes-core**: project setup, `snapshot`, `render`.
- **domain-modeling**: if 07 changes an ADR (e.g. ADR-0008 repo layout).
