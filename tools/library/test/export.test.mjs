// Seam 2: the export command, on the committed fixture Project. Slow (a real HyperFrames render).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sync } from "../sync.mjs";
import { exportLoop, frameSize, scaleLength, stampSettings, renditionBitrate, PRESETS, RENDITION_LIMIT } from "../export.mjs";
import { checkSeam } from "../seam.mjs";
import sharp from "sharp";

const repo = resolve(fileURLToPath(import.meta.url), "../../../..");
const project = join(repo, "fixtures", "hold-loop");

const listFiles = (dir) => readdirSync(dir, { recursive: true }).map((f) => relative(dir, join(dir, f))).sort();
const probe = (file) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,color_space,color_transfer,color_primaries:format=duration,size", "-of", "json", file], { encoding: "utf8" });
  const j = JSON.parse(r.stdout);
  return { ...j.streams[0], streams: j.streams.length, duration: Number(j.format.duration), size: Number(j.format.size) };
};
// One frame at t as raw grey pixels, for comparing renders.
const frameAt = (file, t) => spawnSync("ffmpeg", ["-v", "error", "-ss", String(t), "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 1 << 26 }).stdout;
const meanDiff = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]); return d / a.length; };
const hostClips = (html) => [...html.matchAll(/<div\b[^>]*data-composition-src[^>]*>/g)].map(([tag]) => ({
  start: Number(tag.match(/data-start="([^"]*)"/)[1]), duration: Number(tag.match(/data-duration="([^"]*)"/)[1]),
}));

// The Rendition is the portfolio file: H.264 High, yuv420p, faststart (moov before mdat), no audio, within 6 MB.
const assertRendition = (file) => {
  const v = probe(file);
  assert.equal(v.streams, 1, "no audio");
  assert.equal(v.codec_name, "h264");
  assert.equal(v.profile, "High");
  assert.equal(v.pix_fmt, "yuv420p");
  assert.ok(v.size <= RENDITION_LIMIT, `size ${v.size}`);
  const bytes = readFileSync(file).toString("latin1");
  assert.ok(bytes.indexOf("moov") < bytes.indexOf("mdat"), "faststart: moov before mdat");
  return v;
};

test("Frame sizes: the five presets, custom W×H, odd and unknown sizes rejected", () => {
  assert.deepEqual(frameSize("Landscape"), { width: 1600, height: 900 });
  assert.deepEqual(frameSize("story"), { width: 900, height: 1600 });
  assert.deepEqual(frameSize("Square"), { width: 1600, height: 1600 });
  assert.deepEqual(frameSize("Portrait"), { width: 1280, height: 1600 });
  assert.deepEqual(frameSize("Classic"), { width: 1600, height: 1200 });
  assert.deepEqual(frameSize("1080x1350"), { width: 1080, height: 1350 });
  assert.deepEqual(frameSize("640×360"), { width: 640, height: 360 });
  assert.throws(() => frameSize("901x1600"), /even/);
  assert.throws(() => frameSize("900x1601"), /even/);
  assert.throws(() => frameSize("Wide"), /Landscape, Story, Square, Portrait, Classic/);
});

test("a length change scales every host clip's start and duration, and the Loop's, proportionally", () => {
  const html = readFileSync(join(project, "films", "fixture", "hold-scroll.html"), "utf8");
  const scaled = scaleLength(html, 6.8);
  assert.match(scaled, /id="root"[^>]*data-duration="6.8"/);
  const k = 6.8 / 8.5, before = hostClips(html), after = hostClips(scaled);
  assert.equal(after.length, 4);
  before.forEach((c, i) => {
    assert.ok(Math.abs(after[i].start - c.start * k) < 1e-6 && Math.abs(after[i].duration - c.duration * k) < 1e-6, `clip ${i}`);
  });
  assert.throws(() => scaleLength(html, 0), /length/);
});

const rootSettings = (html) => JSON.parse(html.match(/<div\b[^>]*data-composition-id[^>]*>/)[0].match(/data-settings="([^"]*)"/)[1].replace(/&quot;/g, '"'));

test("a settings override is stamped on the Loop's root over its own settings, and only there", () => {
  const html = readFileSync(join(project, "films", "fixture", "hold-scroll.html"), "utf8");
  const tilted = stampSettings(html, { tilt: 8 });
  assert.deepEqual(rootSettings(tilted), { tilt: 8 });
  assert.equal(tilted.match(/data-settings=/g).length, 1, "host clips untouched");
  const own = html.replace(/(<div\b[^>]*data-composition-id)/, '$1 data-settings="{&quot;deviceFrame&quot;:&quot;browser&quot;,&quot;tilt&quot;:3}"');
  assert.deepEqual(rootSettings(stampSettings(own, { tilt: 0 })), { deviceFrame: "browser", tilt: 0 });
});

test("the Seam check reads the Loop's tilt from its settings", async () => {
  const html = readFileSync(join(project, "films", "fixture", "bookend.html"), "utf8");
  const temp = join(project, "films", "fixture", `.tilt-test-${process.pid}.html`);
  writeFileSync(temp, stampSettings(html, { tilt: 25 }));
  try {
    await assert.rejects(checkSeam({ project, entry: temp, size: { width: 800, height: 450 } }), /tilt/);
  } finally {
    rmSync(temp, { force: true });
  }
});

