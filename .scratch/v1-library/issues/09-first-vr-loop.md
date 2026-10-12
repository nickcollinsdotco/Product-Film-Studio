# 09: First production Loop: VR Bookend (milestone)

**What to build:** Integration milestone: the first real Loop proves the v1 path at 16:9 and 9:16.

**Blocked by:** 03, 04, 05, 06, 07, 08

**Status:** done

- [x] Loop card written in the VR Project sheet, and the entry file written from it: browser frame, Bookend, Hold on the hero, Scroll to the rail, back
- [x] Draft renders at 16:9 and 9:16 reviewed for composition and motion
- [x] Seam check passes; the t = D / t = 0 image and the Loop's join are reviewed by eye, which is the final visual check of the Seam
- [x] Type sharpness at close zoom checked on paused frames
- [x] Problems fixed locally (a layout rule, a template parameter) before any architectural change; 9:16 adjusted minimally if it looks poor
- [x] Final renders at 16:9 and 9:16 within 6 MB (done: 5.82 and 5.68 MB), compared by hand with the Steel Hat phone clip at the same display height
- [x] Approved by Nick

## Notes (2026-10-12)

- **Loop card** in `projects/deo-vr/project.md`; entry `films/home-bookend/home-bookend.html`: Hold on `hero` (push in, 3s), Scroll to `rail` zooming in (3.5s), Scroll back to `hero` (3s); 9.5s.
- **Problem 1, 16:9: the rail barely zoomed (1.06×).** Scroll's zoom fit the area within 72% of the frame, the card's own width, so a full-width area like `rail` can't zoom. Fix: a Scroll parameter `fill` (default 0.72, unchanged): how much of the frame the zoomed area may fill. The Loop uses 0.95, so the rail fills the frame (1.39×).
- **Problem 2, 9:16: a tall thumbnail of the whole page.** The filled browser card was 72% of the width, so the page's type was tiny. Layout rule: a filled (portrait, browser) card is 88% of the frame's width. Frame 0 now reads: headline legible, hero a usable size.
- **Problem 3, 9:16 close zoom: a block of pink above the card.** Centring the rail put the card's top edge low in the frame and ran the card off the bottom. Rule: a zoomed Scroll's Camera aims at the area as far as the Surface allows: a Surface that fits the frame once zoomed stays inside it, and one that doesn't keeps its edges outside it. No change at 16:9 for this Loop. (A first version centred any Surface that fits; code review caught that it would pull a mild zoom off an off-centre area.)
- **9:16 limitation:** the whole page from hero to rail fits the tall card, so at 9:16 there's no scroll; the Loop is a gentle push in on the whole card and back. The rail isn't singled out.
- Library 0.2.0 (all three changes, tested in `loop-model.test.mjs`; `fill` must be in (0, 1]). The 88% width applies to any portrait browser frame, so Portrait 4:5 too; not yet rendered at 4:5, synced into DeoVR.
- **Seam:** check passes at both sizes; the t = D | t = 0 image is identical by eye. The last and first encoded frames differ by 0.7/255 (16:9) and 1.5/255 (9:16): H.264 noise, as in ticket 04. The join frames show no jump.
- **Type at close zoom** (paused at 6.4s, 1.39×, 16:9 Final): crisp. The 3x Screen shows no cached-bitmap softening (spec risk closed).
- **Steel Hat comparison:** `renders/library/deo-vr/compare-steel-hat.mp4` (Steel Hat phone | 9:16 | 16:9 at 720 px tall). Steel Hat is a small, boldly tilted device; this Loop is flat and fills more of the frame, and at 16:9 close zoom it is all page, no Backdrop.
- Renders (git-ignored): `renders/library/deo-vr/home-bookend-{1600x900,900x1600}-final.mp4` and their `-seam.png`.

## Comments

- 2026-10-12, Nick: "good enough, ship it". 9:16 ships as is (no scroll); flat look kept for v1.
- 2026-10-12, Nick: not good enough to upload; fine as a proof of concept. The motion reads as a double zoom: in and out twice, never settling on anything worth noticing. Cause: the Hold pushes in (1.08×), the Scroll zooms back out to 1× while it moves, zooms in on the rail (1.39×), then the return Scroll zooms out again. The rail isn't a strong subject either. Not uploaded.
