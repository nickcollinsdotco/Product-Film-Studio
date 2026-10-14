// Seam 1: the Loop model. Pure scene state, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../../../library/loop-model.js";

const { sceneAt, shotAt, inferShots, KEYS } = globalThis.LoopModel;

const screen = { w: 1440, h: 2400 };
const frame = { width: 1600, height: 900 };
const loopOf = (duration, move) => ({
  frame, screen,
  shots: [{ template: "hold", start: 0, duration, params: { focus: "whole", move } }],
});

for (const move of ["push-in", "pull-out", "tilt-settle"]) {
  test(`a stretched ${move} Hold reaches the same states at the same fractions`, () => {
    const short = loopOf(4, move), long = loopOf(10, move);
    for (const f of [0, 0.1, 0.25, 0.5, 0.8, 1]) {
      const a = sceneAt(short, f * 4), b = sceneAt(long, f * 10);
      for (const k of ["scroll", "zoom", "cx", "cy", "tilt"]) assert.ok(Math.abs(a[k] - b[k]) < 1e-9, `${k} at ${f}`);
    }
  });
}

test("a Hold moves: it is not frozen between its start and end", () => {
  const loop = loopOf(6, "push-in");
  assert.notEqual(sceneAt(loop, 0).zoom, sceneAt(loop, 3).zoom);
  assert.notEqual(sceneAt(loop, 3).zoom, sceneAt(loop, 6).zoom);
});

test("the Surface fits inside the frame", () => {
  const { surface } = sceneAt(loopOf(4, "push-in"), 0);
  assert.ok(surface.left > 0 && surface.top > 0);
  assert.ok(surface.left + surface.width < frame.width && surface.top + surface.height < frame.height);
});

// Multi-Shot Loops on the fixture Screen and its Focus areas.
const areas = JSON.parse(readFileSync(new URL("../../../fixtures/hold-loop/screens/fixture.areas.json", import.meta.url)));
const tall = { ...screen, ...areas };
const sameState = (a, b, msg) => { for (const k of KEYS) assert.ok(Math.abs(a[k] - b[k]) < 1e-9, `${msg}: ${k} ${a[k]} vs ${b[k]}`); };
const sequence = (specs, scale = 1) => {
  let start = 0;
  const shots = specs.map(([template, duration, params, cut]) => {
    const shot = { template, start, duration: duration * scale, params, cut };
    start += duration * scale;
    return shot;
  });
  return { frame, screen: tall, shots };
};
// The fixture Loop: hero → card-2 → hero / whole.
const fixture = (scale) => sequence([
  ["hold", 1.5, { focus: "hero", move: "push-in" }],
  ["scroll", 3, { from: "hero", to: "card-2", zoom: true }],
  ["scroll", 2.5, { from: "card-2", to: "hero" }],
  ["hold", 1.5, { focus: "whole", move: "tilt-settle" }, true],
], scale);
// Where a Focus area's centre lands in the frame through the Camera.
const onScreen = (st, name) => {
  const a = tall.areas[name], k = st.surface.width / tall.layoutWidth;
  const x = st.surface.left + (a.x + a.w / 2) * k, y = st.surface.top + (a.y + a.h / 2) * k - st.scroll;
  return { x: frame.width / 2 + st.zoom * (x - st.cx), y: frame.height / 2 + st.zoom * (y - st.cy) };
};

test("frame rate doesn't change state at a given t: frame n at 30fps is frame 2n at 60fps", () => {
  const loop = fixture(1);
  const at = (fps, n) => sceneAt(loop, n / fps);
  for (let n = 0; n <= 8.5 * 30; n += 17) sameState(at(30, n), at(60, 2 * n), `t ${n / 30}`);
});

test("each Shot opens on the previous Shot's closing state", () => {
  const loop = fixture(1);
  for (const i of [1, 2]) sameState(shotAt(loop, i, 0), shotAt(loop, i - 1, loop.shots[i - 1].duration), `Shot ${i + 1}`);
});

