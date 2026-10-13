# 02: Camera move semantics from snapcn `screen-recording`

**Type:** task
**Status:** open
**Blocked by:** —

**Source:** https://snapcn.dev/docs/screens/screen-recording (MIT, free tier). Code in github.com/snapcndev/snapcn.

Their camera is a list of moves `{ at, duration?, zoom?, x?, y? }`:

- A move eases from the current pose to its target over `duration`, then holds until the next move's `at`. No hold field.
- Leaving out `zoom`, `x` or `y` carries the previous value over, so a pure pan is one line.
- `zoom` is absolute; 1 is the fitted shot.
- **Focal points are clamped to what the zoom can show:** the visible half-extent is `0.5 / zoom`, so x is clamped to `[0.5/zoom, 1 − 0.5/zoom]`. At zoom 1.2, x 0.95 becomes 0.583. This stops a push from showing past the Screen's edge.
- Overlapping moves are cut short, not blended, so the camera stays continuous.
- `crop` takes per-edge fractions (`{ top: 0.11 }`) rather than pixels.

**Do:** compare this with the Library's Focus moves and Quick Loop's. Adopt the clamp if Focus areas near an edge can currently show past the Screen, and carry-over if Shot params repeat values. Port the maths; no React. If any code is copied, keep their MIT notice.

**Can move into the Library early** if a real Loop hits the edge problem before B starts.
