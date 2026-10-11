// Seam 2: the export command, on the committed fixture Project. Slow (a real HyperFrames render).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sync } from "../sync.mjs";
import { exportLoop } from "../export.mjs";

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
    const { output } = await exportLoop({ project, entry: "films/fixture/hold.html", outDir, quiet: true });
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
