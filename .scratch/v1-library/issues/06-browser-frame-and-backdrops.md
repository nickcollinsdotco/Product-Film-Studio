# 06: Browser frame and Backdrops

**What to build:** The browser Device frame and the void and Backlight Backdrops, lifted from Quick Loop, plus the per-ratio layout rules.

**Blocked by:** 01

**Status:** done

- [x] Browser Device frame (2D window chrome) as Quick Loop draws it
- [x] Void (flat near-black) and Backlight (near-black with a soft glow in the brand colour) Backdrops
- [x] Default Backdrop: brand colour when the Product brand has a strong colour, otherwise Backlight
- [x] Layout: the card fits the frame with margins at every preset; in portrait ratios a browser frame's viewport grows to fill the height while the page keeps its desktop width
- [x] Tests (Loop model): card inside the frame at every preset; portrait fill
- [x] Rendered frames at 16:9 and 9:16 inspected

## Notes (2026-10-12)

- **Layout** is in `LoopModel.layout(frame, screen, deviceFrame)`: the Surface is 72% of the frame's width, at most 84% of its height, 16:10 viewport; the browser bar (Quick Loop's, `max(24, 2.6% of width)`) sits above it. `left/top/width/height` stay the viewport's (the Camera maths use them); `bounds` is the whole Surface, bar included. A Loop carries `deviceFrame`; `shot.js` and `seam.mjs` pass it from the resolved settings.
- **Portrait fill** (H > W, browser frame only): the viewport grows to `84% H − bar`, but never taller than the Screen at the Surface's width, so a short Screen leaves no blank page (the fixture Screen is short: at Story it fills 1080 of 1344 px and doesn't scroll). Not in Quick Loop; added after the first 9:16 render showed white below the page.
- **Backdrops:** brand (flat fill), void (`#0e1116`, Quick Loop's dark), Backlight (`#0e1116` with a brand-tinted radial glow, 75% × 75% of the frame, 0.4 opacity at the centre, so it spills round the Surface). Backlight strength is a fixed default until a Product brand needs to set it (GLOSSARY).
- **Default Backdrop:** `backdrop` is now optional in Project settings. Left out, it's brand when the brand colour is strong, otherwise Backlight. "Strong" = chroma (max − min of RGB) ≥ 0.25, so greys, near-whites and near-blacks get Backlight. A very dark saturated colour (e.g. `#1a0040`) still counts as strong; revisit if a real brand hits it.
- **Per-Loop overrides:** `data-settings` (JSON) on the entry root overrides Project settings (spec story 11). `seam.mjs` resolves them the same way, running the Project's settings files in a `vm` sandbox, so the Seam check and its image match what renders.
- **Fixture:** `films/fixture/browser.html`, the Bookend in a browser frame on Backlight.
- **Verified on renders** (Final, 60fps): Landscape and Story pass the Seam; chrome, margins and type clean; void checked on a Draft. The Backlight glow shows faint banding rings at 9:16 (a dark 8-bit gradient through H.264). Judge on the first VR render; dither or grain is deferred (ADR-0012).
