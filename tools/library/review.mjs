// Review page: one static HTML page of a Project's Drafts, for Nick to pick each
// Loop's tilt and judge it against the Steel Hat phone clip at card size
// (ADR-0012 shipping rule; vr-loops ticket 06). Each Loop is a row: its Drafts
// side by side, 0° before 8°, then the Steel Hat clip at the same display height.
// Every video autoplays muted on loop. The page sits beside the Drafts and links
// them, so regenerating it picks up Drafts rendered since.
// Usage: node tools/library/review.mjs <project-dir> [--height <css px>]
//   e.g. node tools/library/review.mjs projects/deo-vr
// Reads and writes renders/library/<project>/ (git-ignored), as export.mjs does.
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const STEEL_HAT = join(repo, "references", "own", "steel-hat-phone.mp4");
// A 640×360 card for 16:9 at this height, so two tilts and the Steel Hat clip fit one row on a 1920 px screen.
const CARD_HEIGHT = 360;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const href = (path) => path.split(/[\\/]/).map(encodeURIComponent).join("/");

// A Draft as export.mjs names it: <loop>-<W>x<H>-draft[-<length>s][-<fps>fps][-tilt<degrees>].mp4.
export function parseDraft(file) {
  const m = file.match(/^(.+)-(\d+)x(\d+)-draft((?:-[^-]+)*?)(?:-tilt(-?[\d.]+))?\.mp4$/);
  if (!m) return null;
  return { file, loop: m[1], width: Number(m[2]), height: Number(m[3]), tilt: m[5] != null ? Number(m[5]) : null, extra: m[4].split("-").filter(Boolean) };
}

const label = (d) => [d.tilt != null ? `${d.tilt}°` : "Loop's own tilt", ...d.extra, `${d.width}×${d.height}`].join(" · ");
const video = (src, caption) =>
  `<figure><video src="${esc(href(src))}" autoplay muted loop playsinline></video><figcaption>${esc(caption)}</figcaption></figure>`;

// The page for a set of parsed Drafts. `steelHat` is the clip's path relative to the page, or null if it's missing.
export function reviewPage(drafts, { steelHat, height = CARD_HEIGHT, title = "Review" }) {
  const loops = Map.groupBy(drafts, (d) => d.loop);
  const reference = steelHat
    ? video(steelHat, "Steel Hat phone clip")
    : `<figure class="missing">No Steel Hat clip: put it at ${esc(relative(repo, STEEL_HAT).replaceAll("\\", "/"))} and regenerate.</figure>`;
  const rows = [...loops.keys()].sort().map((loop) => {
    const own = loops.get(loop).sort((a, b) => (a.tilt ?? -Infinity) - (b.tilt ?? -Infinity) || a.file.localeCompare(b.file));
    return `<section>\n  <h2>${esc(loop)}</h2>\n  <div class="row">\n    ${[...own.map((d) => video(d.file, label(d))), reference].join("\n    ")}\n  </div>\n</section>`;
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  :root { --card-height: ${height}px; color-scheme: dark; }
  body { margin: 32px; background: #161616; color: #ddd; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 24px; }
  h2 { font-size: 15px; font-weight: 600; margin: 0 0 10px; }
  section { margin-bottom: 40px; }
  .row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
  figure { margin: 0; }
  video { display: block; height: var(--card-height); width: auto; border-radius: 12px; background: #000; }
  figcaption { margin-top: 6px; color: #999; }
  .missing { height: var(--card-height); display: grid; place-items: center; padding: 0 24px; border: 1px dashed #555; border-radius: 12px; color: #999; }
</style>
</head>
<body>
<h1>${esc(title)}</h1>
${rows.join("\n")}
</body>
</html>
`;
}

// Writes review.html into the Drafts' folder and returns it with the Drafts it shows.
export function writeReview({ rendersDir, steelHat = STEEL_HAT, height, title }) {
  const dir = resolve(rendersDir);
  const drafts = existsSync(dir) ? readdirSync(dir).map(parseDraft).filter(Boolean) : [];
  if (!drafts.length) throw new Error(`No Drafts in ${dir}: render some with tools/library/export.mjs --draft`);
  const output = join(dir, "review.html");
  const reference = steelHat && existsSync(steelHat) ? relative(dir, resolve(steelHat)) : null;
  writeFileSync(output, reviewPage(drafts, { steelHat: reference, height, title }));
  return { output, drafts: drafts.map((d) => d.file).sort() };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const usage = "Usage: node tools/library/review.mjs <project-dir> [--height <css px>]";
  let args;
  try {
    args = parseArgs({ allowPositionals: true, options: { height: { type: "string" } } });
  } catch (e) {
    console.error(`${e.message}\n${usage}`);
    process.exit(1);
  }
  const { positionals: [project], values: v } = args;
  const height = v.height != null ? Number(v.height) : undefined;
  if (!project || (height != null && !(height > 0))) {
    console.error(usage);
    process.exit(1);
  }
  const name = basename(resolve(project));
  try {
    const r = writeReview({ rendersDir: join(repo, "renders", "library", name), height, title: `${name}: Drafts for review` });
    console.log(`${r.drafts.length} Drafts -> ${r.output}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
