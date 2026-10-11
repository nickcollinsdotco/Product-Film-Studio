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
