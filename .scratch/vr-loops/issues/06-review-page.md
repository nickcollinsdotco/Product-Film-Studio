# 06: Review page

**What to build:** one command generates a static HTML review page for a Project: every Draft autoplaying muted on loop at portfolio card size, a Loop's 0° and 8° Drafts side by side, and the Steel Hat phone clip at the same display height. Nick opens it in a browser to pick each Loop's tilt and judge it against Steel Hat (ADR-0012 shipping rule). Drafts rendered later appear when it's regenerated.

**Blocked by:** 03

**Status:** done

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [x] Page generated for DeoVR with 03's Drafts and the Steel Hat clip; opened and screenshotted
- [x] Videos play muted, loop, and are labelled by Loop and tilt
- [x] Regenerating picks up new Drafts with no hand edits

## Notes (2026-10-18)

- `npm run library:review -- projects/deo-vr` (`tools/library/review.mjs`) writes `renders/library/<project>/review.html` beside the Drafts. It finds Drafts by export's naming (`<loop>-<W>x<H>-draft[-<n>s][-<fps>fps][-tilt<n>].mp4`), so Finals and seam images are left out. One row per Loop: its Drafts by tilt (0° before 8°), then the Steel Hat phone clip, all 360 CSS px tall (`--height` to change). Captions give tilt and size.
- Card size: 360 px is a stand-in that fits two 16:9 Drafts and Steel Hat on one 1920 px row. The real portfolio card height isn't recorded anywhere.
- Checked in Chrome (`renders/vr-06/review.png`): hero-push-in and home-scroll at 0° and 8°, plus Steel Hat; all 6 playing, muted, looping, same height. The page was first generated with hero-push-in only; regenerating picked up the home-scroll Drafts with no edits.
- The tilt-8 hero-push-in Draft predates Library 0.5.1's jitter fix (rendered 2026-10-15), so it still jitters. Nick already picked 0° for this Loop, so it only needs a re-draft if the tilt is reopened.
- Tests: `tools/library/test/review.test.mjs`.
