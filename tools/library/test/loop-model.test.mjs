// Seam 1: the Loop model. Pure scene state, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../../../library/loop-model.js";

const { sceneAt } = globalThis.LoopModel;

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
