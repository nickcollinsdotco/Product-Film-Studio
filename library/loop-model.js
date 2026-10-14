// Loop model: the scene state of a Loop at time t. Pure, no DOM, so it runs in
// the browser (a classic <script>, exposed as window.LoopModel) and in Node
// (imported for its side effect, read from globalThis.LoopModel).
// Layout, easing and focus moves are lifted from Quick Loop (tools/quick-loop/composition.html).
//
// A Loop is { frame, screen, shots, deviceFrame, tilt } (deviceFrame is "none"
// unless given; tilt, in degrees, is held for the Loop's whole length, 0 unless
// given). screen is { w, h } in image px, plus optional Focus areas from its
// sidecar: { layoutWidth, areas: { name: {x,y,w,h} } } in 1x px at layoutWidth. A Shot is { template, start, duration, params, cut }.
// State is { scroll, zoom, cx, cy, tilt, surface }: the Camera puts frame point
// (cx, cy) at the frame's centre, scaled by zoom.
(function (root) {
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const clamp01 = (x) => clamp(x, 0, 1);
  const KEYS = ["scroll", "zoom", "cx", "cy", "tilt"];

  const TILT = 8; // degrees at full tilt, as Quick Loop
  const MAX_TILT = 20; // beyond this a flat Surface reads as cardboard (ticket 11)
  const PUSH = 1.08; // zoom factor of a Hold's push in or pull out
  const SETTLE = 0.4, MIN_SETTLE = 1; // a push-settle's still tail: this share of its Shot, and never under 1s (seconds)
  const SIDEWAYS = 0.05; // two areas closer than this share of the viewport's height in scroll are side by side

  // Surface geometry for a Frame size, Screen and Device frame (Quick Loop's card
  // layout). The card is 72% of the frame's width and at most 84% of its height,
  // with a 16:10 viewport; a browser frame adds its bar above the viewport. In
  // portrait ratios a browser frame's viewport grows to fill the height (Quick
  // Loop's fill) while the page keeps its desktop width: the Screen is scaled
  // to the card's width, never reflowed. A filled Surface is wider (FILLED_WIDTH),
  // so a desktop page's type isn't tiny in a tall frame (ticket 09).
  // A phone frame (ticket 11) is a body round a 9:19.5 viewport, inset by its
  // bezel on every side, 76% of the frame's height unless 72% of the width is
  // narrower: shorter than a card, so a pushed-in phone keeps a margin. A tilted
  // phone also turns in the frame (`turn` degrees per degree of tilt, drawn by
  // the CSS Renderer), so it is sized to fit the frame turned at full tilt.
  // left, top, width and height are the viewport's, where the Screen shows;
  // bounds are the whole Surface's, Device frame (bar or bezel) included.
  const WIDTH = 0.72, FILLED_WIDTH = 0.88; // the Surface's share of the frame's width
  const BAR = { none: () => 0, browser: (w) => Math.round(Math.max(24, w * 0.026)), phone: () => 0 };
  const PHONE = 19.5 / 9; // the phone's viewport aspect (h / w)
  const BEZEL = 22 / 710; // the bezel, as a share of the viewport's width (Nick's drawn shape)
  const PHONE_HEIGHT = 0.76; // the phone's largest share of the frame's height
  const PHONE_TURN = 1.4; // in-plane degrees per degree of tilt
  const PHONE_TURNED = 0.88; // share of the frame a phone turned at full tilt may fill // the phone's viewport aspect (h / w), and its bezel as a share of the viewport's width (Nick's drawn shape)
  function layout(frame, screen, deviceFrame = "none") {
    const barH = BAR[deviceFrame];
    if (!barH) throw new Error(`Device frame "${deviceFrame}" isn't supported`);
    const { width: W, height: H } = frame;
    const maxH = H * 0.84;
    let cw, vh, bezel = 0, turn = 0;
    if (deviceFrame === "phone") {
      const aspect = (PHONE + 2 * BEZEL) / (1 + 2 * BEZEL), turned = (MAX_TILT * PHONE_TURN * Math.PI) / 180; // the body's h / w; its largest turn in radians
      const [cos, sin] = [Math.cos(turned), Math.sin(turned)];
      const bw = Math.min(W * WIDTH, (H * PHONE_HEIGHT) / aspect, (PHONE_TURNED * W) / (cos + aspect * sin), (PHONE_TURNED * H) / (aspect * cos + sin));
      cw = bw / (1 + 2 * BEZEL); vh = cw * PHONE; bezel = cw * BEZEL; turn = PHONE_TURN;
    } else {
      const fill = deviceFrame === "browser" && H > W;
      // A filled viewport is never taller than the Screen, so a short Screen leaves no blank page.
      const height = (w) => (fill ? Math.min(maxH - barH(w), screen.h * w / screen.w) : w / (16 / 10));
      cw = W * (fill ? FILLED_WIDTH : WIDTH); vh = height(cw);
      if (vh + barH(cw) > maxH) { // too tall for the frame: shrink width to fit
        const k = maxH / (vh + barH(cw)); cw *= k; vh = height(cw);
      }
    }
    const bar = barH(cw), bw = cw + 2 * bezel, bh = vh + bar + 2 * bezel;
    const bounds = { left: (W - bw) / 2, top: (H - bh) / 2, width: bw, height: bh };
    const imageHeight = screen.h * cw / screen.w; // the same expression as a filled viewport's, so they match exactly
    return {
      width: cw, height: vh, left: bounds.left + bezel, top: bounds.top + bar + bezel, bounds, bar, bezel, turn,
      viewportHeight: vh, imageHeight, maxScroll: Math.max(0, imageHeight - vh),
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

  // A Shot's `tilt` parameter in degrees, within ±MAX_TILT; `fallback` when not given.
  function tiltOf(params, fallback) {
    if (params.tilt == null || params.tilt === "") return fallback;
    const t = Number(params.tilt);
    if (!(Math.abs(t) <= MAX_TILT)) throw new Error(`tilt must be between -${MAX_TILT} and ${MAX_TILT} degrees, not ${params.tilt}`);
    return t;
  }

  // The close-up of an area from its settled framing `landed`: the zoom fits the
  // area within `fill` (0 to 1) of the frame's width and height, by default the
  // Surface's own width, and the Camera aims at it as far as the Surface allows.
  function closeUp(a, s, frame, landed, fillParam, who) {
    const { width: W, height: H } = frame;
    const fh = Math.min(a.h, s.viewportHeight);
    const fill = fillParam == null || fillParam === "" ? WIDTH : Number(fillParam);
    if (!(fill > 0 && fill <= 1)) throw new Error(`${who}: fill must be above 0 and at most 1, not ${fillParam}`);
    const Z = clamp(Math.min((W * fill) / a.w, (H * fill) / fh), 1, 2.5);
    const c = centreOf(a, s, landed.scroll);
    const b = s.bounds;
    return { ...landed, zoom: Z, cx: cameraOn(c.x, b.left, b.width, W, Z), cy: cameraOn(c.y, b.top, b.height, H, Z), tilt: 0 };
  }

  // Hold's close-up moves (the motion rule, ADR-0012 as amended; vr-loops 03).
  // push-settle pushes in from the area's framing to its close-up, then stays
  // still on it for the Shot's last SETTLE share, never under MIN_SETTLE seconds;
  // the push keeps at least a quarter of the Shot, so a Shot too short for both
  // is rejected. return goes back from the close-up to the framing. A Bookend is
  // a push-settle then a return.
  const MIN_PUSH = 0.25;
  function settleShare(d) {
    const share = Math.max(SETTLE, MIN_SETTLE / d);
    if (!(share <= 1 - MIN_PUSH)) throw new Error(`Hold: a push-settle needs at least ${+(MIN_SETTLE / (1 - MIN_PUSH)).toFixed(2)}s to push in and settle for ${MIN_SETTLE}s, not ${d}s`);
    return share;
  }
  const CLOSE_UPS = {
    "push-settle": (base, near, from, d) => [[0, from || base], [1 - settleShare(d), near], [1, near]],
    return: (base, near, from) => [[0, from || near], [1, base]],
  };

  // Hold: stays on one Focus area with one slow move. Opens on `from` (the previous
  // Shot's closing state) or, after a cut, on its own opening for the move.
  const MOVES = {
    "push-in": { open: (st) => st, close: (st, p) => scaleAbout(st, p, PUSH) },
    "pull-out": { open: (st, p) => scaleAbout(st, p, PUSH), close: (st, p) => scaleAbout(st, p, 1 / PUSH) },
    "tilt-settle": { open: (st, p, tilt) => ({ ...st, tilt }), close: (st) => ({ ...st, tilt: 0 }) },
  };
  function hold(params, s, frame, screen, from, duration) {
    const a = area(params.focus || "whole", screen, s);
    const base = framing(a, s, frame);
    const closeUpMove = CLOSE_UPS[params.move];
    if (closeUpMove) {
      if (!a) throw new Error(`Hold: ${params.move} needs a Focus area to push in on, not "whole"`);
      return closeUpMove(base, closeUp(a, s, frame, base, params.fill, "Hold"), from, duration);
    }
    const move = MOVES[params.move || "push-in"];
    if (!move) throw new Error(`Hold: unknown move "${params.move}"`);
    const p = centreOf(a, s, from ? from.scroll : base.scroll);
    const open = from || move.open(base, p, tiltOf(params, TILT));
    return [[0, open], [1, move.close(open, p)]];
  }

  // The Camera centre on one axis (frame px) that aims at c at zoom Z as far as
  // the Surface (start, length) allows (ticket 09): a Surface that fits the frame
  // once zoomed stays inside it, and one that doesn't keeps its edges outside it,
  // so a wide area near the top of a tall Surface leaves no block of Backdrop above.
  function cameraOn(c, start, length, size, Z) {
    const half = size / (2 * Z), a = start + half, b = start + length - half;
    return clamp(c, Math.min(a, b), Math.max(a, b));
  }

  // Scroll: moves down or up the Screen to land on a Focus area, optionally
  // zooming in on it (Quick Loop's "end" focus move: scroll, then zoom, then settle).
  // It lands upright: opening on a `tilt` (when it opens on its own, as `from`
  // does), the tilt eases out while the page scrolls (the Steel Hat phone move).
  // The zoom fits the area within `fill` (0 to 1) of the frame's width and height;
  // by default the Surface's own width, so an area as wide as the page barely zooms.
  function scroll(params, s, frame, screen, from) {
    if (!params.to) throw new Error("Scroll: no Focus area to land on (`to`)");
    const a = area(params.to, screen, s);
    const tilt = tiltOf(params, 0);
    const open = from || { ...framing(area(params.from || "whole", screen, s), s, frame), tilt };
    const landed = framing(a, s, frame);
    const zoom = params.zoom === true || params.zoom === "true";
    if (!zoom || !a) return [[0, open], [0.85, landed], [1, landed]];
    const close = closeUp(a, s, frame, landed, params.fill, "Scroll");
    return [[0, open], [0.55, { ...landed, tilt: open.tilt / 2 }], [0.85, close], [1, close]];
  }
  const TEMPLATES = { hold, scroll };

  // Keyframes [fraction, state] of every Shot, in start order. Each Shot opens on
  // the previous Shot's closing state unless it has `cut`. A closing state doesn't
  // depend on duration, so this chain doesn't either. Shots tilt relative to the
  // Loop's tilt, which is added last, so a Loop held at 8° settles at 8°.
  function plan(loop) {
    const s = layout(loop.frame, loop.screen, loop.deviceFrame);
    const shots = [...loop.shots].sort((a, b) => a.start - b.start);
    const loopTilt = tiltOf({ tilt: loop.tilt }, 0);
    let prev = null;
    return shots.map((shot) => {
      const template = TEMPLATES[shot.template];
      if (!template) throw new Error(`Unknown Shot template "${shot.template}"`);
      const keys = template(shot.params || {}, s, loop.frame, loop.screen, shot.cut ? null : prev, shot.duration);
      prev = keys[keys.length - 1][1];
      const tilted = keys.map(([k, st]) => [k, { ...st, tilt: st.tilt + loopTilt }]);
      const over = tilted.find(([, st]) => Math.abs(st.tilt) > MAX_TILT);
      if (over) throw new Error(`tilt ${over[1].tilt}° (the Loop's ${loopTilt}° plus a Shot's) is beyond ${MAX_TILT}° either way`);
      return { shot, keys: tilted, surface: s };
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
  function inferShots(path, frame, screen, deviceFrame) {
    const s = layout(frame, screen, deviceFrame);
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

  // Seam check (Bookends only; ADR-0011 as amended, the v1 spec). Three checks on
  // scene state at t = 0, Δ, D − Δ and D, with Δ one frame at `fps`: nothing more,
  // no general motion analysis. Passing is a state-based approximation, not proof
  // that the Seam looks smooth; the t = D | t = 0 image is reviewed by eye too.
  // - Pose: state(D) == state(0) exactly.
  // - Movement continuity: state(D) − state(D − Δ) equals state(Δ) − state(0)
  //   within TOLERANCE; both are zero when the Seam is at rest.
  // - Duplicate frame: state(D − Δ) == state(0) fails only while the Seam is in
  //   motion (state(Δ) ≠ state(0)); a still hold across the Seam passes.
  // "Equal" and "≠" in the last two use TOLERANCE, so an ease's last few millionths
  // of a pixel count as rest. Angles (ANGULAR) differ by their shortest signed
  // difference modulo 360°, so −180° and 180° are equal.
  const ANGULAR = new Set(["tilt"]);
  const TOLERANCE = { scroll: 0.01, cx: 0.01, cy: 0.01, tilt: 0.01, zoom: 1e-4 }; // per frame: px, px, px, degrees, zoom factor
  const diff = (key, a, b) => {
    const d = a - b;
    return ANGULAR.has(key) ? ((((d + 180) % 360) + 360) % 360) - 180 : d;
  };
  const near = (key, d) => Math.abs(d) <= TOLERANCE[key];

  function seamCheck(stateAt, { duration: D, fps }) {
    if (!(D > 0) || !(fps > 0)) throw new Error("Seam check: needs a duration and a frame rate");
    const dt = 1 / fps;
    const [s0, s1, sEnd1, sEnd] = [0, dt, D - dt, D].map(stateAt);
    const fmt = (x) => +x.toFixed(4);
    const failures = [];
    const inMotion = KEYS.some((k) => !near(k, diff(k, s1[k], s0[k])));
    const checks = { pose: true, continuity: true, duplicate: true };
    for (const k of KEYS) {
      if (diff(k, sEnd[k], s0[k]) !== 0) {
        checks.pose = false;
        failures.push(`pose: ${k} is ${fmt(sEnd[k])} at t = D but ${fmt(s0[k])} at t = 0`);
      }
      const vin = diff(k, sEnd[k], sEnd1[k]), vout = diff(k, s1[k], s0[k]);
      if (!near(k, diff(k, vin, vout))) {
        checks.continuity = false;
        failures.push(`continuity: ${k} moves ${fmt(vin)} per frame into the Seam but ${fmt(vout)} out of it`);
      }
    }
    if (inMotion && KEYS.every((k) => near(k, diff(k, sEnd1[k], s0[k])))) {
      checks.duplicate = false;
      failures.push("duplicate frame: frame D − Δ repeats frame 0 while the Seam is in motion");
    }
    return { pass: failures.length === 0, checks, inMotion, failures };
  }

  // The Seam check of a Loop at a frame rate. D is the Loop's duration (the end of its last Shot unless given).
  const seamOf = (loop, { fps, duration } = {}) =>
    seamCheck((t) => sceneAt(loop, t), { fps, duration: duration ?? Math.max(...loop.shots.map((s) => s.start + s.duration)) });

  root.LoopModel = { layout, plan, stateIn, shotAt, sceneAt, inferShots, seamCheck, seamOf, KEYS };
})(globalThis);
