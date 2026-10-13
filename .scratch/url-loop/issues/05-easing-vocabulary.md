# 05: Easing vocabulary from snapcn `capture-reveal`

**Type:** task
**Status:** open
**Blocked by:** —

**Source:** https://snapcn.dev/docs/screens/capture-reveal (MIT, free tier).

Named curves worth trying in our moves:

- **Drop and shrink:** `cubic-bezier(0.549, 0.228, 0.136, 0.938)` over 0.8s; the window drops 108px and shrinks 16% in one transform about a fixed origin. When it lands, a slow exponential shrink takes over so it never fully stops.
- **Pop:** `cubic-bezier(0.301, 1.056, 0.803, 1)`, from 0.9 to full scale (a slight overshoot).
- **Headline rise:** 23px on a long ease-out, with the fade on a separate, faster curve; no scale, no blur.

The "never fully stops" settle is relevant to Bookends: check it against the Seam check (a residue counts as rest, ADR-0011 amended) before using it on an opening framing.

**Do:** render one Scroll Shot's settle with our current ease and with these, side by side at card size, and keep whatever looks better. Rendered output is the judge.
