// The full-page stitch, on a synthetic page "scrolled" behind a fixed header, a fixed footer and a scrollbar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createStitcher, compose } from "../stitch.js";
import { H, PAGE, FOOT, BAR, page, frame, source, useSource, mismatchedRows } from "./synthetic.mjs";

function stitch(scrolls) {
  const s = createStitcher();
  scrolls.forEach((y) => s.push(frame(y)));
  return { out: compose(s.result()), raw: s.result() };
}

test("a page scrolled down unevenly, with a scroll back up, stitches row for row", () => {
  const scrolls = [0, 0, 37, 120, 260, 200, 330, 500, 790, 1000];
  for (let y = 1200; y <= PAGE - H; y += 211) scrolls.push(y);
  scrolls.push(PAGE - H);
  const { out, raw } = stitch(scrolls);
  assert.equal(raw.crop >= BAR && raw.crop <= BAR + 4, true, `scrollbar cropped (${raw.crop})`);
  assert.equal(out.height > PAGE - FOOT - 24 && out.height <= PAGE - FOOT, true, `height ${out.height}`);
  assert.equal(mismatchedRows(out), 0);
  // the top of the first frame is kept, its header included; the footer never lands in the page
  assert.deepEqual([...out.data.subarray(0, 3)], [16, 24, 48]);
});

test("a jump past the overlap is reported as lost, and scrolling back finds the place again", () => {
  const s = createStitcher();
  s.push(frame(0)); s.push(frame(200));
  assert.equal(s.push(frame(200 + 560)).lost, true);
  assert.equal(s.push(frame(420)).lost, false);
  for (let y = 600; y <= 1400; y += 200) s.push(frame(y));
  const out = compose(s.result());
  assert.equal(out.height > 1400 + H - FOOT - 24, true);
  assert.equal(mismatchedRows(out), 0);
});

test("a blank stretch longer than the overlap is crossed on the forwarded wheel", () => {
  const was = useSource(page([2000, 2900]));
  try {
    const s = createStitcher();
    let last = 0;
    for (let y = 0; y <= 4000; y += 150) { s.push(frame(y), { wheel: y - last }); last = y; }
    const out = compose(s.result());
    assert.equal(out.height > last + H - FOOT - 24, true, `height ${out.height}`);
    assert.equal(mismatchedRows(out), 0);
  } finally { useSource(was); }
});

test("a floating dock, content fading in and a running animation don't land in the page", () => {
  const was = useSource(page([0, 0])); // no blank stretch: without a wheel, one is the documented limit
  try {
    const s = createStitcher();
    const opts = { dock: true, reveal: true, anim: true };
    let y = 0;
    for (; y <= 3000; y += 140) { s.push(frame(y, opts)); s.push(frame(y, opts)); } // and frames where only the animation moved
    y -= 140;
    assert.equal(s.state().moved, y);
    const out = compose(s.result());
    // the bottom of the last view was only ever seen under the dock or mid-fade
    assert.equal(mismatchedRows(out, { to: y + Math.floor(H * 0.75), skip: [[1000, 1100]] }), 0);
    assert.equal(out.height >= y + H - 140 - 8, true, `height ${out.height}`);
  } finally { useSource(was); }
});

test("a dark page with sparse detail still matches", () => {
  const dark = source.map((v, i) => (i % 4 === 3 ? 255 : 255 - v)); // white page to black, dark lines to light
  const was = useSource(dark);
  try {
    const s = createStitcher();
    for (let y = 0; y <= 2000; y += 190) s.push(frame(y));
    assert.equal(mismatchedRows(compose(s.result())), 0);
  } finally { useSource(was); }
});

test("never scrolled: the one frame, whole", () => {
  const { out } = stitch([0, 0, 0]);
  assert.equal(out.height, H);
});
