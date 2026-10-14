// The CSS Renderer's geometry: where the Surface and its parts land in the frame
// for a scene state. Pure, no DOM. The drawing itself is checked on rendered frames.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../../../library/loop-model.js";
import "../../../library/css-renderer.js";

const { sceneAt } = globalThis.LoopModel;
const { place } = globalThis.CssRenderer;

const frame = { width: 1600, height: 900 };
const screen = { w: 1440, h: 2400 };
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} vs ${b}`);
const stateOf = (over = {}) => ({
  ...sceneAt({ frame, screen, deviceFrame: "browser", shots: [{ template: "hold", start: 0, duration: 4, params: { move: "push-in" } }] }, 0),
  ...over,
});

test("at zoom 1 with the Camera centred, the Surface sits at its layout bounds", () => {
  const st = stateOf();
  const g = place(st, frame);
  const b = st.surface.bounds;
  near(g.left, b.left, "left"); near(g.top, b.top, "top");
  near(g.width, b.width, "width"); near(g.height, b.height, "height");
  near(g.bar, st.surface.bar, "bar"); near(g.imageWidth, st.surface.width, "image width");
});

test("a zoom resizes every length instead of scaling, and the Camera centre lands mid-frame", () => {
  const Z = 1.5, cx = 700, cy = 380;
  const st = stateOf({ zoom: Z, cx, cy, scroll: 120 });
  const flat = place(stateOf({ scroll: 120 }), frame), g = place(st, frame);
  const b = st.surface.bounds;
  // The old camera transform: frame point = W/2 + Z (p − cx).
  near(g.left, frame.width / 2 + Z * (b.left - cx), "left");
  near(g.top, frame.height / 2 + Z * (b.top - cy), "top");
  for (const k of ["width", "height", "bar", "viewportHeight", "imageWidth", "imageHeight", "radius", "scroll", "perspective"]) near(g[k], flat[k] * Z, k);
});

test("the shadow fades from full at zoom 1 to none once the Surface fills the frame's width", () => {
  const st = stateOf();
  const fill = frame.width / st.surface.bounds.width;
  near(place(st, frame).shadow, 1, "zoom 1");
  near(place(stateOf({ zoom: fill }), frame).shadow, 0, "filled");
  near(place(stateOf({ zoom: fill * 1.5 }), frame).shadow, 0, "past filled");
  const mid = place(stateOf({ zoom: (1 + fill) / 2 }), frame).shadow;
  assert.ok(mid > 0 && mid < 1, `half way: ${mid}`);
});

test("a tilt pivots on the Camera's aim, so a tilted close-up keeps its framing", () => {
  for (const st of [stateOf(), stateOf({ zoom: 2, cx: 500, cy: 300, scroll: 80 })]) {
    const g = place(st, frame);
    near(g.left + g.originX, frame.width / 2, "pivot x at mid-frame");
    near(g.top + g.originY, frame.height / 2, "pivot y at mid-frame");
  }
});

test("a tilted Surface that fills the frame is drawn a little larger, so its tilted edges stay out of frame", () => {
  const fill = frame.width / stateOf().surface.bounds.width;
  const filled = { zoom: fill * 1.2, cx: 600, cy: 400 };
  const flat = place(stateOf(filled), frame), tilted = place(stateOf({ ...filled, tilt: 8 }), frame);
  assert.ok(tilted.width > flat.width * 1.02, `${tilted.width} vs ${flat.width}`);
  near(tilted.left + tilted.originX, frame.width / 2, "still pivots mid-frame");
  // At zoom 1 a tilt changes nothing but the angle: the Backdrop shows round the Surface anyway.
  near(place(stateOf({ tilt: 8 }), frame).width, place(stateOf(), frame).width, "zoom 1");
});