test("a cut opens the next Shot on its own opening instead", () => {
  const loop = fixture(1);
  const before = shotAt(loop, 2, 2.5), after = shotAt(loop, 3, 0);
  assert.equal(after.scroll, 0);
  assert.equal(after.tilt, 8);
  assert.notEqual(before.scroll, after.scroll);
  const fresh = sequence([["hold", 1.5, { focus: "whole", move: "tilt-settle" }]]);
  sameState(after, shotAt(fresh, 0, 0), "cut Shot vs the same Shot alone");
});

test("Scroll lands on its Focus area going down, zoomed in on it, and going back up", () => {
  const loop = fixture(1);
  const down = shotAt(loop, 1, 3), up = shotAt(loop, 2, 2.5), hero = shotAt(loop, 0, 0);
  assert.ok(down.scroll > hero.scroll && down.zoom > 1.5, `down: scroll ${down.scroll}, zoom ${down.zoom}`);
  const c = onScreen(down, "card-2");
  assert.ok(Math.abs(c.x - frame.width / 2) < 1e-6 && Math.abs(c.y - frame.height / 2) < 1e-6, "card-2 centred in frame");
  assert.ok(up.scroll < down.scroll);
  assert.equal(up.scroll, hero.scroll);
  assert.equal(up.zoom, 1);
});

test("Scroll's fill sets how much of the frame a wide area fills once zoomed, at any Frame size", () => {
  const landed = (f, fill) => shotAt({ frame: f, screen: tall, shots: [{ template: "scroll", start: 0, duration: 3, params: { from: "hero", to: "cards", zoom: true, fill } }] }, 0, 3);
  for (const f of [frame, story]) {
    const st = landed(f, 0.95), k = st.surface.width / tall.layoutWidth;
    assert.ok(Math.abs(tall.areas.cards.w * k * st.zoom - 0.95 * f.width) < 1e-6, `${f.width}x${f.height}: cards fill 95% of the width`);
  }
  // Without fill, the area fits within 72% of the frame, the card's own width.
  const st = landed(frame), k = st.surface.width / tall.layoutWidth;
  assert.ok(Math.abs(tall.areas.cards.w * k * st.zoom - 0.72 * frame.width) < 1e-6);
});

// Where a zoomed Scroll puts its Surface's edges in the frame, per axis: [low, high, frame size].
const zoomedEdges = (f, screen, params) => {
  const st = shotAt({ frame: f, screen, deviceFrame: "browser", shots: [{ template: "scroll", start: 0, duration: 3, params: { zoom: true, ...params } }] }, 0, 3);
  const b = st.surface.bounds, x = (v) => f.width / 2 + st.zoom * (v - st.cx), y = (v) => f.height / 2 + st.zoom * (v - st.cy);
  return { st, axes: [[x(b.left), x(b.left + b.width), f.width], [y(b.top), y(b.top + b.height), f.height]] };
};
const story = { width: 900, height: 1600 };

test("a zoomed Scroll leaves no lopsided Backdrop: a Surface that fits stays inside the frame, one that doesn't keeps its edges out of it", () => {
  // A long page with a thin strip near its top, like a rail under a hero.
  const page = { w: 1440, h: 6000, layoutWidth: 1440, areas: { strip: { x: 40, y: 650, w: 1360, h: 160 } } };
  for (const [name, f] of [["Landscape", frame], ["Story", story]]) {
    for (const [lo, hi, size] of zoomedEdges(f, page, { from: "whole", to: "strip", fill: 0.95 }).axes) {
      if (hi - lo <= size) assert.ok(lo >= -1e-6 && hi <= size + 1e-6, `${name}: edges ${lo}, ${hi} inside 0..${size}`);
      else assert.ok(lo <= 1e-6 && hi >= size - 1e-6, `${name}: edges ${lo}, ${hi} out of 0..${size}`);
    }
  }
});

