// The Focus area overlay, on a synthetic Screen and sidecar written to a temp folder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { overlayAreas } from "../overlay.mjs";

// A flat grey 2x Screen: 400×600 image px at a 200 px layout width.
async function synthetic(sidecar) {
  const dir = mkdtempSync(join(tmpdir(), "overlay-test-"));
  const screen = join(dir, "page@2x.png");
  await sharp({ create: { width: 400, height: 600, channels: 3, background: "#808080" } }).png().toFile(screen);
  if (sidecar) writeFileSync(join(dir, "page@2x.areas.json"), JSON.stringify(sidecar));
  return { dir, screen };
}
const pixel = async (file, x, y) => {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};
const isGrey = ([r, g, b]) => r === 128 && g === 128 && b === 128;

test("draws each Focus area as a box scaled to the Screen's real resolution, in one image the Screen's size", async () => {
  const { dir, screen } = await synthetic({ layoutWidth: 200, areas: { hero: { x: 20, y: 100, w: 100, h: 50 } } });
  try {
    const out = join(dir, "overlay.png");
    const r = await overlayAreas({ screen, out });
    assert.equal(r.output, out);
    assert.equal(r.scale, 2);
    assert.deepEqual(r.areas, [{ name: "hero", x: 40, y: 200, w: 200, h: 100 }]);

    const meta = await sharp(out).metadata();
    assert.equal(meta.width, 400);
    assert.equal(meta.height, 600);
    // Box edges at the scaled position; the inside and the unscaled position untouched.
    assert.ok(!isGrey(await pixel(out, 140, 200)), "top edge drawn");
    assert.ok(!isGrey(await pixel(out, 140, 299)), "bottom edge drawn");
    assert.ok(!isGrey(await pixel(out, 40, 250)), "left edge drawn");
    assert.ok(!isGrey(await pixel(out, 239, 250)), "right edge drawn");
    assert.ok(isGrey(await pixel(out, 140, 250)), "inside of the box left clear");
    assert.ok(isGrey(await pixel(out, 60, 125)), "nothing at the unscaled 1x position");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("labels each box with its name, in its own colour", async () => {
  const { dir, screen } = await synthetic({
    layoutWidth: 200,
    areas: { nav: { x: 0, y: 0, w: 200, h: 30 }, "card-2": { x: 50, y: 150, w: 100, h: 100 } },
  });
  try {
    const out = join(dir, "overlay.png");
    const r = await overlayAreas({ screen, out });
    assert.deepEqual(r.areas.map((a) => a.name), ["nav", "card-2"]);
    assert.notDeepEqual(await pixel(out, 200, 0), await pixel(out, 200, 300), "boxes differ in colour");
    // The label tab sits just above the box's top-left corner, or inside it at the Screen's top.
    assert.ok(!isGrey(await pixel(out, 106, 290)), "label tab above card-2");
    assert.ok(!isGrey(await pixel(out, 20, 20)), "label tab inside nav, which touches the top");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("leaves `whole` undrawn, since it's built in", async () => {
  const { dir, screen } = await synthetic({
    layoutWidth: 200,
    areas: { whole: { x: 0, y: 0, w: 200, h: 300 }, hero: { x: 20, y: 100, w: 100, h: 50 } },
  });
  try {
    const out = join(dir, "overlay.png");
    const r = await overlayAreas({ screen, out });
    assert.deepEqual(r.areas.map((a) => a.name), ["hero"]);
    assert.ok(isGrey(await pixel(out, 200, 598)), "no box along the Screen's edge");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("keeps a label inside the Screen when its box sits at the right edge", async () => {
  const { dir, screen } = await synthetic({ layoutWidth: 200, areas: { "right-rail": { x: 190, y: 100, w: 10, h: 100 } } });
  try {
    const out = join(dir, "overlay.png");
    await overlayAreas({ screen, out });
    assert.ok(!isGrey(await pixel(out, 300, 180)), "label tab pulled left of the box");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("reports areas that fall outside the Screen", async () => {
  const { dir, screen } = await synthetic({ layoutWidth: 200, areas: { low: { x: 10, y: 280, w: 50, h: 40 } } });
  try {
    const r = await overlayAreas({ screen, out: join(dir, "overlay.png") });
    assert.deepEqual(r.warnings, [`"low" runs past the Screen (1x box ends at 60×320; Screen is 200×300 at layoutWidth 200)`]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fails clearly without a sidecar, a layoutWidth or valid boxes", async () => {
  const cases = [
    [null, /No Focus areas sidecar/],
    [{ areas: { a: { x: 0, y: 0, w: 10, h: 10 } } }, /layoutWidth/],
    [{ layoutWidth: 200, areas: {} }, /no areas/],
    [{ layoutWidth: 200, areas: { a: { x: 0, y: 0, w: 0, h: 10 } } }, /"a".*x, y, w, h/],
  ];
  for (const [sidecar, error] of cases) {
    const { dir, screen } = await synthetic(sidecar);
    try {
      await assert.rejects(overlayAreas({ screen, out: join(dir, "overlay.png") }), error);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
