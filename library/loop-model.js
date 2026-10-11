// Loop model: the scene state of a Loop at time t. Pure, no DOM, so it runs in
// the browser (a classic <script>, exposed as window.LoopModel) and in Node
// (imported for its side effect, read from globalThis.LoopModel).
// Layout, easing and focus moves are lifted from Quick Loop (tools/quick-loop/composition.html).
//
// A Loop is { frame, screen, shots }. screen is { w, h } in image px, plus
// optional Focus areas from its sidecar: { layoutWidth, areas: { name: {x,y,w,h} } }
// in 1x px at layoutWidth. A Shot is { template, start, duration, params, cut }.
// State is { scroll, zoom, cx, cy, tilt, surface }: the Camera puts frame point
// (cx, cy) at the frame's centre, scaled by zoom.
(function (root) {
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const clamp01 = (x) => clamp(x, 0, 1);
  const KEYS = ["scroll", "zoom", "cx", "cy", "tilt"];

  const TILT = 8; // degrees at full tilt, as Quick Loop
  const PUSH = 1.08; // zoom factor of a Hold's push in or pull out
  const SIDEWAYS = 0.05; // two areas closer than this share of the viewport's height in scroll are side by side

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

  // A Focus area in Surface px, and the scroll that centres it in the viewport (Quick Loop's fs).
  function area(name, screen, s) {
    if (name === "whole") return null;
    const box = screen.areas && screen.areas[name];
    if (!box) throw new Error(`Unknown Focus area "${name}"`);
    const k = s.width / (screen.layoutWidth || screen.w);
    return { x: box.x * k, y: box.y * k, w: box.w * k, h: box.h * k };
  }
  const scrollTo = (a, s) => (a ? clamp(a.y + a.h / 2 - s.viewportHeight / 2, 0, s.maxScroll) : 0);

  // The settled framing of an area: scrolled to it, no zoom or tilt, Camera on the frame's centre.
  const framing = (a, s, frame) => ({ scroll: scrollTo(a, s), zoom: 1, cx: frame.width / 2, cy: frame.height / 2, tilt: 0 });

  // The area's centre in frame px at a given scroll (on the Surface's centre for `whole`).
  const centreOf = (a, s, scroll) => a
    ? { x: s.left + a.x + a.w / 2, y: s.top + clamp(a.y + a.h / 2 - scroll, 0, s.viewportHeight) }
    : { x: s.left + s.width / 2, y: s.top + s.height / 2 };

  // Scales the Camera by f about frame point p, keeping p where it is on screen.
  const scaleAbout = (st, p, f) => ({ ...st, zoom: st.zoom * f, cx: p.x - (p.x - st.cx) / f, cy: p.y - (p.y - st.cy) / f });

  // Hold: stays on one Focus area with one slow move. Opens on `from` (the previous
  // Shot's closing state) or, after a cut, on its own opening for the move.
  const MOVES = {
    "push-in": { open: (st) => st, close: (st, p) => scaleAbout(st, p, PUSH) },
    "pull-out": { open: (st, p) => scaleAbout(st, p, PUSH), close: (st, p) => scaleAbout(st, p, 1 / PUSH) },
    "tilt-settle": { open: (st) => ({ ...st, tilt: TILT }), close: (st) => ({ ...st, tilt: 0 }) },
  };
  function hold(params, s, frame, screen, from) {
    const a = area(params.focus || "whole", screen, s);
    const move = MOVES[params.move || "push-in"];
    if (!move) throw new Error(`Hold: unknown move "${params.move}"`);
    const base = framing(a, s, frame);
    const p = centreOf(a, s, from ? from.scroll : base.scroll);
    const open = from || move.open(base, p);
    return [[0, open], [1, move.close(open, p)]];
  }

  // Scroll: moves down or up the Screen to land on a Focus area, optionally
  // zooming in on it (Quick Loop's "end" focus move: scroll, then zoom, then settle).
  function scroll(params, s, frame, screen, from) {
    if (!params.to) throw new Error("Scroll: no Focus area to land on (`to`)");
    const a = area(params.to, screen, s);
    const open = from || framing(area(params.from || "whole", screen, s), s, frame);
    const landed = { ...framing(a, s, frame), tilt: open.tilt };
    const zoom = params.zoom === true || params.zoom === "true";
    if (!zoom || !a) return [[0, open], [0.85, landed], [1, landed]];
    const { width: W, height: H } = frame;
    const fh = Math.min(a.h, s.viewportHeight);
    const Z = clamp(Math.min((W * 0.72) / a.w, (H * 0.72) / fh), 1, 2.5);
    const c = centreOf(a, s, landed.scroll);
    const close = { ...landed, zoom: Z, cx: c.x, cy: c.y, tilt: 0 };
    return [[0, open], [0.55, { ...landed, tilt: open.tilt / 2 }], [0.85, close], [1, close]];
  }
  const TEMPLATES = { hold, scroll };

  // Keyframes [fraction, state] of every Shot, in start order. Each Shot opens on
  // the previous Shot's closing state unless it has `cut`. A closing state doesn't
  // depend on duration, so this chain doesn't either.
  function plan(loop) {
    const s = layout(loop.frame, loop.screen);
    const shots = [...loop.shots].sort((a, b) => a.start - b.start);
    let prev = null;
    return shots.map((shot) => {
      const template = TEMPLATES[shot.template];
      if (!template) throw new Error(`Unknown Shot template "${shot.template}"`);
      const keys = template(shot.params || {}, s, loop.frame, loop.screen, shot.cut ? null : prev);
      prev = keys[keys.length - 1][1];
      return { shot, keys, surface: s };
    });
  }

  // State of one planned Shot at its local time; its moves are fractions of its own duration.
  function stateIn({ shot, keys, surface }, localT) {
    const k = shot.duration > 0 ? clamp01(localT / shot.duration) : 1;
    let i = 0;
    while (i < keys.length - 2 && k > keys[i + 1][0]) i++;
    const [ka, a] = keys[i], [kb, b] = keys[i + 1];
    const u = kb > ka ? ease(clamp01((k - ka) / (kb - ka))) : 1;
    const st = { surface };
    for (const key of KEYS) st[key] = lerp(a[key], b[key], u);
    return st;
  }

  // State of the Shot at `index` (in start order) at its local time.
  const shotAt = (loop, index, localT) => stateIn(plan(loop)[index], localT);

  // State of a Loop at time t: the Shot playing at t (the last one that has started).
  function sceneAt(loop, t) {
    const planned = plan(loop);
    const p = planned.filter((x) => x.shot.start <= t).pop() || planned[0];
    return stateIn(p, t - p.shot.start);
  }

  // Shots from a Focus path: `→` (or `->`) moves within a Shot, `/` cuts to the
  // next. A lone area is a Hold; each move along the Screen to another area is a
  // Scroll. A move between areas that needs no scrolling (side by side) is
  // rejected: v1 has no sideways move.
  function inferShots(path, frame, screen) {
    const s = layout(frame, screen);
    const shots = [];
    path.split("/").forEach((segment, i) => {
      const names = segment.split(/→|->/).map((n) => n.trim());
      if (names.some((n) => !n)) throw new Error(`Focus path "${path}": empty area name`);
      const at = names.map((n) => scrollTo(area(n, screen, s), s));
      const cut = i > 0;
      if (names.length === 1) return shots.push({ template: "hold", params: { focus: names[0] }, cut });
      for (let j = 1; j < names.length; j++) {
        const [from, to] = [names[j - 1], names[j]];
        const params = { from, to };
        const c = cut && j === 1;
        if (from === to) shots.push({ template: "hold", params: { focus: to }, cut: c });
        else if (Math.abs(at[j] - at[j - 1]) < SIDEWAYS * s.viewportHeight)
          throw new Error(`Focus path "${path}": "${from}" → "${to}" is a sideways move with no scroll, which v1 can't do. Cut between them ("${from} / ${to}") or Hold on one.`);
        else shots.push({ template: "scroll", params, cut: c });
      }
    });
    return shots;
  }

  root.LoopModel = { layout, plan, stateIn, shotAt, sceneAt, inferShots, KEYS };
})(globalThis);