test("a mild zoom on an off-centre area still moves the Camera toward it", () => {
  const { st, axes: [[lo, hi]] } = zoomedEdges(frame, tall, { from: "whole", to: "hero", fill: 0.5 });
  assert.ok(st.zoom > 1 && hi - lo < frame.width, `zoom ${st.zoom}: the Surface fits`);
  assert.ok(st.cx < frame.width / 2, `cx ${st.cx}: toward the hero, on the Surface's left`);
  assert.ok(lo >= -1e-6 && hi <= frame.width + 1e-6, "and the Surface stays in frame");
});

test("Scroll's fill must be above 0 and at most 1", () => {
  for (const fill of [0, -0.5, 1.2, "lots"]) assert.throws(() => zoomedEdges(frame, tall, { from: "hero", to: "cards", fill }), /fill must be above 0/);
});

test("every Shot's motion scales proportionally with its host clip's duration", () => {
  const short = fixture(1), long = fixture(1.7);
  for (const f of [0, 0.05, 0.2, 0.33, 0.5, 0.61, 0.8, 0.9, 1]) {
    sameState(sceneAt(short, f * 8.5), sceneAt(long, f * 8.5 * 1.7), `t = ${f} D`);
  }
  // A Scroll is never frozen mid-Shot: it is still moving at 80% of a longer host clip.
  const a = shotAt(long, 1, 0.8 * 5.1 - 0.01), b = shotAt(long, 1, 0.8 * 5.1);
  assert.ok(Math.abs(b.zoom - a.zoom) > 0, "still zooming at 80%");
});

test("a Focus path infers Scroll for a move along the Screen and Hold for one area", () => {
  assert.deepEqual(inferShots("hero → card-2 → hero / whole", frame, tall), [
    { template: "scroll", params: { from: "hero", to: "card-2" }, cut: false },
    { template: "scroll", params: { from: "card-2", to: "hero" }, cut: false },
    { template: "hold", params: { focus: "whole" }, cut: true },
  ]);
  assert.deepEqual(inferShots("footer", frame, tall), [{ template: "hold", params: { focus: "footer" }, cut: false }]);
  assert.deepEqual(inferShots("hero / footer -> hero", frame, tall).map((s) => [s.template, s.cut]), [["hold", false], ["scroll", true]]);
});

test("a Focus path with a sideways move between areas is rejected with a message", () => {
  assert.throws(() => inferShots("hero → hero-art", frame, tall), /"hero" → "hero-art" is a sideways move/);
  assert.throws(() => inferShots("hero → nowhere", frame, tall), /Unknown Focus area "nowhere"/);
});

// Seam check (Bookends): pose, movement continuity and duplicate frame, on scene state.
const { seamCheck, seamOf } = globalThis.LoopModel;
const still = { scroll: 0, zoom: 1, cx: 800, cy: 450, tilt: 0 };
const D = 2, fps = 60, dt = 1 / fps;
// The VR Bookend's shape on the fixture Screen: Hold on the hero, Scroll to a card, back.
const bookend = sequence([
  ["hold", 2, { focus: "hero", move: "push-in" }],
  ["scroll", 3, { from: "hero", to: "card-2" }],
  ["scroll", 2.5, { from: "card-2", to: "hero" }],
]);

test("Seam pose: a Bookend that ends on its opening framing passes; one that ends elsewhere fails", () => {
  const ok = seamOf(bookend, { fps });
  assert.deepEqual(ok.failures, []);
  assert.equal(ok.pass, true);
  const broken = seamOf(sequence([["hold", 2, { focus: "hero", move: "push-in" }], ["scroll", 3, { from: "hero", to: "card-2" }]]), { fps });
  assert.equal(broken.checks.pose, false);
  assert.equal(broken.pass, false);
  assert.match(broken.failures.join("\n"), /pose: scroll/);
});

test("Seam continuity passes at rest and in motion", () => {
  const rest = seamOf(bookend, { fps });
  assert.equal(rest.checks.continuity, true);
  assert.equal(rest.inMotion, false);
  const wave = (t) => ({ ...still, scroll: 100 + 50 * Math.sin((2 * Math.PI * (t % D)) / D) });
  const moving = seamCheck(wave, { duration: D, fps });
  assert.equal(moving.inMotion, true);
  assert.deepEqual(moving.failures, []);
});

