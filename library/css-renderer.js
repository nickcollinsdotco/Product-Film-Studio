// CSS Renderer: draws Loop model scene state into the DOM. Exposed as window.CssRenderer.
// Paint and seek lifted from Quick Loop (tools/quick-loop/composition.html).
(function (root) {
  const rgbOf = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };
  const lum = (hex) => {
    const [r, g, b] = rgbOf(hex);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
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
  const TILTS = {
    card: (t, W) => `perspective(${W * 1.6}px) rotateX(${t * 0.9}deg) rotateY(${-t}deg) rotateZ(${t * 0.12}deg)`,
    phone: (t, W, c) => `perspective(${W * 1.6}px) rotateX(${t * 0.5}deg) rotateY(${-t * 0.8}deg) rotateZ(${t * c.turn}deg)`,
  };

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
    const camera = div(el, "position:absolute;left:0;top:0;transform-origin:0 0");
    camera.className = "pfs-camera";
    const surface = div(camera, "position:absolute;overflow:hidden;transform-origin:50% 50%;backface-visibility:hidden");
    surface.className = "pfs-surface";
    // Browser Device frame: 2D window chrome, a bar with three window buttons (Quick Loop's).
    const bar = div(surface, "position:absolute;left:0;right:0;top:0;display:none;align-items:center;box-sizing:border-box;background:#ececee");
    bar.className = "pfs-bar";
    const buttons = ["#ff5f57", "#febc2e", "#28c840"].map((c) => div(bar, `display:block;border-radius:50%;background:${c}`));
    // Edges that coincide flicker at sub-pixel zoom: each is anti-aliased on its
    // own, so a background under the Screen's edge shows as a light sliver. The
    // Surface has no background; the page white behind a short Screen stops 1px
    // inside the edges. The Screen shares the Surface's layer (no will-change).
    const viewport = div(surface, "position:absolute;left:0;right:0;bottom:0;overflow:hidden");
    div(viewport, "position:absolute;inset:0 1px 1px;background:#fff");
    const img = el.ownerDocument.createElement("img");
    img.alt = "";
    img.className = "pfs-screen";
    img.src = screen.url;
    img.style.cssText = "position:absolute;left:0;top:0;display:block";
    viewport.appendChild(img);

    // Phone Device frame: Nick's simple drawn shape (ticket 11), a near-black body
    // with a faint outer edge, and a thin grey ring round the Screen. Proportions
    // are shares of the body's width, measured from his drawing.
    function phoneStyle(b, c) {
      const w = b.width;
      Object.assign(surface.style, {
        background: "#0a0a0a", borderRadius: w * 0.086 + "px",
        boxShadow: `inset 0 0 0 ${Math.max(1, w * 0.0027)}px #262626, 0 ${w * 0.04}px ${w * 0.12}px rgba(0,0,0,${dark ? 0.55 : 0.28})`,
      });
      Object.assign(viewport.style, {
        left: c.bezel + "px", right: c.bezel + "px", bottom: "auto", top: c.bezel + "px",
        borderRadius: w * 0.059 + "px", boxShadow: `0 0 0 ${Math.max(1, w * 0.0053)}px #404040`,
      });
    }

    let laidOut = null;
    function place(c) {
      const b = c.bounds, bh = c.bar;
      Object.assign(surface.style, {
        left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px",
        borderRadius: 14 * (b.width / 1400) + "px",
        boxShadow: `0 ${b.width * 0.03}px ${b.width * 0.08}px rgba(0,0,0,${dark ? 0.55 : 0.22}), 0 0 0 1px rgba(${dark ? "255,255,255,0.06" : "0,0,0,0.06"})`,
      });
      Object.assign(bar.style, { display: bh ? "flex" : "none", height: bh + "px", gap: bh * 0.3 + "px", paddingLeft: bh * 0.55 + "px", borderBottom: `${Math.max(1.5, bh / 20)}px solid #dcdce0` });
      for (const b of buttons) Object.assign(b.style, { width: bh * 0.36 + "px", height: bh * 0.36 + "px" });
      Object.assign(viewport.style, { top: bh + "px", height: c.viewportHeight + "px" });
      if (phone) phoneStyle(b, c);
      Object.assign(img.style, { width: c.width + "px", height: c.imageHeight + "px" });
      laidOut = c;
    }

    return function draw(st) {
      if (laidOut !== st.surface) place(st.surface);
      img.style.transform = `translateY(${-st.scroll.toFixed(2)}px)`;
      const tilt = st.tilt;
      surface.style.transform = tilt ? tiltTransform(tilt, W, st.surface) : "none";
      camera.style.transform = st.zoom !== 1 || st.cx !== W / 2 || st.cy !== H / 2
        ? `translate(${W / 2}px, ${H / 2}px) scale(${st.zoom}) translate(${-st.cx}px, ${-st.cy}px)`
        : "none";
    };
  }

  root.CssRenderer = { mount };
})(globalThis);
