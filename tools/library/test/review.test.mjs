// The review page (vr-loops 06), on empty stand-in Draft files in a temp folder: the page only links them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseDraft, reviewPage, writeReview } from "../review.mjs";

test("a Draft's name gives its Loop, size and tilt; Finals, seam images and other files aren't Drafts", () => {
  assert.deepEqual(parseDraft("hero-push-in-800x450-draft-tilt8.mp4"), { file: "hero-push-in-800x450-draft-tilt8.mp4", loop: "hero-push-in", width: 800, height: 450, tilt: 8, extra: [] });
  assert.deepEqual(parseDraft("home-bookend-800x450-draft.mp4"), { file: "home-bookend-800x450-draft.mp4", loop: "home-bookend", width: 800, height: 450, tilt: null, extra: [] });
  assert.deepEqual(parseDraft("hold-800x450-draft-6.8s-30fps-tilt-4.mp4").extra, ["6.8s", "30fps"]);
  assert.equal(parseDraft("hold-800x450-draft-6s-30fps-tilt-4.mp4").tilt, -4);
  assert.equal(parseDraft("hero-push-in-1600x900-final.mp4"), null);
  assert.equal(parseDraft("hero-push-in-800x450-draft-tilt0-seam.png"), null);
  assert.equal(parseDraft("review.html"), null);
});

const videos = (html) => [...html.matchAll(/<video\b[^>]*>/g)].map(([tag]) => tag);

test("the page puts each Loop on one row, its tilts side by side in order, then the Steel Hat clip, all at one height", () => {
  const html = reviewPage(["hero-push-in-800x450-draft-tilt8.mp4", "home-bookend-800x450-draft.mp4", "hero-push-in-800x450-draft-tilt0.mp4"].map(parseDraft),
    { steelHat: "../../../references/own/steel-hat-phone.mp4", height: 360 });
  const rows = html.split("<section").slice(1);
  assert.equal(rows.length, 2);
  assert.match(rows[0], /hero-push-in/);
  assert.match(rows[1], /home-bookend/);
  const hero = videos(rows[0]);
  assert.deepEqual(hero.map((v) => v.match(/src="([^"]*)"/)[1]),
    ["hero-push-in-800x450-draft-tilt0.mp4", "hero-push-in-800x450-draft-tilt8.mp4", "../../../references/own/steel-hat-phone.mp4"]);
  for (const v of videos(html)) {
    for (const attr of ["autoplay", "muted", "loop", "playsinline"]) assert.match(v, new RegExp(`\\b${attr}\\b`), `${attr} on ${v}`);
  }
  assert.match(html, /--card-height:\s*360px/);
  // Labelled by Loop and tilt.
  assert.match(rows[0], /0°/);
  assert.match(rows[0], /8°/);
  assert.match(rows[0], /Steel Hat/);
  assert.match(rows[1], /Loop's own tilt/);
});

test("without the Steel Hat clip the page says so instead of linking a missing file", () => {
  const html = reviewPage([parseDraft("hold-800x450-draft.mp4")], { steelHat: null, height: 360 });
  assert.equal(videos(html).length, 1);
  assert.match(html, /steel-hat-phone\.mp4/);
});

test("regenerating picks up Drafts rendered since, with no hand edits", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-test-"));
  try {
    const steelHat = join(dir, "steel-hat-phone.mp4");
    writeFileSync(steelHat, "");
    writeFileSync(join(dir, "hero-push-in-800x450-draft-tilt0.mp4"), "");
    writeFileSync(join(dir, "hero-push-in-800x450-draft-tilt0-seam.png"), "");
    const first = writeReview({ rendersDir: dir, steelHat });
    assert.equal(first.output, join(dir, "review.html"));
    assert.deepEqual(first.drafts, ["hero-push-in-800x450-draft-tilt0.mp4"]);
    assert.match(readFileSync(first.output, "utf8"), /src="steel-hat-phone\.mp4"/, "linked relative to the page");

    writeFileSync(join(dir, "hero-push-in-800x450-draft-tilt8.mp4"), "");
    writeFileSync(join(dir, "step-inside-800x450-draft.mp4"), "");
    const second = writeReview({ rendersDir: dir, steelHat });
    assert.equal(second.drafts.length, 3);
    const html = readFileSync(second.output, "utf8");
    assert.equal(html.split("<section").length - 1, 2);
    assert.match(html, /hero-push-in-800x450-draft-tilt8\.mp4/);
    assert.match(html, /step-inside-800x450-draft\.mp4/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a renders folder with no Drafts is an error, not an empty page", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-test-"));
  try {
    assert.throws(() => writeReview({ rendersDir: dir, steelHat: null }), /No Drafts/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
