// Library: CSS 3D Primitives that emit native GSAP tweens on DOM elements.
const DOF_K = 10 / 700; // px of blur per unit of depth error

const camera = {
  pushIn(tl, { rig = "#camera", from = 0, to, at, duration, ease = "power2.inOut" }) {
    tl.fromTo(rig, { z: from }, { z: to, duration, ease }, at);
  },
};

const surface = {
  // Rack focus from one depth to another. Blur per surface is computed
  // analytically: k * |depth - focus|. Exact only while no surface lies
  // strictly between from and to (|x| is not linear across zero).
  focus(tl, { surfaces, from, to, at, duration, ease = "power2.inOut" }) {
    for (const s of surfaces) {
      const b0 = DOF_K * Math.abs(s.depth - from);
      const b1 = DOF_K * Math.abs(s.depth - to);
      tl.fromTo(s.el, { filter: "blur(" + b0 + "px)" }, { filter: "blur(" + b1 + "px)", duration, ease }, at);
    }
  },
};
