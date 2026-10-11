// Export: renders a Loop through HyperFrames via a temporary copy of its entry
// with the target size stamped in (local `hyperframes render` can't override a
// composition's size), then deletes the copy (ADR-0012).
// Usage: node tools/library/export.mjs <project-dir> <loop-entry> --draft
//   e.g. node tools/library/export.mjs fixtures/hold-loop films/fixture/hold.html --draft
// For now: Draft only (half the Loop's primary Frame size), 60fps.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

export async function exportLoop({ project, entry, fps = 60, outDir, quiet = false }) {
  const root = resolve(project);
  const entryPath = resolve(root, entry);
  if (!existsSync(entryPath)) throw new Error(`No Loop entry at ${entryPath}`);
  if (!existsSync(join(root, "library", "library.json"))) throw new Error(`Library not synced into ${root}: run tools/library/sync.mjs`);

  const html = readFileSync(entryPath, "utf8");
  const primary = primaryFrameSize(html);
  const size = { width: even(primary.width / 2), height: even(primary.height / 2) };
  const loop = basename(entryPath, ".html");
  const out = resolve(outDir || join(repo, "renders", "library", basename(root)));
  mkdirSync(out, { recursive: true });
  const output = join(out, `${loop}-${size.width}x${size.height}-draft.mp4`);

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
  return { output, ...size, fps };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [project, entry] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!project || !entry || !process.argv.includes("--draft")) {
    console.error("Usage: node tools/library/export.mjs <project-dir> <loop-entry> --draft");
    process.exit(1);
  }
  exportLoop({ project, entry })
    .then((r) => console.log(`Draft ${r.width}x${r.height} @ ${r.fps}fps -> ${r.output}`))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