test("Seam continuity fails on a lurch: at rest into the Seam, moving fast out of it", () => {
  const lurch = seamOf(sequence([["scroll", 0.25, { from: "hero", to: "card-2" }], ["scroll", 3, { from: "card-2", to: "hero" }]]), { fps });
  assert.equal(lurch.checks.pose, true);
  assert.equal(lurch.checks.continuity, false);
  assert.match(lurch.failures.join("\n"), /continuity: scroll/);
  const bounce = seamCheck((t) => ({ ...still, scroll: 100 * Math.abs(t - D / 2) }), { duration: D, fps });
  assert.equal(bounce.checks.continuity, false);
});

test("Seam duplicate frame fails in motion and passes on a still hold", () => {
  // A full turn that arrives one frame early, so frame D − Δ repeats frame 0 while moving.
  const early = seamCheck((t) => ({ ...still, tilt: (360 * Math.min(t, D - dt)) / (D - dt) }), { duration: D, fps });
  assert.equal(early.checks.pose, true);
  assert.equal(early.checks.duplicate, false);
  assert.match(early.failures.join("\n"), /duplicate frame/);
  // The Bookend rests at both ends: its frame D − Δ repeats frame 0, which can't be seen.
  sameState(sceneAt(bookend, 7.5 - dt), sceneAt(bookend, 0), "frame D − Δ vs frame 0");
  assert.equal(seamOf(bookend, { fps }).checks.duplicate, true);
});

test("Seam angles are compared by shortest difference across the ±180° wrap", () => {
  const flip = seamCheck((t) => ({ ...still, tilt: t === D ? 180 : -180 }), { duration: D, fps });
  assert.deepEqual(flip.failures, []);
  const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const spin = seamCheck((t) => ({ ...still, tilt: wrap(179 + (360 * t) / D) }), { duration: D, fps });
  assert.equal(spin.inMotion, true);
  assert.deepEqual(spin.failures, []);
  const jump = seamCheck((t) => ({ ...still, tilt: t === D ? 170 : -180 }), { duration: D, fps });
  assert.equal(jump.checks.pose, false);
});

// Layout per Frame size (ticket 06): the card fits the frame with margins at
// every preset; in portrait ratios a browser frame's viewport fills the height.
const { PRESETS } = await import("../export.mjs");
const { layout } = globalThis.LoopModel;

for (const deviceFrame of ["none", "browser"]) {
  for (const [name, f] of Object.entries(PRESETS)) {
    test(`${name}, ${deviceFrame} frame: the Surface sits inside the frame with margins`, () => {
      const s = layout(f, tall, deviceFrame), c = s.bounds;
      for (const m of [c.left, c.top, f.width - c.left - c.width, f.height - c.top - c.height])
        assert.ok(m >= 0.05 * Math.min(f.width, f.height), `${name}: margin ${m}`);
      // The viewport (where the Screen shows) is the Surface below its browser bar.
      assert.equal(s.left, c.left);
      assert.equal(s.width, c.width);
      assert.equal(s.top, c.top + s.bar);
      assert.equal(s.top + s.viewportHeight, c.top + c.height);
      assert.equal(s.bar > 0, deviceFrame === "browser");
    });
  }
}

