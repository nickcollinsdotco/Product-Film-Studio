// The CSS Renderer's motion in Chrome: the Surface follows the Loop model to a
// fraction of a pixel. Chrome snaps a box's layout position and size to whole
// pixels, so a Surface moved by left/top steps and wobbles about ±0.4 px a frame
// on a push-in (vr-loops 03, "very jittery"). Draws the Library straight into
// HyperFrames' browser (no render), so it takes seconds.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import "../../../library/loop-model.js";
import "../../../library/css-renderer.js";

const repo = resolve(fileURLToPath(import.meta.url), "../../../..");
const fixture = join(repo, "fixtures", "hold-loop", "screens");
const [W, H] = [800, 450];
const screen = {
  w: 1440, h: 2400, ...JSON.parse(readFileSync(join(fixture, "fixture.areas.json"), "utf8")),
  url: pathToFileURL(join(fixture, "fixture.png")).href,
};
const loop = { frame: { width: W, height: H }, screen, deviceFrame: "browser", shots: [
  { template: "hold", start: 0, duration: 4.5, params: { focus: "hero", move: "push-settle", fill: 0.6 } }] };
const BRAND = [0xff, 0x7a, 0x59], BAR = [0xec, 0xec, 0xee];

// The browser bar's sub-pixel edge on the brand Backdrop, from the green level of
// the first pixel off it (the shadow only darkens the Backdrop, so it's skipped).
function edgeOf(data, ch, pixel, len) {
  for (let k = 0; k < len; k++) {
    const g = data[pixel(k) * ch + 1];
    if (g > BRAND[1] + 10) return k + 1 - Math.min(1, (g - BRAND[1]) / (BAR[1] - BRAND[1]));
  }
  return NaN;
}

test("a push-in moves the Surface smoothly: its edges follow the model to a fraction of a pixel, frame to frame", { timeout: 60_000 }, async () => {
  const lib = (p) => pathToFileURL(join(repo, "library", p)).href;
  const html = `<!DOCTYPE html><html><head><style>html,body{margin:0}</style>
<script src="${lib("loop-model.js")}"></script><script src="${lib("css-renderer.js")}"></script></head><body><div id="f"></div><script>
const loop = ${JSON.stringify(loop)};
const draw = CssRenderer.mount(document.getElementById("f"), { frame: loop.frame, screen: loop.screen, settings: { brandColour: "#ff7a59", backdrop: "brand", deviceFrame: "browser" } });
window.at = (t) => draw(LoopModel.sceneAt(loop, t));
</script></body></html>`;
  const dir = mkdtempSync(join(tmpdir(), "motion-test-")), page = join(dir, "page.html");
  writeFileSync(page, html);
  const browser = await puppeteer.launch({
    executablePath: spawnSync(process.execPath, [join(repo, "node_modules/hyperframes/bin/hyperframes.mjs"), "browser", "path"], { encoding: "utf8" }).stdout.trim(),
    headless: true, args: ["--allow-file-access-from-files", "--hide-scrollbars"],
  });
  const residuals = [];
  try {
    const tab = await browser.newPage();
    await tab.setViewport({ width: W, height: H });
    await tab.goto(pathToFileURL(page).href, { waitUntil: "load" });
    await tab.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    for (let f = 0; f < 30; f++) {
      const t = 0.4 + f / 60;
      await tab.evaluate((t) => window.at(t), t);
      const { data, info } = await sharp(await tab.screenshot()).raw().toBuffer({ resolveWithObject: true });
      const g = globalThis.CssRenderer.place(globalThis.LoopModel.sceneAt(loop, t), loop.frame);
      const row = Math.round(g.top + g.bar / 2), col = Math.floor(W * 0.3);
      residuals.push([
        edgeOf(data, info.channels, (k) => row * W + k, W / 2) - g.left,
        edgeOf(data, info.channels, (k) => k * W + col, H / 2) - g.top,
      ]);
    }
  } finally {
    await browser.close();
    rmSync(dir, { recursive: true, force: true });
  }
  // Wobble: RMS of the residual's change from one frame to the next, so a steady
  // bias (the shadow, anti-aliasing) doesn't count, only stepping and jitter.
  for (const [i, name] of [[0, "left"], [1, "top"]]) {
    const v = residuals.map((r) => r[i]);
    assert.ok(v.every(Number.isFinite), `${name} edge found in every frame`);
    let d = 0;
    for (let k = 1; k < v.length; k++) d += (v[k] - v[k - 1]) ** 2;
    const wobble = Math.sqrt(d / (v.length - 1));
    assert.ok(wobble < 0.15, `${name} edge wobbles ${wobble.toFixed(3)} px a frame`);
  }
});
