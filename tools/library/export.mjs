// Export: renders a Loop through HyperFrames via a temporary copy of its entry
// with the target size stamped in (local `hyperframes render` can't override a
// composition's size), then deletes the copy (ADR-0012). A Bookend's Seam is
// checked first (ADR-0011 as amended): a failure blocks a Final render and warns
// on a Draft. Tours skip it. The Loop's shape is data-loop-shape on its entry root.
// Usage: node tools/library/export.mjs <project-dir> <loop-entry> --draft|--final
//   e.g. node tools/library/export.mjs fixtures/hold-loop films/fixture/hold.html --draft
// For now: Draft (half the Loop's primary Frame size) or Final (full size), 60fps.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkSeam } from "./seam.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const hfBin = join(repo, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
const even = (x) => Math.max(2, Math.round(x / 2) * 2);

// The Loop's primary Frame size is its entry root's size (the first data-width/height).
export function primaryFrameSize(html) {
  const w = html.match(/data-width="(\d+)"/), h = html.match(/data-height="(\d+)"/);
  if (!w || !h) throw new Error("Loop entry has no data-width/data-height on its root");
  return { width: Number(w[1]), height: Number(h[1]) };
}

// Stamps a size on the root, every host clip and the viewport meta.
export function stampSize(html, { width, height }) {
  return html
    .replace(/data-width="\d+"/g, `data-width="${width}"`)
    .replace(/data-height="\d+"/g, `data-height="${height}"`)
    .replace(/(<meta name="viewport" content=")[^"]*"/, `$1width=${width}, height=${height}"`);
}

export async function exportLoop({ project, entry, final = false, fps = 60, outDir, quiet = false }) {
  const root = resolve(project);
  const entryPath = resolve(root, entry);
  if (!existsSync(entryPath)) throw new Error(`No Loop entry at ${entryPath}`);
  if (!existsSync(join(root, "library", "library.json"))) throw new Error(`Library not synced into ${root}: run tools/library/sync.mjs`);

  const html = readFileSync(entryPath, "utf8");
  const primary = primaryFrameSize(html);
  const size = final ? primary : { width: even(primary.width / 2), height: even(primary.height / 2) };
  const loop = basename(entryPath, ".html");
  const out = resolve(outDir || join(repo, "renders", "library", basename(root)));
  mkdirSync(out, { recursive: true });
  const name = `${loop}-${size.width}x${size.height}-${final ? "final" : "draft"}`;
  const output = join(out, `${name}.mp4`);

  // The Seam check, before anything renders.
  const warnings = [];
  const refuseOrWarn = (message) => {
    if (final) throw new Error(`${message}\nA Final render is blocked.`);
    warnings.push(message);
    if (!quiet) console.warn(`Warning: ${message}`);
  };
  const seamImage = join(out, `${name}-seam.png`);
  const seam = await checkSeam({ project: root, entry: entryPath, size, fps, image: seamImage });
  if (seam.shape !== "bookend" && seam.shape !== "tour") refuseOrWarn(`${loop} has no Loop shape (data-loop-shape="bookend" or "tour" on its root), so its Seam isn't checked.`);
  if (seam.checked && !seam.pass) refuseOrWarn(`Seam check failed for ${loop} (see ${seamImage}):\n  ${seam.failures.join("\n  ")}`);

  // Next to the entry, so its paths resolve exactly as the entry's do.
  const temp = join(dirname(entryPath), `.${loop}.export-${process.pid}-${Date.now()}.html`);
  writeFileSync(temp, stampSize(html, size));
  try {
    await new Promise((ok, fail) => {
      const args = [hfBin, "render", root, "--composition", relative(root, temp).replaceAll("\\", "/"), "--output", output, "--fps", String(fps), "--quiet"];
      const child = spawn(process.execPath, args, { cwd: repo, stdio: ["ignore", quiet ? "pipe" : "inherit", quiet ? "pipe" : "inherit"] });
      let log = "";
      child.stdout?.on("data", (d) => { log = (log + d).slice(-4000); });
      child.stderr?.on("data", (d) => { log = (log + d).slice(-4000); });
      child.on("error", fail);
      child.on("close", (code) => (code === 0 && existsSync(output) ? ok() : fail(new Error(`hyperframes render failed (${code})\n${log}`))));
    });
  } finally {
    rmSync(temp, { force: true });
  }
  return { output, ...size, fps, seam: seam.checked ? { ...seam, image: seamImage } : null, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [project, entry] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const final = process.argv.includes("--final");
  if (!project || !entry || final === process.argv.includes("--draft")) {
    console.error("Usage: node tools/library/export.mjs <project-dir> <loop-entry> --draft|--final");
    process.exit(1);
  }
  exportLoop({ project, entry, final })
    .then((r) => {
      if (r.seam?.pass) console.log(`Seam check passed; check it by eye: ${r.seam.image}`);
      console.log(`${final ? "Final" : "Draft"} ${r.width}x${r.height} @ ${r.fps}fps -> ${r.output}`);
    })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
