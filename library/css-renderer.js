// CSS Renderer: draws Loop model scene state into the DOM. Exposed as window.CssRenderer.
// Paint and seek lifted from Quick Loop (tools/quick-loop/composition.html).
(function (root) {
  const lum = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255;
  };
  const div = (parent, css) => {
    const el = parent.ownerDocument.createElement("div");
    el.style.cssText = css;
    parent.appendChild(el);
    return el;
  };

  // Builds the scene inside `el` (sized to the frame) and returns draw(state).
  function mount(el, { frame, screen, settings }) {
    if (settings.backdrop !== "brand") throw new Error(`CSS Renderer: Backdrop "${settings.backdrop}" isn't supported yet`);
    if (settings.deviceFrame !== "none") throw new Error(`CSS Renderer: Device frame "${settings.deviceFrame}" isn't supported yet`);
    const { width: W, height: H } = frame;
    const dark = lum(settings.brandColour) < 0.5;
    Object.assign(el.style, { position: "absolute", left: 0, top: 0, width: W + "px", height: H + "px", overflow: "hidden" });

    div(el, `position:absolute;inset:0;background:${settings.brandColour}`);
    const camera = div(el, "position:absolute;left:0;top:0;transform-origin:0 0");
    camera.className = "pfs-camera";
    const surface = div(camera, "position:absolute;overflow:hidden;background:#fff;transform-origin:50% 50%;backface-visibility:hidden");
    surface.className = "pfs-surface";
    const img = el.ownerDocument.createElement("img");
    img.alt = "";
    img.className = "pfs-screen";
    img.src = screen.url;
    img.style.cssText = "position:absolute;left:0;top:0;display:block;will-change:transform";
    surface.appendChild(img);

    let laidOut = null;
    function place(c) {
      Object.assign(surface.style, {
        left: c.left + "px", top: c.top + "px", width: c.width + "px", height: c.height + "px",
        borderRadius: 14 * (c.width / 1400) + "px",
        boxShadow: `0 ${c.width * 0.03}px ${c.width * 0.08}px rgba(0,0,0,${dark ? 0.55 : 0.22}), 0 0 0 1px rgba(${dark ? "255,255,255,0.06" : "0,0,0,0.06"})`,
      });
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
