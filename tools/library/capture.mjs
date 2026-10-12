// Screen capture: a live URL frozen as one full-page Screen (ADR-0006), with headless
// Chrome. Common cookie banners and listed selectors are hidden. Quick Loop uses the same capture.
// Usage: node tools/library/capture.mjs <project> <url> --name <name> [--width 1440] [--height <px>] [--scale 2] [--hide <sel,sel>] [--force]
//   e.g. node tools/library/capture.mjs projects/deo-vr https://deovr.com --name home-full --scale 3
// Writes <project>/assets/_source/<name>-<width>@<scale>x.png, beside the Project's other Screens;
// its layout width is <width>, for the Focus areas sidecar.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

const hideSelectors = (hide) => String(hide || "").split(",").map((x) => x.trim()).filter(Boolean);

let browserPath;
// The full page as a PNG buffer: `width` CSS px wide at `scale` device px per CSS px.
// `hide` is a comma-separated list of extra selectors; `height` is the viewport's (16:10 by default), which sizes any 100vh sections.
export async function capturePage({ url, width = 1440, height, scale = 2, hide }) {
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  browserPath ??= spawnSync(process.execPath, [hfBin, "browser", "path"], { encoding: "utf8" }).stdout.trim();
  const browser = await puppeteer.launch({ executablePath: browserPath, headless: true, args: ["--hide-scrollbars"] });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "accept-language": "en-GB,en;q=0.9" });
    await page.setViewport({ width, height: height || Math.round(width * 0.625), deviceScaleFactor: scale });
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
    await page.evaluate(() => document.fonts.ready);
    return Buffer.from(await page.screenshot({ fullPage: true, type: "png" }));
  } finally {
    await browser.close();
  }
}

// Captures `url` into the Project's assets as _source/<name>-<width>@<scale>x.png. An existing Screen
// (and the Focus areas approved on it) is only replaced with `force`.
export async function captureScreen({ project, url, name, width = 1440, height, scale = 2, hide, force = false }) {
  const root = resolve(project);
  if (!existsSync(join(root, "hyperframes.json"))) throw new Error(`${root} is not a Project (no hyperframes.json)`);
  if (!name || /[\\/]/.test(name)) throw new Error("Name the Screen with --name, e.g. --name home-full (no folders)");
  if (![width, scale].every((n) => Number.isInteger(n) && n > 0)) throw new Error("--width (CSS px) and --scale must be whole numbers above 0");
  const output = join(root, "assets", "_source", `${name}-${width}@${scale}x.png`);
  if (existsSync(output) && !force) throw new Error(`${output} already exists; pass --force to replace it`);
  const png = await capturePage({ url, width, height, scale, hide });
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
    console.error("Usage: node tools/library/capture.mjs <project> <url> --name <name> [--width 1440] [--height <px>] [--scale 2] [--hide <sel,sel>] [--force]");
    process.exit(1);
  }
  const num = (v) => (v === undefined ? undefined : Number(v));
  captureScreen({ project, url, name: opts.name, width: num(opts.width), height: num(opts.height), scale: num(opts.scale), hide: opts.hide, force: opts.force })
    .then((r) => console.log(`${r.width}x${r.height} (layout width ${r.layoutWidth}) -> ${r.output}`))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