test("in portrait ratios a browser frame's viewport grows to fill the height; the page keeps its desktop width", () => {
  const long = { w: 1440, h: 6000 }; // a long page, taller than any filled viewport
  for (const name of ["Story", "Portrait"]) {
    const f = PRESETS[name];
    const browser = layout(f, long, "browser"), plain = layout(f, long, "none");
    assert.ok(Math.abs(browser.bounds.height - 0.84 * f.height) < 1e-9, `${name}: Surface height ${browser.bounds.height}`);
    assert.ok(browser.viewportHeight > 2 * plain.viewportHeight, `${name}: viewport ${browser.viewportHeight} vs ${plain.viewportHeight}`);
    // A filled card is wider too, so the page's type isn't tiny in a tall frame (ticket 09).
    assert.ok(Math.abs(browser.width - 0.88 * f.width) < 1e-9, `${name}: Surface width ${browser.width}`);
    // The Screen is scaled, not reflowed: its width is the Surface's, at the Screen's own aspect.
    assert.ok(Math.abs(browser.imageHeight - long.h * browser.width / long.w) < 1e-9);
  }
  for (const name of ["Landscape", "Square", "Classic"]) {
    const s = layout(PRESETS[name], tall, "browser");
    assert.ok(Math.abs(s.width / s.viewportHeight - 16 / 10) < 1e-9, `${name} keeps a 16:10 viewport`);
  }
});

test("a filled viewport stops at the Screen's height, so a short Screen leaves no blank page", () => {
  const short = { w: 1440, h: 1800 }, s = layout(PRESETS.Story, short, "browser");
  assert.ok(Math.abs(s.viewportHeight - s.imageHeight) < 1e-9);
  assert.equal(s.maxScroll, 0);
  assert.ok(s.bounds.height < 0.84 * PRESETS.Story.height);
});

test("an unknown Device frame is rejected", () => {
  assert.throws(() => layout(frame, tall, "laptop"), /Device frame "laptop"/);
});

test("in a browser frame a Scroll still lands its Focus area in the viewport", () => {
  for (const name of ["Landscape", "Story"]) {
    const f = PRESETS[name];
    const loop = { frame: f, screen: tall, deviceFrame: "browser", shots: [{ template: "scroll", start: 0, duration: 3, params: { from: "hero", to: "card-2" } }] };
    const st = sceneAt(loop, 3), a = tall.areas["card-2"], k = st.surface.width / tall.layoutWidth;
    const y = st.surface.top + (a.y + a.h / 2) * k - st.scroll;
    assert.ok(y > st.surface.top && y < st.surface.top + st.surface.viewportHeight, `${name}: ${y}`);
  }
});

// Phone Device frame (ticket 11): Nick's simple drawn bezel round a 9:19.5 viewport.
const mobile = { w: 1170, h: 5400, layoutWidth: 390, areas: { hero: { x: 20, y: 120, w: 350, h: 400 }, gallery: { x: 0, y: 1200, w: 390, h: 500 } } };

for (const [name, f] of Object.entries(PRESETS)) {
  test(`${name}, phone frame: the phone sits inside the frame with margins, its Screen inset by the bezel`, () => {
    const s = layout(f, mobile, "phone"), c = s.bounds;
    for (const m of [c.left, c.top, f.width - c.left - c.width, f.height - c.top - c.height])
      assert.ok(m >= 0.05 * Math.min(f.width, f.height), `${name}: margin ${m}`);
    assert.ok(s.bezel > 0 && s.bar === 0);
    for (const [inner, outer] of [[s.left, c.left], [s.top, c.top]]) assert.ok(Math.abs(inner - outer - s.bezel) < 1e-9);
    assert.ok(Math.abs(c.width - s.width - 2 * s.bezel) < 1e-9 && Math.abs(c.height - s.viewportHeight - 2 * s.bezel) < 1e-9);
    assert.ok(Math.abs(s.viewportHeight / s.width - 19.5 / 9) < 1e-9, "a 9:19.5 Screen");
    assert.ok(Math.abs(s.imageHeight - mobile.h * s.width / mobile.w) < 1e-9, "the Screen is scaled to the phone's width");
  });
}

const phoneLoop = (shots, f = frame) => ({ frame: f, screen: mobile, deviceFrame: "phone", shots });

