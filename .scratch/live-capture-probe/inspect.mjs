import { spawnSync } from "node:child_process";
import puppeteer from "puppeteer-core";
const bp = spawnSync(process.execPath, ["node_modules/hyperframes/bin/hyperframes.mjs", "browser", "path"], { encoding: "utf8" }).stdout.trim();
const b = await puppeteer.launch({ executablePath: bp, headless: true, args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://www.nickcollins.co/", { waitUntil: "networkidle2", timeout: 45000 }).catch(() => {});
await new Promise(r => setTimeout(r, 3000));
const info = await p.evaluate(() => {
  const anims = document.getAnimations().map(a => ({ name: a.animationName || a.constructor.name, target: a.effect?.target?.tagName + "." + (a.effect?.target?.className||"").toString().slice(0,40), dur: a.effect?.getTiming().duration, iter: a.effect?.getTiming().iterations, state: a.playState }));
  const canv = [...document.querySelectorAll("canvas,video,iframe")].map(e => ({ tag: e.tagName, r: e.getBoundingClientRect().toJSON(), src: e.src || "" }));
  return { anims: anims.slice(0, 40), nAnims: anims.length, canv };
});
console.log(JSON.stringify(info, null, 1));
for (let i = 0; i < 4; i++) { await p.screenshot({ path: `.scratch/live-capture-probe/t${i}.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } }); await new Promise(r => setTimeout(r, 700)); }
await b.close();
