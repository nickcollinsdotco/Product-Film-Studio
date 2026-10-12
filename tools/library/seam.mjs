// Seam check of a Loop entry (ADR-0011 as amended): reads the entry into the
// Loop model's terms, runs the model's Seam check on a Bookend and draws its
// t = D | t = 0 image for checking by eye. Used by the export before it renders.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import puppeteer from "puppeteer-core";
import "../../library/loop-model.js";
import { primaryFrameSize } from "./export.mjs";
import { sidecarOf } from "./overlay.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const hfBin = join(repo, "node_modules", "hyperframes", "bin", "hyperframes.mjs");

// The attributes of every <div> in the entry that carries `attr`.
const unescapeAttr = (v) => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const tagsWith = (html, attr) => [...html.matchAll(/<div\b[^>]*>/g)]
  .map(([tag]) => Object.fromEntries([...tag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].slice(1).map(([, k, v]) => [k, unescapeAttr(v ?? "")])))
  .filter((a) => attr in a);

// The Loop's settings as shot.js resolves them: the Project's own settings and
// Library copy, run in a sandbox, with the entry root's data-settings over them.
function settingsOf(root, overrides) {
  const ctx = vm.createContext({});
  ctx.window = ctx;
  for (const p of ["project-settings.js", "library/project-settings.js"]) vm.runInContext(readFileSync(join(root, p), "utf8"), ctx, { filename: p });
  return { ...ctx.ProjectSettings.resolve(overrides) };
}

// The Loop as the Loop model sees it, read from its entry the way shot.js reads
// the mounted host clips: its shape, duration and settings from the root, a Shot per host clip.
function readLoop(root, html, frame) {
  const top = tagsWith(html, "data-composition-id")[0];
  const clips = tagsWith(html, "data-composition-src");
  if (!clips.length) throw new Error("Loop entry has no Shot host clips");
  const vars = clips.map((c) => JSON.parse(c["data-variable-values"] || "{}"));
  const shots = clips.map((c, i) => {
    const { screen: _s, screenWidth: _w, screenHeight: _h, ...params } = vars[i];
    return {
      template: c["data-composition-src"].split("/").pop().replace(/\.html$/, ""),
      start: parseFloat(c["data-start"] || 0), duration: parseFloat(c["data-duration"] || 4),
      params, cut: "data-cut" in c,
    };
  });
  const v = vars[0];
  const file = resolve(root, v.screen);
  const sidecar = sidecarOf(file);
  const screen = { file, w: Number(v.screenWidth), h: Number(v.screenHeight), ...(existsSync(sidecar) ? JSON.parse(readFileSync(sidecar, "utf8")) : {}) };
  const settings = settingsOf(root, JSON.parse(top["data-settings"] || "{}"));
  return { shape: top["data-loop-shape"], duration: parseFloat(top["data-duration"]), settings, loop: { frame, screen, shots, deviceFrame: settings.deviceFrame } };
}

// Draws t = D beside t = 0 with the Project's own Library copy, in HyperFrames' browser.
const GAP = 16;
async function seamImage(root, loop, settings, D, file) {
  const { width: W, height: H } = loop.frame;
  const src = (p) => pathToFileURL(join(root, p)).href;
  const page = join(dirname(file), `.seam-${process.pid}-${Date.now()}.html`);
  const data = JSON.stringify({ loop: { ...loop, screen: { ...loop.screen, url: pathToFileURL(loop.screen.file).href } }, settings, D, W, H, GAP });
  writeFileSync(page, `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>html,body{margin:0;background:#111}.f{position:absolute;top:0;overflow:hidden}</style>
${["library/loop-model.js", "library/css-renderer.js"].map((p) => `<script src="${src(p)}"></script>`).join("\n")}
</head><body><script>
const { loop, settings, D, W, H, GAP } = ${data.replace(/</g, "\\u003c")};
[D, 0].forEach((t, i) => {
  const f = document.createElement("div");
  f.className = "f";
  Object.assign(f.style, { left: i * (W + GAP) + "px", width: W + "px", height: H + "px" });
  const el = f.appendChild(document.createElement("div"));
  document.body.appendChild(f);
  CssRenderer.mount(el, { frame: loop.frame, screen: loop.screen, settings })(LoopModel.sceneAt(loop, t));
});
</script></body></html>`);
  const browser = await puppeteer.launch({
    executablePath: spawnSync(process.execPath, [hfBin, "browser", "path"], { encoding: "utf8" }).stdout.trim(),
    headless: true, args: ["--hide-scrollbars", "--allow-file-access-from-files"],
  });
  try {
    const tab = await browser.newPage();
    await tab.setViewport({ width: 2 * W + GAP, height: H });
    const errors = [];
    tab.on("pageerror", (e) => errors.push(e.message));
    await tab.goto(pathToFileURL(page).href, { waitUntil: "load" });
    await tab.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    if (errors.length) throw new Error(`Seam image: ${errors.join("; ")}`);
    await tab.screenshot({ path: file });
  } finally {
    await browser.close();
    rmSync(page, { force: true });
  }
}

// Checks a Bookend's Seam at a Frame size and frame rate and writes its
// t = D | t = 0 image. Returns the Loop model's verdict, plus the Loop's shape;
// a Tour (or a Loop with no shape) is not checked and gets no image.
export async function checkSeam({ project, entry, size, fps = 60, image }) {
  const root = resolve(project);
  const html = readFileSync(resolve(root, entry), "utf8");
  const { shape, duration, settings, loop } = readLoop(root, html, size || primaryFrameSize(html));
  if (shape !== "bookend") return { shape, checked: false };
  const verdict = globalThis.LoopModel.seamOf(loop, { fps, duration });
  if (image) await seamImage(root, loop, settings, duration, image);
  return { shape, checked: true, ...verdict };
}
