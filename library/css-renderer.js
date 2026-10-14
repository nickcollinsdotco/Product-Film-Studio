// CSS Renderer: draws Loop model scene state into the DOM. Exposed as window.CssRenderer.
// Paint and seek lifted from Quick Loop (tools/quick-loop/composition.html),
// including its render fixes (vr-loops ticket 01): zoom by resizing, a
// transparent margin round the tilted layer, a layered shadow and dither.
(function (root) {
  const rgbOf = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };
  const lum = (hex) => {
    const [r, g, b] = rgbOf(hex);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const div = (parent, css) => {
    const el = parent.ownerDocument.createElement("div");
    el.style.cssText = css;
    parent.appendChild(el);
    return el;
  };

  // Backdrops (GLOSSARY): brand colour is a flat fill; void is flat near-black;
  // Backlight is near-black with a soft glow in the brand colour behind the card.
  const NEAR_BLACK = "#0e1116"; // Quick Loop's default dark background
  const BACKLIGHT = 0.4; // the glow's opacity at its centre: a fixed default until a Product brand sets Backlight strength
  const BACKDROPS = {
    brand: (brand) => ({ colour: brand, css: brand }),
    void: () => ({ colour: NEAR_BLACK, css: NEAR_BLACK }),
    backlight: (brand) => ({
      colour: NEAR_BLACK,
      // Wider than the Surface (72% × 84% of the frame), so the glow spills round its edges.
      css: `radial-gradient(ellipse 75% 75% at 50% 50%, rgba(${rgbOf(brand)},${BACKLIGHT}) 0%, rgba(${rgbOf(brand)},${BACKLIGHT / 3}) 55%, rgba(${rgbOf(brand)},0) 100%), ${NEAR_BLACK}`,
    }),
  };

  // Tilt: one angle in the scene state, drawn per Device frame. A card or browser
  // tips back with a slight turn (Quick Loop's); a phone mostly turns in the frame
  // (the Surface's `turn`, which its layout leaves room for), as in the Steel Hat
  // phone clip, with its Y-tilt never more than the tilt itself (≤ 20°).
  // `perspective` grows with the zoom, so a resized Surface tilts as a scaled one would.
  const TILTS = {
    card: (t, p) => `perspective(${p}px) rotateX(${t * 0.9}deg) rotateY(${-t}deg) rotateZ(${t * 0.12}deg)`,
    phone: (t, p, c) => `perspective(${p}px) rotateX(${t * 0.5}deg) rotateY(${-t * 0.8}deg) rotateZ(${t * c.turn}deg)`,
  };
  const MARGIN = 2; // px of transparent margin round the tilted layer, so its edges are filtered inside the texture, not cut aliased

  // Where the Surface and its parts land in the frame for a scene state. The zoom
  // is applied by resizing (Z times every length), not by a CSS scale, so Chrome
  // rasterises the Screen at its on-screen size: a scaled 3D layer is drawn at 1x
  // and only re-rasterised once it stops moving. The Camera puts Surface point
  // (cx, cy) at the frame's centre. `shadow` is how much of the shadow shows: all
  // of it at zoom 1, none once the Surface fills the frame's width.
  function place(st, frame) {
    const { width: W, height: H } = frame;
    const c = st.surface, b = c.bounds, Z = st.zoom;
    const fill = W / b.width;
    return {
      left: W / 2 + Z * (b.left - st.cx), top: H / 2 + Z * (b.top - st.cy),
      width: b.width * Z, height: b.height * Z,
      bar: c.bar * Z, bezel: c.bezel * Z, viewportHeight: c.viewportHeight * Z,
      imageWidth: c.width * Z, imageHeight: c.imageHeight * Z, scroll: st.scroll * Z,
      radius: 14 * (b.width / 1400) * Z, perspective: W * 1.6 * Z,
      shadow: fill > 1 ? clamp01((fill - Z) / (fill - 1)) : 0,
    };
  }

  // Layered: a tight contact shadow plus progressively wider, fainter ones, so the
  // falloff is gradual instead of one dense slab (Quick Loop's).
  function shadow(w, dark, fade) {
    const k = (dark ? 1 : 0.45) * fade;
    return [[0.002, 0.006, 0.28], [0.008, 0.02, 0.2], [0.02, 0.05, 0.16], [0.045, 0.12, 0.12]]
      .map(([y, b, a]) => `0 ${w * y}px ${w * b}px rgba(0,0,0,${a * k})`);
  }

  // Fixed, seeded noise of about ±2 levels over the frame: breaks up the 8-bit
  // steps in dark shadows and glows that the encoder turns into bands. The same
  // seed every time, so every frame (and the Seam) carries the same noise. The
  // noise is made once per frame size and shared by every Shot's canvas.
  const noise = {};
  function dither(el, W, H) {
    const c = el.ownerDocument.createElement("canvas");
    c.width = W; c.height = H;
    c.style.cssText = "position:absolute;inset:0;pointer-events:none";
    const ctx = c.getContext("2d"), key = W + "x" + H;
    if (!noise[key]) {
      const img = ctx.createImageData(W, H), d = img.data;
      let seed = 1;
      for (let i = 0; i < d.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const v = seed >>> 24;
        d[i] = d[i + 1] = d[i + 2] = v & 1 ? 255 : 0; // white lifts, black lowers
        d[i + 3] = (v >> 1) % 10; // alpha 0..9 of 255
      }
      noise[key] = img;
    }
    ctx.putImageData(noise[key], 0, 0);
    el.appendChild(c);
  }

  // Builds the scene inside `el` (sized to the frame) and returns draw(state).
  // The Device frame's geometry (the browser bar, the phone's bezel) comes from the state's Surface.
  function mount(el, { frame, screen, settings }) {
    const backdrop = BACKDROPS[settings.backdrop];
    if (!backdrop) throw new Error(`CSS Renderer: Backdrop "${settings.backdrop}" isn't supported`);
    const { width: W, height: H } = frame;
    const { colour, css } = backdrop(settings.brandColour);
    const dark = lum(colour) < 0.5;
    const phone = settings.deviceFrame === "phone";
    const tiltTransform = TILTS[phone ? "phone" : "card"];
    Object.assign(el.style, { position: "absolute", left: 0, top: 0, width: W + "px", height: H + "px", overflow: "hidden" });

    div(el, `position:absolute;inset:0;background:${css}`);
    // The tilted layer: the face plus a transparent margin, turning about its centre.
    const surface = div(el, `position:absolute;padding:${MARGIN}px;transform-origin:50% 50%;backface-visibility:hidden`);
    surface.className = "pfs-surface";
    // The face clips and rounds the Surface. No background: one would leak through
    // the anti-aliased rounded corners as a light fringe (except the phone's body).
    const face = div(surface, "position:relative;overflow:hidden");
    // Browser Device frame: 2D window chrome, a bar with three window buttons (Quick Loop's).
    const bar = div(face, "position:absolute;left:0;right:0;top:0;display:none;align-items:center;box-sizing:border-box;background:#ececee");
    bar.className = "pfs-bar";
    const buttons = ["#ff5f57", "#febc2e", "#28c840"].map((c) => div(bar, `display:block;border-radius:50%;background:${c}`));
    // Edges that coincide flicker at sub-pixel zoom: each is anti-aliased on its
    // own, so a background under the Screen's edge shows as a light sliver. The
    // page white behind a short Screen stops 1px inside the edges. The Screen
    // shares the Surface's layer (no will-change).
    const viewport = div(face, "position:absolute;left:0;right:0;bottom:0;overflow:hidden");
    div(viewport, "position:absolute;inset:0 1px 1px;background:#fff");
    const img = el.ownerDocument.createElement("img");
    img.alt = "";
    img.className = "pfs-screen";
    img.src = screen.url;
    img.style.cssText = "position:absolute;left:0;top:0;display:block";
    viewport.appendChild(img);
    dither(el, W, H);

    // Phone Device frame: Nick's simple drawn shape (ticket 11), a near-black body
    // with a faint outer edge, and a thin grey ring round the Screen. Proportions
    // are shares of the body's width, measured from his drawing.
    function phoneStyle(g) {
      const w = g.width;
      Object.assign(face.style, {
        background: "#0a0a0a", borderRadius: w * 0.086 + "px",
        boxShadow: [`inset 0 0 0 ${Math.max(1, w * 0.0027)}px #262626`, ...shadow(w, dark, g.shadow)].join(", "),
      });
      Object.assign(viewport.style, {
        left: g.bezel + "px", right: g.bezel + "px", bottom: "auto", top: g.bezel + "px",
        borderRadius: w * 0.059 + "px", boxShadow: `0 0 0 ${Math.max(1, w * 0.0053)}px #404040`,
      });
    }

    return function draw(st) {
      const g = place(st, frame), bh = g.bar;
      Object.assign(surface.style, { left: g.left - MARGIN + "px", top: g.top - MARGIN + "px" });
      Object.assign(face.style, {
        width: g.width + "px", height: g.height + "px", borderRadius: g.radius + "px",
        boxShadow: [...shadow(g.width, dark, g.shadow), `0 0 0 1px rgba(${dark ? "255,255,255,0.06" : "0,0,0,0.06"})`].join(", "),
      });
      Object.assign(bar.style, { display: bh ? "flex" : "none", height: bh + "px", gap: bh * 0.3 + "px", paddingLeft: bh * 0.55 + "px", borderBottom: `${Math.max(1.5, bh / 20)}px solid #dcdce0` });
      for (const b of buttons) Object.assign(b.style, { width: bh * 0.36 + "px", height: bh * 0.36 + "px" });
      Object.assign(viewport.style, { top: bh + "px", height: g.viewportHeight + "px" });
      if (phone) phoneStyle(g);
      Object.assign(img.style, { width: g.imageWidth + "px", height: g.imageHeight + "px", transform: `translateY(${-g.scroll.toFixed(2)}px)` });
      surface.style.transform = st.tilt ? tiltTransform(st.tilt, g.perspective, st.surface) : "none";
    };
  }

  root.CssRenderer = { mount, place };
})(globalThis);
