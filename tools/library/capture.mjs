// Screen capture: a live URL frozen as one full-page Screen (ADR-0006), with headless
// Chrome. Common cookie banners and listed selectors are hidden. Quick Loop uses the same capture.
// Usage: node tools/library/capture.mjs <project> <url> --name <name> [--width 1440] [--height <px>] [--scale 2] [--hide <sel,sel>] [--theme light|dark] [--force]
//   e.g. node tools/library/capture.mjs projects/deo-vr https://deovr.com --name home-full --scale 3
// Writes <project>/assets/_source/<name>-<width>@<scale>x.png, beside the Project's other Screens;
// its layout width is <width>, for the Focus areas sidecar.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import puppeteer from "puppeteer-core";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const hfBin = join(repo, "node_modules", "hyperframes", "bin", "hyperframes.mjs");

// Common cookie banners and consent popups, hidden on every capture.
const HIDE_DEFAULT = [
  "#onetrust-consent-sdk", "#CybotCookiebotDialog", "#usercentrics-root", "#cookiescript_injected", ".cc-window",
  "#didomi-host", ".qc-cmp2-container", "#truste-consent-track", ".osano-cm-window", "#hs-eu-cookie-confirmation",
  "[id*=cookie-banner]", "[class*=cookie-banner]", "[id*=cookie-consent]", "[class*=cookie-consent]",
  "[aria-label*=cookie i][role=dialog]", "#intercom-container", ".intercom-lightweight-app", "#hubspot-messages-iframe-container",
  // Consent tools that draw in an iframe, so the text check below can't see them.
  "[id^=sp_message_container]", ".fc-consent-root", "#iubenda-cs-banner", "#termly-code-snippet-support", "#lanyard_root",
  ".cky-consent-container", ".cky-overlay", "#cmplz-cookiebanner-container", "#BorlabsCookieBox", "#cookie-law-info-bar",
  "#cookie-notice", ".truste_overlay", ".truste_box_overlay",
];

// The UI generation runtime (transitions.dev), run in the page to read its layout map.
const uiGeneration = join(repo, "tools", "library", "vendor", "ui-generation.js");

// localStorage keys common theme switches read on load (next-themes, Chakra, Mantine, VueUse, Docusaurus, Starlight and hand-rolled ones).
const THEME_KEYS = ["theme", "color-theme", "colorTheme", "color-mode", "colorMode", "chakra-ui-color-mode",
  "mantine-color-scheme-value", "vueuse-color-scheme", "starlight-theme", "nightwind-mode", "darkMode"];

const hideSelectors = (hide) => String(hide || "").split(",").map((x) => x.trim()).filter(Boolean);

let browserPath;
// The full page as a PNG buffer: `width` CSS px wide at `scale` device px per CSS px.
// `hide` is a comma-separated list of extra selectors; `height` is the viewport's (16:10 by default), which sizes any 100vh sections.
// `theme` "light" or "dark" asks the site for that theme (anything else leaves the site's default).
export async function capturePage(opts) {
  return (await capture(opts)).png;
}

// The same capture plus its layout map: the boxes, text lines and icons in the page's top `layoutHeight`
// CSS px, read by the UI generation runtime so a Loop can open on the page being drawn (Quick Loop's build intro).
export async function capturePageWithLayout({ layoutHeight, ...opts }) {
  return capture({ ...opts, layoutHeight });
}

