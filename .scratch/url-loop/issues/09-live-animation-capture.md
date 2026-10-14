# 09: Capture a site's running animations, not just a still

**Type:** prototype
**Status:** deferred
**Blocked by:** 01 (revisit after the X probe replies, 2026-10-21)

Can a URL Loop show the page's own animations after it has loaded, rather than freezing them? Loading animations are out of scope.

## Probe (2026-10-14)

`.scratch/live-capture-probe/` (`rec.mjs`, `hex.mp4`, `sheet.png`). Tested on the nickcollins.co hero hex block.

- The hex block runs on JS timers and rAF; `document.getAnimations()` is empty. Chrome's `Emulation.setVirtualTimePolicy` pause makes `Page.captureScreenshot` hang.
- What worked was a clock shim injected before load. It overrides `performance.now`, `Date.now`, timers and rAF, and steps WAAPI animations. The page runs in real time until `__freeze()`, then moves only on `__step(ms)`. Screenshotting after each step gives deterministic frames with none dropped.
- 8s at 30fps and 2x took 29s to capture, about 4x realtime. Nick checked the clip and it looks right.

## Open questions

- **Scrolling (Nick's concern).** The Loop scrolls and zooms a still. One option is to lay a clip of the animated region over the still at its position. The other is to record the whole viewport while it scrolls, which would mean the camera moves at capture time.
- **Loop seam.** The clip has to repeat cleanly. Match it to the animation's cycle or crossfade.
- **Region.** Use a selector, or auto-detect the pixels that change between frames.
- **Not covered by the shim:** web workers, `<video>` (which needs `currentTime` stepping) and WebGL running on its own clock.
- **ADR-0006.** The clip is captured once and frozen like the still, so this should fit. Confirm before building.
