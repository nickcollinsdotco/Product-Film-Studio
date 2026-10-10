// Quick Loop: a local page to turn one screenshot (or a captured URL) into a scrolling MP4.
// Usage: npm run quick   (then open http://localhost:4321)
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, copyFileSync, rmSync, readdirSync, utimesSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import puppeteer from "puppeteer-core";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const out = join(repo, "renders", "quick");
const uploads = join(out, "uploads");
const jobsDir = join(out, "jobs");
for (const d of [uploads, jobsDir]) mkdirSync(d, { recursive: true });

const PORT = Number(process.env.PORT || 4321);
const MAX_W = 3840, MAX_PIXELS = 50e6; // keeps Chrome's decoded image well under a few hundred MB
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
const hfBin = join(repo, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
const template = () => readFileSync(join(here, "composition.html"), "utf8");
const jobs = new Map();
const UPLOAD_DAYS = 7; // uploads unused for this long are deleted when the server starts

// Common cookie banners and consent popups, hidden on every URL capture.
const HIDE_DEFAULT = [
  "#onetrust-consent-sdk", "#CybotCookiebotDialog", "#usercentrics-root", "#cookiescript_injected", ".cc-window",
  "#didomi-host", ".qc-cmp2-container", "#truste-consent-track", ".osano-cm-window", "#hs-eu-cookie-confirmation",
  "[id*=cookie-banner]", "[class*=cookie-banner]", "[id*=cookie-consent]", "[class*=cookie-consent]",
  "[aria-label*=cookie i][role=dialog]", "#intercom-container", ".intercom-lightweight-app", "#hubspot-messages-iframe-container",
];
// Capture width per Screen viewport: CSS px and device scale.
const CAPTURE = { "9:19.5": [390, 3], "4:3": [1024, 2] };

function pruneUploads() {
  const cutoff = Date.now() - UPLOAD_DAYS * 864e5;
  for (const f of readdirSync(uploads)) {
    const p = join(uploads, f);
    if (statSync(p).mtimeMs < cutoff) rmSync(p, { force: true });
  }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4", ".json": "application/json" };

function composition({ width, height, duration, src, config }) {
  return template()
    .replaceAll("__W__", String(width)).replaceAll("__H__", String(height))
    .replaceAll("__D__", String(duration)).replace("__SRC__", src)
    .replace("/*__CONFIG__*/", config ? `window.__quickConfig = ${JSON.stringify(config)};` : "");
}

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "content-type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function serveFile(res, base, rel) {
  const file = resolve(base, decodeURIComponent(rel));
  if (!file.startsWith(base + sep) || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: "not found" });
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "content-length": statSync(file).size });
  createReadStream(file).pipe(res);
}

const readBody = (req) => new Promise((ok, fail) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c)).on("end", () => ok(Buffer.concat(chunks))).on("error", fail);
});

async function upload(buf) {
  const id = createHash("sha1").update(buf).digest("hex").slice(0, 12);
  const file = join(uploads, `${id}.jpg`);
  if (existsSync(file)) utimesSync(file, new Date(), new Date());
  else {
    const meta = await sharp(buf, { limitInputPixels: false }).metadata();
    let w = Math.min(meta.width, MAX_W);
    if (w * (meta.height * (w / meta.width)) > MAX_PIXELS) w = Math.floor(Math.sqrt(MAX_PIXELS * meta.width / meta.height));
    await sharp(buf, { limitInputPixels: false }).resize({ width: w, withoutEnlargement: true }).flatten({ background: "#fff" })
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(file);
  }
  const { width, height } = await sharp(file, { limitInputPixels: false }).metadata();
  return { id, url: `/uploads/${id}.jpg`, w: width, h: height };
}

