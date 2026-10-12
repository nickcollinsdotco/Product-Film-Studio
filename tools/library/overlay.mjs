// Focus area overlay: draws a Screen's Focus areas from its sidecar
// <screen>.areas.json (1x px boxes at layoutWidth; loops ticket 09) as labelled
// boxes on the Screen at its real resolution, as one image for approval.
// `whole` is built in and isn't drawn.
// Usage: node tools/library/overlay.mjs <screen-image> [--out <file>]
//   e.g. node tools/library/overlay.mjs fixtures/hold-loop/screens/fixture.png
// Default output: renders/overlays/<screen>.areas.png (git-ignored: Screens can be client material).
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COLOURS = ["#ff2d55", "#00c7be", "#ffcc00", "#af52de", "#34c759", "#ff9500", "#0a84ff"];
const STROKE = 4, FONT = 22; // in 1x px, scaled with the Screen
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// As library/shot.js names it (plus Windows separators).
export const sidecarOf = (screen) => screen.replace(/\.[^./\\]+$/, "") + ".areas.json";

export async function overlayAreas({ screen, out }) {
  const screenPath = resolve(screen);
  const sidecar = sidecarOf(screenPath);
  if (!existsSync(sidecar)) throw new Error(`No Focus areas sidecar at ${sidecar}`);
  const { layoutWidth, areas = {} } = JSON.parse(readFileSync(sidecar, "utf8"));
  if (!(layoutWidth > 0)) throw new Error(`${sidecar} needs a positive layoutWidth (the Screen's layout width in 1x px)`);
  const names = Object.keys(areas).filter((name) => name !== "whole");
  if (!names.length) throw new Error(`${sidecar} has no areas`);

  const { width, height } = await sharp(screenPath).metadata();
  const k = width / layoutWidth, screenH = height / k; // k: image px per 1x px
  const warnings = [];
  const boxes = names.map((name) => {
    const b = areas[name];
    if (![b?.x, b?.y, b?.w, b?.h].every(Number.isFinite) || b.w <= 0 || b.h <= 0)
      throw new Error(`Focus area "${name}" in ${sidecar} needs numeric x, y, w, h with w and h above 0`);
    const right = b.x + b.w, bottom = b.y + b.h;
    if (b.x < 0 || b.y < 0 || right > layoutWidth + 0.5 || bottom > screenH + 0.5)
      warnings.push(`"${name}" runs past the Screen (1x box ends at ${right}×${bottom}; Screen is ${layoutWidth}×${Math.round(screenH)} at layoutWidth ${layoutWidth})`);
    return { name, x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k };
  });

  // Strokes sit inside each box, so its edges land on the box's bounds. The label
  // tab sits above the top-left corner, or just inside it where there's no room above,
  // and is kept inside the Screen's right edge. A tab that would cover an earlier
  // one (areas sharing a corner) moves right past it.
  const sw = STROKE * k, fs = FONT * k, pad = 4 * k, tabH = fs + 2 * pad;
  const tabs = [];
  const marks = boxes.map((b, i) => {
    const c = COLOURS[i % COLOURS.length];
    const tabW = b.name.length * fs * 0.62 + 2 * pad;
    const fits = (x) => Math.max(0, Math.min(x, width - tabW));
    const overlaps = (t, x, y) => x < t.x + t.w && t.x < x + tabW && y < t.y + tabH && t.y < y + tabH;
    const covers = (x, y) => tabs.some((t) => overlaps(t, x, y));
    let tabY = b.y - tabH >= 0 ? b.y - tabH : b.y, tabX = fits(b.x);
    for (const t of tabs.toSorted((p, q) => p.x - q.x)) if (overlaps(t, tabX, tabY)) tabX = t.x + t.w;
    // No room to the right: drop a row at a time until the tab is clear.
    if (tabX + tabW > width) for (tabX = fits(b.x); covers(tabX, tabY); tabY += tabH);
    tabs.push({ x: tabX, y: tabY, w: tabW });
    return `<rect x="${b.x + sw / 2}" y="${b.y + sw / 2}" width="${Math.max(0, b.w - sw)}" height="${Math.max(0, b.h - sw)}" fill="none" stroke="${c}" stroke-width="${sw}"/>
  <rect x="${tabX}" y="${tabY}" width="${tabW}" height="${tabH}" fill="${c}"/>
  <text x="${tabX + pad}" y="${tabY + pad + fs * 0.8}" font-family="Segoe UI, Arial, sans-serif" font-size="${fs}" font-weight="700" fill="#000">${esc(b.name)}</text>`;
  }).join("\n  ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n  ${marks}\n</svg>`;

  const output = resolve(out || join(repo, "renders", "overlays", `${basename(screenPath, extname(screenPath))}.areas.png`));
  mkdirSync(dirname(output), { recursive: true });
  await sharp(screenPath).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).toFile(output);
  return { output, width, height, scale: k, areas: boxes, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outAt = args.indexOf("--out");
  const out = outAt >= 0 ? args[outAt + 1] : undefined;
  const screen = args.find((a, i) => !a.startsWith("--") && (outAt < 0 || i !== outAt + 1));
  if (!screen || (outAt >= 0 && !out)) {
    console.error("Usage: node tools/library/overlay.mjs <screen-image> [--out <file>]");
    process.exit(1);
  }
  overlayAreas({ screen, out })
    .then((r) => {
      for (const w of r.warnings) console.warn(`Warning: ${w}`);
      console.log(`${r.areas.length} Focus areas on ${r.width}x${r.height} (${r.scale}x) -> ${r.output}`);
    })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
