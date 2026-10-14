// Quick Loop: a local page to turn one screenshot (or a captured URL) into a scrolling MP4.
// Usage: npm run quick   (then open http://localhost:4321)
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, copyFileSync, rmSync, readdirSync, utimesSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { capturePageWithLayout } from "../library/capture.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const out = join(repo, "renders", "quick");
const uploads = join(out, "uploads");
const jobsDir = join(out, "jobs");
for (const d of [uploads, jobsDir]) mkdirSync(d, { recursive: true });

const PORT = Number(process.env.PORT || 4321);
const MAX_W = 3840, MAX_PIXELS = 50e6; // keeps Chrome's decoded image well under a few hundred MB
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // 1x1 transparent
const hfBin = join(repo, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
const template = () => readFileSync(join(here, "composition.html"), "utf8");
// The UI generation runtime (transitions.dev) for the build intro, inlined so a render job needs no extra files.
const vendor = join(repo, "tools", "library", "vendor");
const uiGeneration = () => `<style>${readFileSync(join(vendor, "ui-generation.css"), "utf8")}</style>
<script>(() => {
${
  readFileSync(join(vendor, "ui-generation.js"), "utf8").replace(/^export \{[^}]*\};?$/m, "").replace(/^export /gm, "")}
})();</script>`;
const jobs = new Map();
const UPLOAD_DAYS = 7; // uploads unused for this long are deleted when the server starts

// Capture width per Screen viewport: CSS px and device scale.
const CAPTURE = { "9:19.5": [390, 3], "4:3": [1024, 2] };
// How much of the page's top the layout map reads, as a multiple of the capture width: enough for any viewport's first screen.
const LAYOUT_HEIGHT = { "9:19.5": 19.5 / 9 };

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
    .replace("/*__CONFIG__*/", () => (config ? `window.__quickConfig = ${JSON.stringify(config).replace(/</g, "\\u003c")};` : ""))
    .replace("<!--__UIGEN__-->", () => uiGeneration());
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

// URL capture: the Library's (cookie banners and listed selectors hidden), sized by Screen viewport,
// with the layout map of its first screen for the build intro, kept beside the image.
async function capture({ url, viewport, hide, theme }) {
  const [width, scale] = CAPTURE[viewport] || [1440, 2];
  const layoutHeight = Math.round(width * (LAYOUT_HEIGHT[viewport] || 0.8));
  const { png, layout } = await capturePageWithLayout({ url, width, scale, hide, theme, layoutHeight });
  const img = await upload(png);
  writeFileSync(join(uploads, `${img.id}.layout.json`), JSON.stringify(layout));
  return { ...img, layout };
}

function render(cfg) {
  const id = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 6);
  const dir = join(jobsDir, id);
  mkdirSync(join(dir, "assets"), { recursive: true });
  const imgId = cfg.image.url.split("/").pop();
  copyFileSync(join(uploads, imgId), join(dir, "assets", imgId));
  const src = `assets/${imgId}`;
  const config = { ...cfg, image: { ...cfg.image, url: src } };
  // `length` is the whole Loop as the composition plays it, the build intro included
  writeFileSync(join(dir, "index.html"), composition({ ...config, duration: cfg.length || cfg.duration, src, config }));
  writeFileSync(join(dir, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" } }, null, 2));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: `quick-${id}`, name: `quick-${id}` }));

  const name = (cfg.name || "loop").replace(/[^\w.-]+/g, "-").slice(0, 40) || "loop";
  const output = join(out, `${name}-${id}.mp4`);
  const job = { id, status: "rendering", log: "", output: null, started: Date.now() };
  jobs.set(id, job);
  const env = { ...process.env, PATH: `${process.env.PATH};${join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links")}` };
  const run = (cmd, args, next) => {
    const child = spawn(cmd, args, { cwd: repo, env });
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", (e) => onData(String(e)));
    child.on("close", (code) => (code === 0 ? next() : finish()));
  };
  const onData = (d) => { job.log = (job.log + d.toString()).slice(-4000); };
  const finish = () => {
    job.status = existsSync(output) ? "done" : "failed";
    if (job.status === "done") {
      job.output = `/renders/${output.slice(out.length + 1)}`;
      rmSync(dir, { recursive: true, force: true }); // the job copies the full screenshot; keep it only when a render fails
    }
    job.seconds = Math.round((Date.now() - job.started) / 1000);
  };
  const quality = cfg.quality || "looks";
  if (quality === "draft") run(process.execPath, [hfBin, "render", dir, "--output", output, "--quality", "draft"], finish);
  else {
    // Lossless frames, then our own encode: an RGB->YUV conversion with error diffusion keeps dark
    // shadows and glows from banding, which HyperFrames' encode (even at CRF 4) does not.
    const frames = join(dir, "frames");
    run(process.execPath, [hfBin, "render", dir, "--format", "png-sequence", "--output", frames], () =>
      run("ffmpeg", ["-v", "error", "-y", "-framerate", "60", "-i", join(frames, "frame_%06d.png"),
        "-vf", "scale=out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int+error_diffusion,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", quality === "delivery" ? "10" : "16",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", output], finish));
  }
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