let browserPath;
async function capture({ url, viewport, hide }) {
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  browserPath ??= spawnSync(process.execPath, [hfBin, "browser", "path"], { encoding: "utf8" }).stdout.trim();
  const [width, scale] = CAPTURE[viewport] || [1440, 2];
  const browser = await puppeteer.launch({ executablePath: browserPath, headless: true, args: ["--hide-scrollbars"] });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "accept-language": "en-GB,en;q=0.9" });
    await page.setViewport({ width, height: Math.round(width * 0.625), deviceScaleFactor: scale });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 }).catch((e) => { if (!/timeout/i.test(e.message)) throw e; });
    const selectors = [...HIDE_DEFAULT, ...String(hide || "").split(",").map((x) => x.trim()).filter(Boolean)];
    await page.addStyleTag({ content: `${selectors.join(",")} { display: none !important; }
      html, body { scroll-behavior: auto !important; overflow-anchor: none; }` });
    // Scroll to the bottom so lazy images and scroll-triggered sections load, then settle at the top.
    await page.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 60 && window.scrollY + innerHeight < document.documentElement.scrollHeight - 2; i++) {
        window.scrollBy(0, innerHeight * 0.8); await wait(250);
      }
      window.scrollTo(0, 0); await wait(800);
    });
    // Custom consent banners: any fixed or sticky box that talks about cookies or consent.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) {
        const pos = getComputedStyle(el).position;
        if ((pos === "fixed" || pos === "sticky") && el.innerText.length < 2000 && /cookie|consent|gdpr|privacy settings/i.test(el.innerText))
          el.style.setProperty("display", "none", "important");
      }
    });
    await page.evaluate(() => document.fonts.ready);
    const shot = await page.screenshot({ fullPage: true, type: "png" });
    return await upload(Buffer.from(shot));
  } finally {
    await browser.close();
  }
}

function render(cfg) {
  const id = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 6);
  const dir = join(jobsDir, id);
  mkdirSync(join(dir, "assets"), { recursive: true });
  const imgId = cfg.image.url.split("/").pop();
  copyFileSync(join(uploads, imgId), join(dir, "assets", imgId));
  const src = `assets/${imgId}`;
  const config = { ...cfg, image: { ...cfg.image, url: src } };
  writeFileSync(join(dir, "index.html"), composition({ ...config, src, config }));
  writeFileSync(join(dir, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" } }, null, 2));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: `quick-${id}`, name: `quick-${id}` }));

  const name = (cfg.name || "loop").replace(/[^\w.-]+/g, "-").slice(0, 40) || "loop";
  const output = join(out, `${name}-${id}.mp4`);
  const job = { id, status: "rendering", log: "", output: null, started: Date.now() };
  jobs.set(id, job);
  const env = { ...process.env, PATH: `${process.env.PATH};${join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links")}` };
  const child = spawn(process.execPath, [hfBin, "render", dir, "--output", output, "--quality", cfg.quality || "looks"], { cwd: repo, env });
  const onData = (d) => { job.log = (job.log + d.toString()).slice(-4000); };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  child.on("close", (code) => {
    job.status = code === 0 && existsSync(output) ? "done" : "failed";
    if (job.status === "done") {
      job.output = `/renders/${output.slice(out.length + 1)}`;
      rmSync(dir, { recursive: true, force: true }); // the job copies the full screenshot; keep it only when a render fails
    }
    job.seconds = Math.round((Date.now() - job.started) / 1000);
  });
  return job;
}

pruneUploads();
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    if (req.method === "GET" && p === "/") return send(res, 200, readFileSync(join(here, "app.html")), TYPES[".html"]);
    if (req.method === "GET" && p === "/composition.html")
      return send(res, 200, composition({ width: 1920, height: 1080, duration: 8, src: BLANK }), TYPES[".html"]);
    if (req.method === "GET" && p.startsWith("/uploads/")) return serveFile(res, uploads, p.slice(9));
    if (req.method === "GET" && p.startsWith("/renders/")) return serveFile(res, out, p.slice(9));
    if (req.method === "POST" && p === "/capture") return send(res, 200, await capture(JSON.parse((await readBody(req)).toString())));
    if (req.method === "POST" && p === "/upload") return send(res, 200, await upload(await readBody(req)));
    if (req.method === "POST" && p === "/render") {
      const cfg = JSON.parse((await readBody(req)).toString());
      if (!cfg.image?.url) return send(res, 400, { error: "no image" });
      return send(res, 200, render(cfg));
    }
    if (req.method === "GET" && p.startsWith("/jobs/")) {
      const job = jobs.get(p.slice(6));
      return job ? send(res, 200, job) : send(res, 404, { error: "no such job" });
    }
    send(res, 404, { error: "not found" });
  } catch (e) {
    send(res, 500, { error: String(e?.message || e) });
  }
}).listen(PORT, () => console.log(`Quick Loop: http://localhost:${PORT}  (renders -> ${out})`));
