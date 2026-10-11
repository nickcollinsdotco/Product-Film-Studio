// Export: renders a Loop at a Frame size, length and frame rate through
// HyperFrames, via a temporary copy of its entry with the target size and
// timing stamped in (local `hyperframes render` can't override a composition's
// size), then encodes the portfolio Rendition and deletes the temporary files
// (ADR-0012). A Bookend's Seam is checked first, on the copy that renders
// (ADR-0011 as amended): a failure blocks a Final render and warns on a Draft.
// Tours skip it. The Loop's shape is data-loop-shape on its entry root.
// Usage: node tools/library/export.mjs <project-dir> <loop-entry> --draft|--final
//          [--size <preset>|<W>x<H>] [--length <seconds>] [--fps <rate>]
//   e.g. node tools/library/export.mjs fixtures/hold-loop films/fixture/hold.html --draft --size Story
// Size defaults to the Loop's primary Frame size; a Draft renders at half of it.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { checkSeam } from "./seam.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const hfBin = join(repo, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
const even = (x) => Math.max(2, Math.round(x / 2) * 2);
const DEFAULT_FPS = 60; // ADR-0012; ticket 08 checks it against 30

export const PRESETS = {
  Landscape: { width: 1600, height: 900 },
  Story: { width: 900, height: 1600 },
  Square: { width: 1600, height: 1600 },
  Portrait: { width: 1280, height: 1600 },
  Classic: { width: 1600, height: 1200 },
};

// The portfolio Rendition (spec): 5 Mbps, lowered only when a long Loop would
// pass the hard 6 MB limit. 6 MB is taken as 6,000,000 bytes, the stricter reading.
export const RENDITION_LIMIT = 6_000_000;
const RENDITION_BITRATE = 5_000_000;
const HEADROOM = 0.95; // for the container and the encoder's overshoot
const MIN_BITRATE = 100_000; // below this x264 may refuse to open; the size check fails it instead

// A Frame size from a preset name (any case) or W×H. H.264 at yuv420p needs even sides.
export function frameSize(spec) {
  const preset = Object.keys(PRESETS).find((k) => k.toLowerCase() === String(spec).toLowerCase());
  if (preset) return { ...PRESETS[preset] };
  const m = String(spec).match(/^(\d+)\s*[x×]\s*(\d+)$/i);
  if (!m) throw new Error(`Unknown Frame size "${spec}": use a preset (${Object.keys(PRESETS).join(", ")}) or W×H, e.g. 1080x1350`);
  const [width, height] = [Number(m[1]), Number(m[2])];
  if (width % 2 || height % 2 || !width || !height) throw new Error(`Frame size ${width}×${height}: H.264 needs an even width and height`);
  return { width, height };
}

// The Loop's primary Frame size is its entry root's size (the first data-width/height).
export function primaryFrameSize(html) {
  const w = html.match(/data-width="(\d+)"/), h = html.match(/data-height="(\d+)"/);
  if (!w || !h) throw new Error("Loop entry has no data-width/data-height on its root");
  return { width: Number(w[1]), height: Number(h[1]) };
}

const loopDuration = (html) => {
  const d = html.match(/<div\b[^>]*data-composition-id[^>]*>/)?.[0].match(/data-duration="([^"]*)"/);
  if (!d) throw new Error("Loop entry has no data-duration on its root");
  return parseFloat(d[1]);
};

// Stamps a size on the root, every host clip and the viewport meta.
export function stampSize(html, { width, height }) {
  return html
    .replace(/data-width="\d+"/g, `data-width="${width}"`)
    .replace(/data-height="\d+"/g, `data-height="${height}"`)
    .replace(/(<meta name="viewport" content=")[^"]*"/, `$1width=${width}, height=${height}"`);
}

// Scales the Loop to a new length: the root's duration and every host clip's
// start and duration, by the same factor. Shots stretch to their host clips, so
// the motion scales with them (ADR-0012). Transitions are cuts for
// now; Edit-owned Transition tweens get scaled here when the first one exists.
export function scaleLength(html, length) {
  if (!(length > 0) || !Number.isFinite(length)) throw new Error(`A Loop's length must be a positive number of seconds, not ${length}`);
  const k = length / loopDuration(html);
  const scaled = (v) => String(Number((parseFloat(v) * k).toFixed(6)));
  return html.replace(/<div\b[^>]*data-composition-id[^>]*>/g, (tag) =>
    tag.replace(/(data-(?:start|duration)=")([^"]*)"/g, (_, attr, v) => `${attr}${scaled(v)}"`));
}

// The Rendition's video bitrate: 5 Mbps unless the Loop is too long to fit the limit at it.
export function renditionBitrate(duration, maxBytes = RENDITION_LIMIT) {
  return Math.min(RENDITION_BITRATE, Math.floor((maxBytes * 8 * HEADROOM) / duration));
}

function run(cmd, args, quiet) {
  return new Promise((ok, fail) => {
    const child = spawn(cmd, args, { cwd: repo, stdio: ["ignore", quiet ? "pipe" : "inherit", quiet ? "pipe" : "inherit"] });
    let log = "";
    child.stdout?.on("data", (d) => { log = (log + d).slice(-4000); });
    child.stderr?.on("data", (d) => { log = (log + d).slice(-4000); });
    child.on("error", (e) => fail(e.code === "ENOENT" ? new Error(`${cmd} isn't on the PATH`) : e));
    child.on("close", (code) => (code === 0 ? ok() : fail(new Error(`${basename(cmd)} failed (${code})\n${log}`))));
  });
}

