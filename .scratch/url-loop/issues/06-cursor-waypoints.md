# 06: Cursor waypoints with a click ring (much later)

**Type:** task
**Status:** open
**Blocked by:** the Cursor coming back (ADR-0012 defers it with Recordings)

**Source:** https://snapcn.dev/docs/screens/cursor-track (MIT, free tier).

- Waypoints `{ at, x, y, duration?, click? }` in frame coordinates; `at` is absolute; the cursor rests until the next `at`.
- The first waypoint places the cursor and its `duration` is the fade-in; an x outside 0–1 makes it walk in from off-frame.
- Straight-line travel on an ease-in-out curve.
- `click: true` pulses a ring on arrival for `clickFrames` (default 14).
- Variants: an outlined arrow (hotspot at the tip) and a touch "dot" for phones. Size is 3.9% of frame height.
- **Their weak spot:** the cursor doesn't follow the camera; users keyframe both layers. Ours should be placed in Screen coordinates so it rides the camera, like a Focus area.
