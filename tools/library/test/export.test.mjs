// Seam 2: the export command, on the committed fixture Project. Slow (a real HyperFrames render).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sync } from "../sync.mjs";
import { exportLoop } from "../export.mjs";
import { checkSeam } from "../seam.mjs";
import sharp from "sharp";

const repo = resolve(fileURLToPath(import.meta.url), "../../../..");
const project = join(repo, "fixtures", "hold-loop");

const listFiles = (dir) => readdirSync(dir, { recursive: true }).map((f) => relative(dir, join(dir, f))).sort();
const probe = (file) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", file], { encoding: "utf8" });
  const j = JSON.parse(r.stdout);
  return { ...j.streams[0], duration: Number(j.format.duration) };
};

test("a Draft export renders at half the primary Frame size, at the Loop's duration, and leaves no temporary files", { timeout: 300_000 }, async () => {
  sync(project);
  const before = listFiles(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const { output, seam } = await exportLoop({ project, entry: "films/fixture/hold.html", outDir, quiet: true });
    assert.equal(seam, null, "a Tour skips the Seam check");
    const v = probe(output);
    assert.equal(v.width, 800);
    assert.equal(v.height, 450);
    assert.equal(v.r_frame_rate, "60/1");
    assert.ok(Math.abs(v.duration - 4) < 0.05, `duration ${v.duration}`);
    assert.deepEqual(listFiles(project), before, "the Project is unchanged after export");
    assert.deepEqual(readdirSync(outDir), ["hold-800x450-draft.mp4"], "only the output is left in the output folder");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("a multi-Shot Draft export renders at the Loop's full duration and leaves no temporary files", { timeout: 300_000 }, async () => {
  sync(project);
  const before = listFiles(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const { output } = await exportLoop({ project, entry: "films/fixture/hold-scroll.html", outDir, quiet: true });
    const v = probe(output);
    assert.equal(v.width, 800);
    assert.equal(v.height, 450);
    assert.ok(Math.abs(v.duration - 8.5) < 0.05, `duration ${v.duration}`);
    assert.deepEqual(listFiles(project), before, "the Project is unchanged after export");
    assert.deepEqual(readdirSync(outDir), ["hold-scroll-800x450-draft.mp4"]);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("a Bookend's Seam is checked on scene state and its t = D | t = 0 image written", { timeout: 60_000 }, async () => {
  sync(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const ok = await checkSeam({ project, entry: "films/fixture/bookend.html", size: { width: 800, height: 450 }, image: join(outDir, "ok.png") });
    assert.equal(ok.pass, true, ok.failures.join("\n"));
    const meta = await sharp(join(outDir, "ok.png")).metadata();
    assert.equal(meta.height, 450);
    assert.ok(meta.width > 1600, `width ${meta.width}: two frames side by side`);
    const broken = await checkSeam({ project, entry: "films/fixture/bookend-broken.html", size: { width: 800, height: 450 }, image: join(outDir, "broken.png") });
    assert.equal(broken.checks.pose, false);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("a Bookend with a broken Seam blocks a Final render, leaving only its Seam image", { timeout: 60_000 }, async () => {
  sync(project);
  const before = listFiles(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    await assert.rejects(exportLoop({ project, entry: "films/fixture/bookend-broken.html", final: true, outDir, quiet: true }), /Seam check failed[\s\S]*pose/);
    assert.deepEqual(readdirSync(outDir), ["bookend-broken-1600x900-final-seam.png"]);
    assert.deepEqual(listFiles(project), before, "the Project is unchanged");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("a Bookend with a broken Seam warns on a Draft and still renders", { timeout: 300_000 }, async () => {
  sync(project);
  const before = listFiles(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const { output, seam, warnings } = await exportLoop({ project, entry: "films/fixture/bookend-broken.html", outDir, quiet: true });
    assert.equal(seam.pass, false);
    assert.match(warnings.join("\n"),/Seam check failed[\s\S]*pose/);
    assert.ok(Math.abs(probe(output).duration - 3) < 0.05);
    assert.deepEqual(readdirSync(outDir).sort(), ["bookend-broken-800x450-draft-seam.png", "bookend-broken-800x450-draft.mp4"]);
    assert.deepEqual(listFiles(project), before, "the Project is unchanged after export");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("a Loop with no shape blocks a Final render, since its Seam can't be checked", { timeout: 60_000 }, async () => {
  sync(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  const entry = join(project, "films", "fixture", ".no-shape-test.html");
  writeFileSync(entry, readFileSync(join(project, "films", "fixture", "bookend.html"), "utf8").replace(' data-loop-shape="bookend"', ""));
  try {
    await assert.rejects(exportLoop({ project, entry: relative(project, entry), final: true, outDir, quiet: true }), /no Loop shape/);
    assert.deepEqual(readdirSync(outDir), []);
  } finally {
    rmSync(entry, { force: true });
    rmSync(outDir, { recursive: true, force: true });
  }
});
