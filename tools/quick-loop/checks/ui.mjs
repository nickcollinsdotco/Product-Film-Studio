// Manual check (needs Chrome): presets and their hero controls, a focus area, the sharpness warning, and the share
// link's round trip. node tools/quick-loop/checks/ui.mjs <image>   (screenshots to renders/quick/e2e)
import { mkdirSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
const out = "renders/quick/e2e"; mkdirSync(out, { recursive: true });
const server = spawn(process.execPath, ["tools/quick-loop/server.mjs"], { env: { ...process.env, PORT: "4399" }, stdio: "inherit" });
await new Promise((r) => setTimeout(r, 1200));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", defaultViewport: { width: 1400, height: 1900 } });
try {
  await browser.defaultBrowserContext().overridePermissions("http://localhost:4399", ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);
  const app = await browser.newPage();
  app.on("pageerror", (e) => console.log("[app error]", e.message));
  await app.goto("http://localhost:4399/", { waitUntil: "networkidle2" });
  const input = await app.$("#file");
  await input.uploadFile(process.argv[2]);
  await app.waitForFunction(() => cfg.image, { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  await app.screenshot({ path: `${out}/ui-presets.png` });
  // choose Zoom to detail, draw a focus box on the thumbnail
  await app.click('.preset[data-id="zoom"]');
  const box = await (await app.$("#thumb")).boundingBox();
  await app.mouse.move(box.x + box.width * 0.05, box.y + 60); await app.mouse.down();
  await app.mouse.move(box.x + box.width * 0.5, box.y + 130, { steps: 5 }); await app.mouse.up();
  await new Promise((r) => setTimeout(r, 1500));
  await app.screenshot({ path: `${out}/ui-zoom.png` });
  console.log("hero", await app.evaluate(() => [...$("hero").querySelectorAll("label > span:first-child, #swatches")].map((e) => e.textContent || e.id).join(" | ")));
  console.log("sharp", await app.evaluate(() => [$("sharp").hidden, $("sharp").textContent]));
  await app.click("#copylink"); await new Promise((r) => setTimeout(r, 300));
  const link = await app.evaluate(() => $("status").textContent.startsWith("http") ? $("status").textContent : null) ||
    await app.evaluate(() => navigator.clipboard.readText().catch(() => null));
  console.log("link", link?.slice(0, 80), link?.length);
  const before = await app.evaluate(() => JSON.stringify({ focus: cfg.focus, focusMove: cfg.focusMove, image: cfg.image.url, preset: preset.id }));
  const b = await browser.newPage();
  await b.goto(link, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2500));
  const after = await b.evaluate(() => JSON.stringify({ focus: cfg.focus, focusMove: cfg.focusMove, image: cfg.image?.url, preset: preset.id }));
  console.log("restored", before === after, after);
  await b.screenshot({ path: `${out}/ui-restored.png` });
} finally { await browser.close(); server.kill(); }
