# 11: Phone Device frame

**What to build:** The phone Device frame, drawn as Nick's simple shape until real device art exists, and the Steel Hat phone move.

**Blocked by:** 06

**Status:** done

- [x] Phone Device frame drawn from a bezel image over the Screen (Nick approved a simple drawn shape instead, 2026-10-12)
- [x] Y-tilt limited to about 20°
- [x] A bold tilt easing to upright while the page scrolls (the Steel Hat phone move)
- [x] Rendered frames inspected at 16:9 and 9:16

## Notes (2026-10-12)

- **Bezel:** drawn in CSS from Nick's reference shape (`deviceFrame: "phone"`), proportions measured from his drawing as shares of the body's width: corner radius 8.6%, near-black body `#0a0a0a` with a faint `#262626` outer edge, a 0.5% `#404040` ring round the Screen, Screen inset 2.9% (of the Screen's width) on every side, Screen corner radius 5.9%. No notch or island, as in his drawing. Swap for real device art later.
- **Layout** (`LoopModel.layout`, `deviceFrame: "phone"`): a 9:19.5 viewport; the Screen is scaled to its width (capture mobile Screens at 390 px layout width). The phone is 76% of the frame's height at most (shorter than a card, so a push in keeps a margin), and sized so that, turned at full tilt, it fits 88% of the frame. At 9:16 the turn is what limits it: 424 × 890 px (56% tall, near Steel Hat's ~60%). At 16:9: 326 × 684.
- **Tilt:** one `tilt` value in scene state, at most 20° either way (all Device frames; a larger `tilt` parameter is rejected). The CSS Renderer draws a phone's tilt mostly as a turn in the frame, as in the Steel Hat clip: `rotateZ(1.4 t)`, `rotateY(−0.8 t)`, `rotateX(0.5 t)`, so Y-tilt ≤ 16°. The turn factor lives in the model (`surface.turn`), which sizes the phone for it.
- **The Steel Hat move:** Scroll takes `tilt` (degrees it opens on when it opens on its own, as `from`); it now always lands upright, the tilt easing out with the scroll. Previously a Scroll kept its opening tilt, but every opening tilt was 0, so existing Loops don't change. Hold's tilt settle takes `tilt` too (default 8).
- **Fixture:** `fixtures/hold-loop/screens/fixture-mobile.png` (synthetic, 390 px at 3x, made by `make-screen.mjs`) with Focus areas, and `films/fixture/phone.html`, a Tour: Scroll from the top to `card-2` opening at 20°, then a push in.
- **Rendered** (Final, 60fps, 4.0 MB each): `renders/library/hold-loop/phone-{1600x900,900x1600}-final.mp4`. Frame 0 tilted and inside the frame at both sizes; bezel clean at full size; type crisp at rest.
- Library 0.3.0.

## Comments

- 2026-10-12, Nick: "yeah looks good. ship it" (the 16:9 and 9:16 phone renders).
- 2026-10-12, Nick: a phone Loop may open on its tilt (the Steel Hat move), an exception to story 17's settled frame 0: "it looks good so why not".
