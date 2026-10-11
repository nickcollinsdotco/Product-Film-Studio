# 06: Browser frame and Backdrops

**What to build:** The browser Device frame and the void and Backlight Backdrops, lifted from Quick Loop, plus the per-ratio layout rules.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Browser Device frame (2D window chrome) as Quick Loop draws it
- [ ] Void (flat near-black) and Backlight (near-black with a soft glow in the brand colour) Backdrops
- [ ] Default Backdrop: brand colour when the Product brand has a strong colour, otherwise Backlight
- [ ] Layout: the card fits the frame with margins at every preset; in portrait ratios a browser frame's viewport grows to fill the height while the page keeps its desktop width
- [ ] Tests (Loop model): card inside the frame at every preset; portrait fill
- [ ] Rendered frames at 16:9 and 9:16 inspected