test("the Steel Hat phone move: a Scroll opens on a bold tilt that eases upright while the page scrolls", () => {
  const loop = phoneLoop([{ template: "scroll", start: 0, duration: 4, params: { from: "whole", to: "gallery", tilt: 20 } }]);
  const at = (t) => sceneAt(loop, t);
  assert.equal(at(0).tilt, 20);
  assert.equal(at(0).scroll, 0);
  assert.equal(at(4).tilt, 0);
  assert.ok(at(4).scroll > 0);
  for (let t = 0.25; t <= 4; t += 0.25) {
    const a = at(t - 0.25), b = at(t);
    assert.ok(b.tilt <= a.tilt && b.scroll >= a.scroll, `t ${t}: tilt ${a.tilt} → ${b.tilt}, scroll ${a.scroll} → ${b.scroll}`);
  }
  // Mid-Shot both are on the way: the tilt eases over the scroll, not before or after it.
  assert.ok(at(2).tilt > 0 && at(2).tilt < 20 && at(2).scroll > 0 && at(2).scroll < at(4).scroll);
});

test("a Hold's tilt settle takes its tilt from the Shot", () => {
  const loop = phoneLoop([{ template: "hold", start: 0, duration: 3, params: { focus: "hero", move: "tilt-settle", tilt: 15 } }]);
  assert.equal(sceneAt(loop, 0).tilt, 15);
  assert.equal(sceneAt(loop, 3).tilt, 0);
});

test("a tilt beyond 20° either way is rejected, so a flat Surface never looks like cardboard", () => {
  for (const tilt of [21, -25, "lots"]) {
    assert.throws(() => sceneAt(phoneLoop([{ template: "scroll", start: 0, duration: 3, params: { to: "gallery", tilt } }]), 0), /tilt/);
    assert.throws(() => sceneAt(phoneLoop([{ template: "hold", start: 0, duration: 3, params: { move: "tilt-settle", tilt } }]), 0), /tilt/);
  }
  assert.equal(sceneAt(phoneLoop([{ template: "scroll", start: 0, duration: 3, params: { to: "gallery", tilt: -20 } }]), 0).tilt, -20);
});

test("at full tilt, a phone turned in the frame still fits it with margins, at every preset", () => {
  for (const [name, f] of Object.entries(PRESETS)) {
    const { bounds: b, turn } = layout(f, mobile, "phone");
    const r = (20 * turn * Math.PI) / 180, w = b.width * Math.cos(r) + b.height * Math.sin(r), h = b.height * Math.cos(r) + b.width * Math.sin(r);
    assert.ok(turn > 1, `${name}: the phone turns more than it tilts`);
    assert.ok(w <= 0.9 * f.width && h <= 0.9 * f.height, `${name}: turned phone ${w} × ${h}`);
  }
});

// The motion rule (ADR-0012 as amended, vr-loops 03): one push-in on a Focus
// area that settles on it for at least 1s, then a matching return.
const heroPush = (scale = 1, extra = {}, loopTilt) => ({
  ...sequence([
    ["hold", 4.5, { focus: "hero", move: "push-settle", fill: 0.8, ...extra }],
    ["hold", 3.5, { focus: "hero", move: "return" }],
  ], scale),
  tilt: loopTilt,
});
// Every state over [a, b] in steps of a 60fps frame.
const sampled = (loop, a, b) => { const out = []; for (let t = a; t <= b + 1e-9; t += 1 / 60) out.push([t, sceneAt(loop, t)]); return out; };
const isStill = (states) => states.every(([, s]) => KEYS.every((k) => Math.abs(s[k] - states[0][1][k]) < 1e-9));

test("a push-settle Hold opens on the area's framing and pushes in until the area fills its share of the frame", () => {
  const loop = heroPush(), open = shotAt(loop, 0, 0), close = shotAt(loop, 0, 4.5);
  sameState(open, { ...shotAt(sequence([["hold", 1, { focus: "hero", move: "tilt-settle", tilt: 0 }]]), 0, 1) }, "opens on the hero's settled framing");
  assert.equal(open.zoom, 1);
  const k = close.surface.width / tall.layoutWidth, a = tall.areas.hero;
  const share = Math.max((a.w * k * close.zoom) / frame.width, (a.h * k * close.zoom) / frame.height);
  assert.ok(Math.abs(share - 0.8) < 1e-9, `the hero fills ${share} of the frame`);
  const c = onScreen(close, "hero");
  assert.ok(Math.abs(c.x - frame.width / 2) < 1 && Math.abs(c.y - frame.height / 2) < 1, `hero centred: ${c.x}, ${c.y}`);
});

