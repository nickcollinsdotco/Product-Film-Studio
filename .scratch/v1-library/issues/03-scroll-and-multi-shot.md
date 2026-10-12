# 03: Scroll Shot and multi-Shot Loops

**What to build:** A Loop can hold several Shots in sequence, and the Scroll template moves down or up a tall Screen and lands on a named Focus area, optionally zooming in.

**Blocked by:** 01

**Status:** done

- [x] Scroll template lands on a Focus area read from the Screen's sidecar, scrolling in either direction, with optional zoom-in (Quick Loop's focus moves)
- [x] Each Shot opens on the previous Shot's closing state unless the Edit places a cut
- [x] Template inference from a Focus path: Scroll (moves along the Screen to an area), Hold (stays on one area); a sideways move between areas without scrolling is rejected with a message
- [x] Tests: Shot-to-Shot continuity, inference and rejection (Loop model); a two-Shot fixture exports (export)
- [x] Rendered frames of a Hold then Scroll fixture are inspected, including type sharpness at close zoom

## Notes (2026-10-11)

- **Two instances of one template work.** HyperFrames renames duplicate host ids on mount (`scroll` → `scroll__hf1`, `scroll__hf2`; also `hold__hf1/2`) and scopes each instance's `getElementById`, `__hyperframes.getVariables()` and `window.__timelines` to its host. Each registers its own timeline sized from its own host clip; the fixture renders with all four registered.
- **Continuity across Shots.** Each Shot reads the Loop's Shots from its sibling host clips (template from the source, params from `data-variable-values`, start and duration) and asks the Loop model to plan the whole chain, then draws only its own part. Closing states don't depend on duration, so retiming never breaks the chain. A cut is `data-cut` on the host clip of the Shot that opens fresh. On mount HyperFrames renames `data-composition-src` to `data-composition-file`; `shot.js` reads either.
- **Focus areas** load synchronously from `<screen>.areas.json` (one request per Screen, cached), so timelines register before the template script returns.
- **Hold** now takes a named Focus area: it frames the area's scroll and pushes or pulls about the area's centre. Continuing from a Shot, push-in and pull-out scale that Shot's closing framing by 1.08 either way, and tilt-settle eases its tilt to 0.
- **Inference** compares the scroll each area needs at the Loop's Frame size; areas within 5% of the viewport height of each other are side by side and rejected.
- **Verified on the render** (fixture `hold-scroll.html`, 1600×900, 60fps): joins at 1.5s and 4.5s are continuous, the zoom lands centred on `card-2` (Z 1.76), the second Scroll returns to the hero, and the cut at 7s opens tilted on `whole`. The same Loop with every host clip ×1.5 matches frame for frame at the same fractions (mean difference about 0.2/255 against 32 for a control).
- **Type at close zoom** is clean at 1.76×. The fixture Screen is 1x, so the cached-bitmap risk (spec) can't show here; check it on the first 3x Screen.
