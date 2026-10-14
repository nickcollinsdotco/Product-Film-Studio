# 04: Home scroll Loop

**What to build:** a Bookend on `home-full` that replaces the ticket-09 Loop: Scroll at constant zoom from the hero to one target, one push-in that settles for at least 1s, then back to the hero. Claude picks the target (find-next or look-closer) from the frames. A zoomed Scroll's settle must last at least 1s whatever the Shot's duration. Update the Loop card in the DeoVR Project sheet.

**Blocked by:** 03

**Status:** ready-for-agent

**Plan:** [loops 13](../../loops/issues/13-vr-loops.md)

- [ ] Draft renders at 0° and 8°, about 8s, 16:9
- [ ] Zoom stays at 1× during the scroll; one push-in; at least 1s still on the target
- [ ] Seam check passes at both tilts
- [ ] Frames inspected on a contact sheet before calling it done
