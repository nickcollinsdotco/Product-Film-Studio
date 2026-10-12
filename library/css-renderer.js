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

  // Builds the scene inside `el` (sized to the frame) and returns draw(state).
  // The Device frame's geometry (the browser bar) comes from the state's Surface.
  function mount(el, { frame, screen, settings }) {
    const backdrop = BACKDROPS[settings.backdrop];
    if (!backdrop) throw new Error(`CSS Renderer: Backdrop "${settings.backdrop}" isn't supported`);
    const { width: W, height: H } = frame;
    const { colour, css } = backdrop(settings.brandColour);
    const dark = lum(colour) < 0.5;
    Object.assign(el.style, { position: "absolute", left: 0, top: 0, width: W + "px", height: H + "px", overflow: "hidden" });

    div(el, `position:absolute;inset:0;background:${css}`);
    const camera = div(el, "position:absolute;left:0;top:0;transform-origin:0 0");
    camera.className = "pfs-camera";
    const surface = div(camera, "position:absolute;overflow:hidden;background:#fff;transform-origin:50% 50%;backface-visibility:hidden");
    surface.className = "pfs-surface";
    // Browser Device frame: 2D window chrome, a bar with three window buttons (Quick Loop's).
    const bar = div(surface, "position:absolute;left:0;right:0;top:0;display:none;align-items:center;box-sizing:border-box;background:#ececee;border-bottom:1px solid #dcdce0");
    bar.className = "pfs-bar";
    const buttons = ["#ff5f57", "#febc2e", "#28c840"].map((c) => div(bar, `display:block;border-radius:50%;background:${c}`));
    const viewport = div(surface, "position:absolute;left:0;right:0;bottom:0;overflow:hidden");
    const img = el.ownerDocument.createElement("img");
    img.alt = "";
    img.className = "pfs-screen";
    img.src = screen.url;
    img.style.cssText = "position:absolute;left:0;top:0;display:block;will-change:transform";
    viewport.appendChild(img);

    let laidOut = null;
    function place(c) {
      const b = c.bounds, bh = c.bar;
      Object.assign(surface.style, {
        left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px",
        borderRadius: 14 * (b.width / 1400) + "px",
        boxShadow: `0 ${b.width * 0.03}px ${b.width * 0.08}px rgba(0,0,0,${dark ? 0.55 : 0.22}), 0 0 0 1px rgba(${dark ? "255,255,255,0.06" : "0,0,0,0.06"})`,
      });
      Object.assign(bar.style, { display: bh ? "flex" : "none", height: bh + "px", gap: bh * 0.3 + "px", paddingLeft: bh * 0.55 + "px" });
      for (const b of buttons) Object.assign(b.style, { width: bh * 0.36 + "px", height: bh * 0.36 + "px" });
      Object.assign(viewport.style, { top: bh + "px", height: c.viewportHeight + "px" });
      Object.assign(img.style, { width: c.width + "px", height: c.imageHeight + "px" });
      laidOut = c;
    }

    return function draw(st) {
      if (laidOut !== st.surface) place(st.surface);
      img.style.transform = `translate3d(0, ${-st.scroll.toFixed(2)}px, 0)`;
      const tilt = st.tilt;
      surface.style.transform = tilt ? `perspective(${W * 1.6}px) rotateX(${tilt * 0.9}deg) rotateY(${-tilt}deg) rotateZ(${tilt * 0.12}deg)` : "none";
      camera.style.transform = st.zoom !== 1 || st.cx !== W / 2 || st.cy !== H / 2
        ? `translate(${W / 2}px, ${H / 2}px) scale(${st.zoom}) translate(${-st.cx}px, ${-st.cy}px)`
        : "none";
    };
  }

  root.CssRenderer = { mount };
})(globalThis);
