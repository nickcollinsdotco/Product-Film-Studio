import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";
const bp = spawnSync(process.execPath, ["../../node_modules/hyperframes/bin/hyperframes.mjs", "browser", "path"], { encoding: "utf8" }).stdout.trim();
const b = await puppeteer.launch({ executablePath: bp, headless: true, args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
// Clock shim: real time until __freeze(), then time only moves when __step(ms) is called.
await p.evaluateOnNewDocument(() => {
  const rNow = performance.now.bind(performance), rDate = Date.now, rST = setTimeout, rSI = setInterval, rCT = clearTimeout, rCI = clearInterval, rRAF = requestAnimationFrame, rCAF = cancelAnimationFrame;
  let frozen = false, vt = 0, off = 0, id = 1e6; const timers = new Map(), rafs = new Map();
  performance.now = () => frozen ? vt : rNow();
  Date.now = () => frozen ? off + vt : rDate();
  window.setTimeout = (f, d = 0, ...a) => { if (!frozen) return rST(f, d, ...a); const i = ++id; timers.set(i, { f, at: vt + Math.max(0, d), a }); return i; };
  window.setInterval = (f, d = 0, ...a) => { if (!frozen) return rSI(f, d, ...a); const i = ++id; timers.set(i, { f, at: vt + Math.max(1, d), every: Math.max(1, d), a }); return i; };
  window.clearTimeout = (i) => timers.has(i) ? timers.delete(i) : rCT(i);
  window.clearInterval = (i) => timers.has(i) ? timers.delete(i) : rCI(i);
  window.requestAnimationFrame = (f) => { if (!frozen) return rRAF(f); const i = ++id; rafs.set(i, f); return i; };
  window.cancelAnimationFrame = (i) => rafs.has(i) ? rafs.delete(i) : rCAF(i);
  window.__freeze = () => { vt = rNow(); off = rDate() - vt; frozen = true; document.getAnimations().forEach(a => a.pause()); };
  window.__step = (ms) => {
    const end = vt + ms;
    for (;;) { let next = null; for (const [i, t] of timers) if (t.at <= end && (!next || t.at < next[1].at)) next = [i, t];
      if (!next) break; const [i, t] = next; vt = t.at; if (t.every) t.at += t.every; else timers.delete(i); try { t.f(...t.a); } catch {} }
    vt = end; const fs = [...rafs.values()]; rafs.clear(); for (const f of fs) try { f(vt); } catch {}
    document.getAnimations().forEach(a => { if (a.currentTime != null) a.currentTime += ms; });
  };
});
await p.goto("https://www.nickcollins.co/", { waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));
await p.evaluate(() => window.__freeze());
mkdirSync("frames", { recursive: true });
const fps = 30, n = fps * 8, t0 = Date.now();
for (let i = 0; i < n; i++) {
  await p.evaluate((ms) => window.__step(ms), 1000 / fps);
  await p.screenshot({ path: `frames/f${String(i).padStart(4, "0")}.png`, clip: { x: 100, y: 360, width: 1240, height: 430 } });
}
console.log("frames", n, "wall ms", Date.now() - t0);
await b.close();
