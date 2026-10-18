// Manual check (needs Chrome and the network): Quick Loop shares a real tab, stitches it while it's scrolled at
// about a person's speed, and uploads the page. Writes screenshots and result.json to renders/quick/e2e.
// node tools/quick-loop/checks/share-tab.mjs [url]   (SPEED=px a second, HEADFUL=1 to watch, CHROME=path)
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
const target = process.argv[2] || "https://nickcollins.co";
const out = "renders/quick/e2e"; mkdirSync(out, { recursive: true });
const server = spawn(process.execPath, ["tools/quick-loop/server.mjs"], { env: { ...process.env, PORT: "4399" }, stdio: "inherit" });
await new Promise((r) => setTimeout(r, 1200));
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: process.env.HEADFUL ? false : "new",
  args: ["--auto-select-tab-capture-source-by-title=StitchTarget", "--window-size=1400,1000"],
  defaultViewport: null,
});
try {
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1280, height: 800 });
  await tab.goto(target, { waitUntil: "networkidle2", timeout: 60000 });
  await tab.evaluate(() => { document.title = "StitchTarget"; scrollTo(0, 0); });
  const app = await browser.newPage();
  await app.setViewport({ width: 1400, height: 950, deviceScaleFactor: 1.25 }); // the same display as the tab
  app.on("console", (m) => console.log("[app]", m.text()));
  app.on("pageerror", (e) => console.log("[app error]", e.message));
  await app.goto("http://localhost:4399/", { waitUntil: "networkidle2" });
  await app.screenshot({ path: `${out}/ui-start.png` });
  await app.click("#share");
  await app.waitForSelector("#live.on", { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  console.log("settings", await app.evaluate(() => JSON.stringify($("livevideo").srcObject.getVideoTracks()[0].getSettings())));
  await app.screenshot({ path: `${out}/ui-live.png` });
  await app.click("#fullpage");
  await app.waitForFunction(() => live.progress, { timeout: 15000 });
  console.log("note", await app.evaluate(() => $("livenote").textContent));
  const total = await tab.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
  console.log("page scroll height", total);
  // like a person: about 1,200 px a second, in small wheel-sized steps
  const speed = Number(process.env.SPEED || 1200);
  for (let y = 0, i = 0; y < total; i++) {
    y = Math.min(total, y + speed / 30);
    await tab.evaluate((y) => scrollTo(0, y), y);
    await new Promise((r) => setTimeout(r, 33));
    if (i % 30 === 0) console.log("y", Math.round(y), await app.evaluate(() => JSON.stringify(live.progress)));
  }
  await new Promise((r) => setTimeout(r, 800));
  await app.screenshot({ path: `${out}/ui-stitching.png` });
  await app.click("#livedone");
  await app.waitForFunction(() => cfg.image && /tab-page/.test($("drop").textContent), { timeout: 60000 });
  const img = await app.evaluate(() => cfg.image);
  console.log("stitched", JSON.stringify(img));
  writeFileSync(`${out}/result.json`, JSON.stringify(img));
  await new Promise((r) => setTimeout(r, 2500));
  await app.screenshot({ path: `${out}/ui-after.png` });
  await tab.evaluate(() => scrollTo(0, 0));
  await tab.screenshot({ path: `${out}/reference-full.png`, fullPage: true });
} finally {
  await browser.close();
  server.kill();
}