// The portfolio Rendition: H.264 High, yuv420p, faststart, no audio, two-pass to
// the target bitrate. Its actual size is checked: an overshoot gets one re-encode
// at a bitrate lowered by the overshoot, and a file still over is deleted.
async function encodeRendition(input, output, { duration, maxBytes, work, quiet }) {
  const encode = async (target) => {
    const bitrate = Math.max(MIN_BITRATE, Math.floor(target));
    const common = ["-y", "-v", "error", "-i", input, "-an", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p",
      "-b:v", String(bitrate), "-passlogfile", join(work, "x264")];
    await run("ffmpeg", [...common, "-pass", "1", "-f", "null", "-"], quiet);
    await run("ffmpeg", [...common, "-pass", "2", "-movflags", "+faststart", output], quiet);
    return { bitrate, size: statSync(output).size };
  };
  let { bitrate, size } = await encode(renditionBitrate(duration, maxBytes));
  if (size > maxBytes && bitrate > MIN_BITRATE) ({ bitrate, size } = await encode(bitrate * (maxBytes / size) * HEADROOM));
  if (size > maxBytes) {
    rmSync(output, { force: true });
    throw new Error(`The Rendition ${basename(output)} came out at ${size} bytes, over the ${maxBytes}-byte limit, even at ${Math.round(bitrate / 1000)} kbps. Shorten the Loop or export a smaller Frame size. Nothing was written.`);
  }
  return bitrate;
}

export async function exportLoop({ project, entry, size: sizeSpec, length, fps = DEFAULT_FPS, final = false, outDir, maxBytes = RENDITION_LIMIT, quiet = false }) {
  const root = resolve(project);
  const entryPath = resolve(root, entry);
  if (!existsSync(entryPath)) throw new Error(`No Loop entry at ${entryPath}`);
  if (!existsSync(join(root, "library", "library.json"))) throw new Error(`Library not synced into ${root}: run tools/library/sync.mjs`);
  if (!(fps > 0 && fps <= 240)) throw new Error(`Frame rate ${fps}: use 1 to 240`);

  const html = readFileSync(entryPath, "utf8");
  const fullSize = sizeSpec ? frameSize(sizeSpec) : primaryFrameSize(html);
  const size = final ? fullSize : { width: even(fullSize.width / 2), height: even(fullSize.height / 2) };
  const timedHtml = length != null ? scaleLength(html, length) : html;
  const duration = loopDuration(timedHtml);
  const loop = basename(entryPath, ".html");
  const out = resolve(outDir || join(repo, "renders", "library", basename(root)));
  mkdirSync(out, { recursive: true });
  // Length and frame rate join the name only when overridden, so no two exports share one.
  const name = [loop, `${size.width}x${size.height}`, final ? "final" : "draft", length != null && `${duration}s`, fps !== DEFAULT_FPS && `${fps}fps`].filter(Boolean).join("-");
  const output = join(out, `${name}.mp4`);

  // Next to the entry, so its paths resolve exactly as the entry's do.
  const temp = join(dirname(entryPath), `.${loop}.export-${process.pid}-${Date.now()}.html`);
  const work = mkdtempSync(join(tmpdir(), "library-export-"));
  writeFileSync(temp, stampSize(timedHtml, size));
  try {
    // The Seam check, before anything renders.
    const warnings = [];
    const refuseOrWarn = (message) => {
      if (final) throw new Error(`${message}\nA Final render is blocked.`);
      warnings.push(message);
      if (!quiet) console.warn(`Warning: ${message}`);
    };
    const seamImage = join(out, `${name}-seam.png`);
    const seam = await checkSeam({ project: root, entry: temp, size, fps, image: seamImage });
    if (seam.shape !== "bookend" && seam.shape !== "tour") refuseOrWarn(`${loop} has no Loop shape (data-loop-shape="bookend" or "tour" on its root), so its Seam isn't checked.`);
    if (seam.checked && !seam.pass) refuseOrWarn(`Seam check failed for ${loop} (see ${seamImage}):\n  ${seam.failures.join("\n  ")}`);

    const render = join(work, "render.mp4");
    await run(process.execPath, [hfBin, "render", root, "--composition", relative(root, temp).replaceAll("\\", "/"), "--output", render,
      "--fps", String(fps), "--crf", "10", "--quiet"], quiet);
    const bitrate = await encodeRendition(render, output, { duration, maxBytes, work, quiet });
    return { output, ...size, duration, fps, bitrate, seam: seam.checked ? { ...seam, image: seamImage } : null, warnings };
  } finally {
    rmSync(temp, { force: true });
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const usage = "Usage: node tools/library/export.mjs <project-dir> <loop-entry> --draft|--final [--size <preset>|<W>x<H>] [--length <seconds>] [--fps <rate>]";
  let args;
  try {
    args = parseArgs({ allowPositionals: true, options: { draft: { type: "boolean" }, final: { type: "boolean" }, size: { type: "string" }, length: { type: "string" }, fps: { type: "string" } } });
  } catch (e) {
    console.error(`${e.message}\n${usage}`);
    process.exit(1);
  }
  const { positionals: [project, entry], values: v } = args;
  if (!project || !entry || !v.final === !v.draft) {
    console.error(usage);
    process.exit(1);
  }
  exportLoop({ project, entry, final: !!v.final, size: v.size, length: v.length != null ? Number(v.length) : undefined, fps: v.fps != null ? Number(v.fps) : DEFAULT_FPS })
    .then((r) => {
      if (r.seam?.pass) console.log(`Seam check passed; check it by eye: ${r.seam.image}`);
      console.log(`${v.final ? "Final" : "Draft"} ${r.width}x${r.height}, ${r.duration}s @ ${r.fps}fps, ${Math.round(r.bitrate / 1000)} kbps -> ${r.output}`);
    })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
