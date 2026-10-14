# 03: Hero push-in Loop (tracer)

**What to build:** the first Loop under the motion rule (ADR-0012 as amended): one subject, one push-in, settle on the Notice for at least 1s, return. Hold gains a move that pushes in on a Focus area (filling it to a chosen share of the frame), settles, and a matching return, so a Bookend is push-in-and-settle then return. A Loop can hold a constant tilt for its whole length, so a tilted Bookend's Seam joins identical framings. Claude proposes the `home-hero` Focus areas (at least the player) and writes the Loop card: Hero push-in, Bookend, about 8s, 16:9, browser frame, pink Backdrop.

**Blocked by:** 01

**Status:** done

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [x] Draft renders at 0° and 8° tilt
- [x] Exactly one push-in; the Camera is still on the player for at least 1s; no zoom-out-then-in
- [x] Seam check passes at both tilts; the t = D | t = 0 image is identical by eye
- [x] New moves tested in the Loop model tests
- [x] Frames inspected on a contact sheet before calling it done

## Notes (2026-10-15)

- Library 0.5.0, synced into DeoVR. Hold gains `push-settle` (pushes in on a Focus area until it fills `fill` of the frame, then still for the Shot's last 40%, never under 1s) and `return` (back to the area's framing). The close-up is Scroll's zoom, now shared (`closeUp`).
- A Loop's constant tilt is `tilt` in its settings (data-settings on the entry root). Shots tilt on top of it; the sum stays within ±20°. The export's `--tilt` stamps it into the temporary copy, so one entry drafts at both tilts (`…-draft-tilt0.mp4`, `…-draft-tilt8.mp4`), ready for the review page (06).
- Renderer: a tilt now pivots on the Camera's aim (the frame centre), not the Surface's centre; at 2× zoom the old pivot swung the Surface's edge into frame. A tilted Surface that fills the frame is drawn up to 0.7% per degree larger, eased in with zoom, so its tilted edges stay out of frame (no pink at the 8° settle, counted on the frame). Zoom-1 and untilted states are unchanged.
- `home-hero` Focus areas: hero, player, hero-title, rail (`renders/vr-03/home-hero.areas.png`).
- Fill 1 on the player: at 0.8 the Surface's left edge clamps, so the player sits off-centre and the title is cut mid-word. At 1 the player is centred with equal dark margins and the title just off-frame.
- Drafts: `renders/library/deo-vr/hero-push-in-800x450-draft-tilt{0,8}.mp4`; sheets `renders/vr-03/sheet-tilt{0,8}.png`. The push ends at 2.7s and the frame is still to 4.5s (mean frame difference 0.02–0.03 grey levels). One bump of about 1.2 levels at 4.17s lines up with the encoder's I-frame, not with Camera motion. Check for it on the Final (07).
