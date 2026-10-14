# 03: Hero push-in Loop (tracer)

**What to build:** the first Loop under the motion rule (ADR-0012 as amended): one subject, one push-in, settle on the Notice for at least 1s, return. Hold gains a move that pushes in on a Focus area (filling it to a chosen share of the frame), settles, and a matching return, so a Bookend is push-in-and-settle then return. A Loop can hold a constant tilt for its whole length, so a tilted Bookend's Seam joins identical framings. Claude proposes the `home-hero` Focus areas (at least the player) and writes the Loop card: Hero push-in, Bookend, about 8s, 16:9, browser frame, pink Backdrop.

**Blocked by:** 01

**Status:** ready-for-agent

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [ ] Draft renders at 0° and 8° tilt
- [ ] Exactly one push-in; the Camera is still on the player for at least 1s; no zoom-out-then-in
- [ ] Seam check passes at both tilts; the t = D | t = 0 image is identical by eye
- [ ] New moves tested in the Loop model tests
- [ ] Frames inspected on a contact sheet before calling it done
