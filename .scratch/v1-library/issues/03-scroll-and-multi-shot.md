# 03: Scroll Shot and multi-Shot Loops

**What to build:** A Loop can hold several Shots in sequence, and the Scroll template moves down or up a tall Screen and lands on a named Focus area, optionally zooming in.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Scroll template lands on a Focus area read from the Screen's sidecar, scrolling in either direction, with optional zoom-in (Quick Loop's focus moves)
- [ ] Each Shot opens on the previous Shot's closing state unless the Edit places a cut
- [ ] Template inference from a Focus path: Scroll (moves along the Screen to an area), Hold (stays on one area); a sideways move between areas without scrolling is rejected with a message
- [ ] Tests: Shot-to-Shot continuity, inference and rejection (Loop model); a two-Shot fixture exports (export)
- [ ] Rendered frames of a Hold then Scroll fixture are inspected, including type sharpness at close zoom
