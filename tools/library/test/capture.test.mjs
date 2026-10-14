// Screen capture from a live URL, on a local page served for the test. Uses headless Chrome.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { capturePage, capturePageWithLayout, captureScreen } from "../capture.mjs";

// A 2000 px tall grey page with a white block at the top and blue at the bottom, plus
// three banners: a known cookie tool's, one named by the test, and an unnamed fixed
// box that talks about cookies. Each is red, so any red pixel is a banner left showing.
const PAGE = `<!doctype html><html><head><style>
  body { margin: 0; background: #808080; }
  .top { height: 100px; background: #fff; } .tall { height: 1800px; } .bottom { height: 100px; background: #00f; }
  .banner { position: fixed; left: 0; right: 0; height: 80px; background: #f00; }
</style></head><body>
  <div class="top"></div><div class="tall"></div><div class="bottom"></div>
  <div id="onetrust-consent-sdk" class="banner" style="top: 0">We use cookies</div>
  <div class="banner promo" style="top: 200px">Sign up for our newsletter</div>
  <div class="banner" style="bottom: 0">This site uses cookies. Accept?</div>
</body></html>`;

// A page with a heading and a button in its first screen, and another button far below it.
const UI = `<!doctype html><html><body style="margin: 0; font: 16px sans-serif">
  <h1 style="margin: 40px">Ship faster</h1>
  <button style="margin: 0 40px; width: 120px; height: 40px">Sign up</button>
  <button style="position: absolute; top: 1500px; left: 40px">Far below</button>
</body></html>`;

let server, url;
before(async () => {
  server = createServer((req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(req.url === "/ui" ? UI : PAGE); });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  url = `http://127.0.0.1:${server.address().port}/`;
});
after(() => server.close());

const redPixels = async (png) => {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) if (data[i] > 200 && data[i + 1] < 60 && data[i + 2] < 60) n++;
  return n;
};
const pixel = async (png, x, y) => {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const i = (y * info.width + x) * info.channels;
  return [data[i], data[i + 1], data[i + 2]];
};

test("captures the full page at the chosen viewport width and device scale, with cookie banners and listed selectors hidden", async () => {
  const png = await capturePage({ url, width: 800, scale: 2, hide: ".promo" });
  const { width, height } = await sharp(png).metadata();
  assert.equal(width, 1600);
  assert.equal(height, 4000, "the whole page, not one viewport");
  assert.equal(await redPixels(png), 0, "no banner left showing");
  assert.deepEqual(await pixel(png, 800, 100), [255, 255, 255], "top of the page at the top");
  assert.deepEqual(await pixel(png, 800, 3900), [0, 0, 255], "bottom of the page at the bottom");
});

test("a banner the defaults don't know shows unless its selector is listed", async () => {
  const png = await capturePage({ url, width: 400, scale: 1 });
  assert.ok(await redPixels(png) > 0, "the promo banner shows when not listed");
});

test("writes the Screen into the Project's assets, named for its layout width and scale, and won't overwrite one", async () => {
  const project = mkdtempSync(join(tmpdir(), "capture-test-"));
  try {
    writeFileSync(join(project, "hyperframes.json"), "{}");
    const r = await captureScreen({ project, url, name: "home", width: 800, scale: 2, hide: ".promo" });
    assert.equal(r.output, join(project, "assets", "_source", "home-800@2x.png"));
    assert.ok(existsSync(r.output));
    assert.deepEqual([r.width, r.height, r.layoutWidth], [1600, 4000, 800]);

    await assert.rejects(captureScreen({ project, url, name: "home", width: 800, scale: 2 }), /already exists/);
    // With force, the Screen is replaced: this capture keeps the promo banner.
    await captureScreen({ project, url, name: "home", width: 800, scale: 2, force: true });
    assert.ok(await redPixels(r.output) > 0, "replaced");

    await assert.rejects(captureScreen({ project: join(project, "nope"), url, name: "home" }), /not a Project/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test("reads the layout map of the page's first screen: boxes and text lines in CSS px, nothing below it", async () => {
  const { png, layout } = await capturePageWithLayout({ url: url + "ui", width: 800, scale: 1, layoutHeight: 500 });
  assert.equal((await sharp(png).metadata()).width, 800);
  assert.deepEqual([layout.width, layout.height, layout.title], [800, 500, "127.0.0.1"]);
  const button = layout.parts.find((p) => p.kind === "box" && p.name === "button");
  assert.ok(button, "the button is a part");
  assert.deepEqual([button.x, button.w, button.h], [40, 120, 40]);
  assert.equal(button.interactive, true);
  const heading = layout.parts.find((p) => p.kind === "text" && p.y < 100);
  assert.ok(heading?.lines.length, "the heading's text line is a part");
  assert.ok(layout.parts.every((p) => p.y < 500), "nothing below the first screen");
  assert.ok(layout.parts.every((p) => !("el" in p)), "plain JSON, no DOM references");
  assert.ok(layout.code.length > 5, "the motion CSS lines for the texts panel");
});