test("a push-settle Hold is still on its area for at least 1s, even in a short Shot", () => {
  for (const scale of [1, 0.5, 0.3, 2]) {
    const loop = heroPush(scale), d = 4.5 * scale;
    const tail = sampled(loop, d - Math.max(1, 0.4 * d), d - 1e-6);
    assert.ok(isStill(tail), `scale ${scale}: still over the last ${Math.max(1, 0.4 * d)}s`);
    assert.ok(sceneAt(loop, d * 0.1).zoom > 1 && sceneAt(loop, d * 0.1).zoom < tail[0][1].zoom, `scale ${scale}: pushing in early on`);
  }
});

test("a push-settle Shot too short to push in and still settle for 1s is rejected", () => {
  assert.throws(() => sceneAt(heroPush(1.3 / 4.5), 0), /push-settle needs at least 1.33s/);
  assert.doesNotThrow(() => sceneAt(heroPush(1.34 / 4.5), 0));
});

test("a push-settle then return Bookend pushes in exactly once and passes the Seam check", () => {
  const loop = heroPush();
  const zooms = sampled(loop, 0, 8).map(([, s]) => s.zoom);
  const peak = zooms.indexOf(Math.max(...zooms));
  for (let i = 1; i < zooms.length; i++) {
    if (i <= peak) assert.ok(zooms[i] >= zooms[i - 1] - 1e-12, `zoom never backs off on the way in (frame ${i})`);
    else assert.ok(zooms[i] <= zooms[i - 1] + 1e-12, `zoom never pushes again on the way out (frame ${i})`);
  }
  sameState(sceneAt(loop, 8), sceneAt(loop, 0), "returns to the opening framing");
  assert.deepEqual(seamOf(loop, { fps: 60 }).failures, []);
});

test("a return Hold after a cut opens on the push-settle's close-up", () => {
  const pushed = shotAt(heroPush(), 0, 4.5);
  const alone = sequence([["hold", 3, { focus: "hero", move: "return", fill: 0.8 }]]);
  sameState(shotAt(alone, 0, 0), pushed, "opens close up");
  assert.equal(shotAt(alone, 0, 3).zoom, 1);
});

test("a Loop's tilt holds for its whole length, so a tilted Bookend's Seam joins identical framings", () => {
  const loop = heroPush(1, {}, 8);
  for (const [t, s] of sampled(loop, 0, 8)) assert.equal(s.tilt, 8, `tilt at ${t}`);
  sameState(sceneAt(loop, 8), sceneAt(loop, 0), "t = D vs t = 0");
  assert.deepEqual(seamOf(loop, { fps: 60 }).failures, []);
  // Other Shots' tilts are on top of it: a tilt settle lands on the Loop's tilt, not upright.
  const settle = { ...sequence([["hold", 2, { focus: "whole", move: "tilt-settle", tilt: 6 }]]), tilt: -4 };
  assert.equal(sceneAt(settle, 0).tilt, 2);
  assert.equal(sceneAt(settle, 2).tilt, -4);
});

test("a Loop's tilt is within 20° either way, with any Shot's tilt on top of it", () => {
  for (const tilt of [21, -30, "lots"]) assert.throws(() => sceneAt(heroPush(1, {}, tilt), 0), /tilt/);
  assert.throws(() => sceneAt({ ...sequence([["hold", 2, { move: "tilt-settle", tilt: 15 }]]), tilt: 8 }, 0), /tilt/);
});

test("a push-settle's fill must be above 0 and at most 1", () => {
  for (const fill of [0, 1.5, "lots"]) assert.throws(() => sceneAt(heroPush(1, { fill }), 0), /fill must be above 0/);
});