async function capture({ url, width = 1440, height, scale = 2, hide, theme, layoutHeight }) {
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  browserPath ??= spawnSync(process.execPath, [hfBin, "browser", "path"], { encoding: "utf8" }).stdout.trim();
  const browser = await puppeteer.launch({ executablePath: browserPath, headless: true, args: ["--hide-scrollbars"] });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "accept-language": "en-GB,en;q=0.9" });
    await page.setViewport({ width, height: height || Math.round(width * 0.625), deviceScaleFactor: scale });
    if (theme === "light" || theme === "dark") await setTheme(page, theme);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 }).catch((e) => { if (!/timeout/i.test(e.message)) throw e; });
    await page.addStyleTag({ content: `${[...HIDE_DEFAULT, ...hideSelectors(hide)].join(",")} { display: none !important; }
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
    if (theme === "light" || theme === "dark") await forceThemeMarkers(page, theme);
    await page.evaluate(() => document.fonts.ready);
    // The layout map is optional: a site whose CSP blocks the injected runtime is still captured, without a build intro.
    const layout = layoutHeight
      ? await readLayout(page, width, layoutHeight, new URL(url).hostname.replace(/^www\./, "")).catch(() => null)
      : null;
    return { png: Buffer.from(await page.screenshot({ fullPage: true, type: "png" })), layout };
  } finally {
    await browser.close();
  }
}

// Before load: the system preference (sites following it) and a saved choice (sites with a switch).
async function setTheme(page, theme) {
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
  await page.evaluateOnNewDocument((keys, theme) => {
    try { for (const k of keys) localStorage.setItem(k, k === "darkMode" ? String(theme === "dark") : theme); } catch {}
  }, THEME_KEYS, theme);
}

// After load, for switches that ignore both: flip the markers the page already uses on <html> and <body>.
// Only existing markers change, so a site without a theme is left alone.
async function forceThemeMarkers(page, theme) {
  const changed = await page.evaluate((theme) => {
    const other = theme === "dark" ? "light" : "dark";
    let n = 0;
    for (const el of [document.documentElement, document.body]) {
      if (el.classList.contains(other)) { el.classList.replace(other, theme); n++; }
      for (const a of ["data-theme", "data-mode", "data-color-mode", "data-color-scheme", "data-bs-theme"])
        if (el.getAttribute(a) === other) { el.setAttribute(a, theme); n++; }
      if (el.style.colorScheme === other) { el.style.colorScheme = theme; n++; }
    }
    return n;
  }, theme);
  if (changed) await new Promise((r) => setTimeout(r, 600)); // let theme transitions finish
}

// Parts are in CSS px from the page's top left; DOM references are dropped so the map is plain JSON.
async function readLayout(page, width, height, title) {
  const src = readFileSync(uiGeneration, "utf8").replace(/^export \{[^}]*\};?$/m, "").replace(/^export /gm, "");
  await page.addScriptTag({ content: `(() => {
${src}
})();` });
  return page.evaluate((width, height, title) => {
    const { measure, deriveCode } = window.UIGeneration;
    const R = { left: 0, top: 0, right: width, bottom: height, width, height };
    const M = measure(document.body, { maxParts: 120, keys: 0 }, R);
    const code = deriveCode(document.body, M, title);
    const parts = M.parts.map(({ el, key, ...p }) => p);
    return { width, height, title, code, parts };
  }, width, height, title);
}

// Captures `url` into the Project's assets as _source/<name>-<width>@<scale>x.png. An existing Screen
// (and the Focus areas approved on it) is only replaced with `force`.
export async function captureScreen({ project, url, name, width = 1440, height, scale = 2, hide, theme, force = false }) {
  const root = resolve(project);
  if (!existsSync(join(root, "hyperframes.json"))) throw new Error(`${root} is not a Project (no hyperframes.json)`);
  if (!name || /[\\/]/.test(name)) throw new Error("Name the Screen with --name, e.g. --name home-full (no folders)");
  if (![width, scale].every((n) => Number.isInteger(n) && n > 0)) throw new Error("--width (CSS px) and --scale must be whole numbers above 0");
  const output = join(root, "assets", "_source", `${name}-${width}@${scale}x.png`);
  if (existsSync(output) && !force) throw new Error(`${output} already exists; pass --force to replace it`);
  const png = await capturePage({ url, width, height, scale, hide, theme });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, png);
  const meta = await sharp(png, { limitInputPixels: false }).metadata();
  return { output, width: meta.width, height: meta.height, layoutWidth: width };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), opts = {}, pos = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--force") opts.force = true;
    else if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];
    else pos.push(args[i]);
  }
  const [project, url] = pos;
  if (!project || !url || !opts.name) {
    console.error("Usage: node tools/library/capture.mjs <project> <url> --name <name> [--width 1440] [--height <px>] [--scale 2] [--hide <sel,sel>] [--theme light|dark] [--force]");
    process.exit(1);
  }
  const num = (v) => (v === undefined ? undefined : Number(v));
  captureScreen({ project, url, name: opts.name, width: num(opts.width), height: num(opts.height), scale: num(opts.scale), hide: opts.hide, theme: opts.theme, force: opts.force })
    .then((r) => console.log(`${r.width}x${r.height} (layout width ${r.layoutWidth}) -> ${r.output}`))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