test("the Rendition targets 5 Mbps, lowered so a long Loop fits 6 MB", () => {
  assert.equal(renditionBitrate(4), 5_000_000);
  assert.equal(renditionBitrate(9), 5_000_000);
  const long = renditionBitrate(30);
  assert.ok(long < 5_000_000 && (long * 30) / 8 < RENDITION_LIMIT, `bitrate ${long}`);
});

test("every preset exports at its size, Draft at half; a custom size at full size as a Final", { timeout: 600_000 }, async () => {
  sync(project);
  const before = listFiles(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const names = [];
    for (const [name, size] of Object.entries(PRESETS)) {
      const { output, source } = await exportLoop({ project, entry: "films/fixture/hold.html", size: name, length: 0.5, outDir, quiet: true });
      assert.equal(source, "video", "a Draft keeps the fast path");
      const v = assertRendition(output);
      assert.deepEqual([v.width, v.height], [size.width / 2, size.height / 2], name);
      names.push(basename(output));
    }
    const { output, source } = await exportLoop({ project, entry: "films/fixture/hold.html", size: "322x180", final: true, length: 0.5, outDir, quiet: true });
    assert.equal(source, "png-sequence", "a Final renders lossless frames");
    const v = assertRendition(output);
    assert.deepEqual([v.width, v.height], [322, 180]);
    // A Final goes through lossless frames and an error-diffusion RGB→YUV conversion (vr-loops ticket 02), tagged BT.709.
    assert.deepEqual([v.color_space, v.color_transfer, v.color_primaries], ["bt709", "bt709", "bt709"], "Final tagged BT.709");
    assert.equal(basename(output), "hold-322x180-final-0.5s.mp4");
    assert.deepEqual(readdirSync(outDir).sort(), [...names, basename(output)].sort(), "only the outputs are left");
    assert.deepEqual(listFiles(project), before, "the Project is unchanged after export");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("an odd custom size is rejected before anything renders", async () => {
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    await assert.rejects(exportLoop({ project, entry: "films/fixture/hold.html", size: "321x180", final: true, outDir, quiet: true }), /even/);
    assert.deepEqual(readdirSync(outDir), []);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("a length change sets the output's duration", { timeout: 300_000 }, async () => {
  sync(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const { output } = await exportLoop({ project, entry: "films/fixture/hold-scroll.html", size: "320x180", length: 3, outDir, quiet: true });
    assert.ok(Math.abs(probe(output).duration - 3) < 0.05, `duration ${probe(output).duration}`);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("the frame rate is set in the output and changes neither the motion nor the duration", { timeout: 300_000 }, async () => {
  sync(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const at60 = await exportLoop({ project, entry: "films/fixture/hold-scroll.html", size: "640x360", final: true, outDir, quiet: true });
    const at30 = await exportLoop({ project, entry: "films/fixture/hold-scroll.html", size: "640x360", final: true, fps: 30, outDir, quiet: true });
    assert.equal(basename(at30.output), "hold-scroll-640x360-final-30fps.mp4");
    const v60 = probe(at60.output), v30 = probe(at30.output);
    assert.equal(v60.r_frame_rate, "60/1");
    assert.equal(v30.r_frame_rate, "30/1");
    assert.ok(Math.abs(v30.duration - v60.duration) < 0.05, `${v30.duration} vs ${v60.duration}`);
    // Mid-Scroll, the same t shows the same state at either rate.
    const same = meanDiff(frameAt(at60.output, 3), frameAt(at30.output, 3));
    const moved = meanDiff(frameAt(at60.output, 3), frameAt(at60.output, 3.2));
    assert.ok(same < moved / 4, `same t differs by ${same}; 0.2s apart by ${moved}`);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("the Rendition's bitrate is lowered to fit the size limit, and an export still over it fails clearly", { timeout: 300_000 }, async () => {
  sync(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const { output } = await exportLoop({ project, entry: "films/fixture/hold.html", size: "640x360", final: true, maxBytes: 150_000, outDir, quiet: true });
    assert.ok(probe(output).size <= 150_000, `size ${probe(output).size}`);
    rmSync(output);
    await assert.rejects(exportLoop({ project, entry: "films/fixture/hold.html", size: "640x360", final: true, maxBytes: 2_000, outDir, quiet: true }), /over the 2000-byte limit/);
    assert.deepEqual(readdirSync(outDir), [], "an oversize Rendition isn't left behind");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("a Draft export renders at half the primary Frame size, at the Loop's duration, and leaves no temporary files", { timeout: 300_000 }, async () => {
  sync(project);
  const before = listFiles(project);
  const outDir = mkdtempSync(join(repo, "renders", "export-test-"));
  try {
    const { output, seam } = await exportLoop({ project, entry: "films/fixture/hold.html", outDir, quiet: true });
    assert.equal(seam, null, "a Tour skips the Seam check");
    const v = assertRendition(output);
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
