# 07: VR website Project setup

**What to build:** The VR website Project is ready for its first Loop.

**Blocked by:** 01, 02

**Status:** done

- [x] `projects/deo-vr` is a HyperFrames project and its own git repository (ADR-0008; the private remote is Nick's to add)
- [x] The Library is synced into it
- [x] Project settings filled from the Project sheet
- [x] Focus areas for `home-full-1512@3x` (at least `hero` and `rail`) proposed by Claude, shown on the overlay (02) and approved by Nick (2026-10-12)

## Notes (2026-10-12)

- Set up by hand (no `hyperframes init`), as `fixtures/hold-loop/`: `hyperframes.json`, `meta.json`, a placeholder `index.html`, `films/`, and a `.gitignore` for renders and caches. `hyperframes check` passes. Its own repo on `main`, first commit `79f7e9e`, no remote.
- **No Project sheet existed.** Claude wrote `project.md` from `docs/brief-template/project.md` using the Screens: brand pink `#f86195`, sampled from the Step inside button; browser frame; primary Frame size Landscape. Backdrop brand colour (flat pink), which is also the default for a strong colour like this pink; set explicitly.
- **Screens stay in `assets/_source/`**, Nick's existing folder, so Loop variables use `assets/_source/home-full-1512@3x.png` and the sidecar sits beside it. All ten Screens are committed (about 113 MB of history). The largest, `home-full`, is 48 MB: under GitHub's 100 MB limit but over its 50 MB warning.
- **Focus areas proposed** (1x px at layout width 1512): `hero` (player and title column), `player`, `hero-title`, `rail` (the thumbnail strip under the hero), `find-next`, `look-closer`, `creators`. `rail` is very wide and thin (about 8:1), so a close zoom on it in 9:16 can't show all of it; ticket 09's concern.
- The overlay drew the `hero` and `player` labels on top of each other (same corner). `overlay.mjs` now moves a label right past any earlier label it would cover, or a row lower where there is no room to the right.
- Overlay for approval: `renders/overlays/home-full-1512@3x.areas.jpg` (git-ignored).
