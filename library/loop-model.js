// Loop model: the scene state of a Loop at time t. Pure, no DOM, so it runs in
// the browser (a classic <script>, exposed as window.LoopModel) and in Node
// (imported for its side effect, read from globalThis.LoopModel).
// Layout and easing are lifted from Quick Loop (tools/quick-loop/composition.html).
(function (root) {
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  const TILT = 8; // degrees at full tilt, as Quick Loop
  const PUSH = 1.08; // zoom at the tight end of a Hold's push in or pull out

  // Surface geometry for a Frame size and Screen (Quick Loop's card layout, no Device frame).
  function layout(frame, screen) {
    const { width: W, height: H } = frame;
    const aspect = 16 / 10, maxH = H * 0.84;
    let cw = W * 0.72, vh = cw / aspect;
    if (vh > maxH) { cw *= maxH / vh; vh = maxH; }
    const scale = cw / screen.w;
    return {
      width: cw, height: vh, left: (W - cw) / 2, top: (H - vh) / 2,
      viewportHeight: vh, imageHeight: screen.h * scale, maxScroll: Math.max(0, screen.h * scale - vh),
    };
  }

  // Hold: stays on one Focus area with one slow move across the whole Shot.
  // Only the built-in `whole` area for now: the top of the Screen, Camera on the Surface's centre.
  const MOVES = {
    "push-in": (u) => ({ zoom: lerp(1, PUSH, u), tilt: 0 }),
    "pull-out": (u) => ({ zoom: lerp(PUSH, 1, u), tilt: 0 }),
    "tilt-settle": (u) => ({ zoom: 1, tilt: lerp(TILT, 0, u) }),
  };
  function hold(params, k, surface) {
    if ((params.focus || "whole") !== "whole") throw new Error(`Hold: unknown Focus area "${params.focus}"`);
    const move = MOVES[params.move || "push-in"];
    if (!move) throw new Error(`Hold: unknown move "${params.move}"`);
    return { scroll: 0, cx: surface.left + surface.width / 2, cy: surface.top + surface.height / 2, ...move(ease(k)) };
  }
  const TEMPLATES = { hold };

  // State of one Shot at its local time; its moves are fractions of its own duration.
  function shotState(shot, localT, frame, screen) {
    const surface = layout(frame, screen);
    const template = TEMPLATES[shot.template];
    if (!template) throw new Error(`Unknown Shot template "${shot.template}"`);
    const k = shot.duration > 0 ? clamp01(localT / shot.duration) : 1;
    return { ...template(shot.params || {}, k, surface), surface };
  }

  // State of a Loop at time t: the Shot playing at t (the last one that has started).
  function sceneAt(loop, t) {
    const shots = [...loop.shots].sort((a, b) => a.start - b.start);
    const shot = shots.filter((s) => s.start <= t).pop() || shots[0];
    return shotState(shot, t - shot.start, loop.frame, loop.screen);
  }

  root.LoopModel = { layout, shotState, sceneAt };
})(globalThis);
