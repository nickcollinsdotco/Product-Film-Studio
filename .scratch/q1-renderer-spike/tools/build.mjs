// Generates the Q1 renderer-spike variants. The scene (markup + CSS) is
// byte-identical across variants; only the choreography script differs.
// Usage: node .scratch/q1-renderer-spike/tools/build.mjs
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const spike = join(here, "..");
const repo = join(spike, "..", "..");
const hfJson = readFileSync(join(repo, "films", "poc", "hyperframes.json"), "utf8");

// Surface depths (world z, px). Surface transforms for b/c come from CSS;
// in a-state the renderer writes them from scene state.
const css = (surfaceTransformsInCss) => `
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #07090d; }
      #root { position: relative; width: 100%; height: 100%; font-family: sans-serif;
        background: radial-gradient(ellipse at 50% 40%, #131a24 0%, #07090d 70%); }
      #viewport { position: absolute; inset: 0; perspective: 1600px; perspective-origin: 50% 50%; }
      #camera { position: absolute; inset: 0; transform-style: preserve-3d; }
      .surface { position: absolute; width: 900px; height: 560px; box-sizing: border-box;
        border-radius: 18px; background: #f5f7fb; color: #0f172a; padding: 28px 32px;
        box-shadow: 0 40px 120px rgba(0,0,0,0.55); overflow: hidden; }
      #surface-a { left: 260px; top: 250px;${surfaceTransformsInCss ? " transform: translateZ(0px);" : ""} }
      #surface-b { left: 1100px; top: 80px; background: #101826; color: #e2e8f0;${surfaceTransformsInCss ? " transform: translateZ(-700px);" : ""} }
      .bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
      .title { font-size: 34px; font-weight: 700; letter-spacing: -0.01em; }
      .pill { font-size: 18px; padding: 6px 14px; border-radius: 999px; background: #e0e7ff; color: #3730a3; }
      #surface-b .pill { background: #1e3a5f; color: #93c5fd; }
      .kpis { display: flex; gap: 18px; margin-bottom: 26px; }
      .kpi { flex: 1; border-radius: 12px; background: #e8edf6; padding: 16px 18px; }
      .kpi .label { font-size: 17px; color: #475569; }
      .kpi .value { font-size: 40px; font-weight: 700; margin-top: 6px; }
      .chart { display: flex; align-items: flex-end; gap: 14px; height: 230px; padding: 0 6px; }
      .chart div { flex: 1; border-radius: 6px 6px 0 0; background: #6366f1; }
      .row { display: flex; justify-content: space-between; font-size: 24px; padding: 16px 4px;
        border-bottom: 1px solid #22314a; }
      .row .stage { color: #94a3b8; font-size: 20px; }`;

const body = `
    <div id="root" data-composition-id="main" data-start="0" data-duration="5" data-width="1920" data-height="1080">
      <div id="viewport">
        <div id="camera" class="clip" data-start="0" data-duration="5" data-track-index="0">
          <div id="surface-b" class="surface clip" data-layout-allow-overlap data-start="0" data-duration="5" data-track-index="2">
            <div class="bar"><div class="title">Pipeline</div><div class="pill">This week</div></div>
            <div class="row"><span>Northwind Traders</span><span class="stage">Proposal · $48k</span></div>
            <div class="row"><span>Acme Logistics</span><span class="stage">Negotiation · $112k</span></div>
            <div class="row"><span>Globex Health</span><span class="stage">Discovery · $31k</span></div>
            <div class="row"><span>Initech Cloud</span><span class="stage">Closed won · $76k</span></div>
            <div class="row"><span>Umbrella Retail</span><span class="stage">Proposal · $22k</span></div>
          </div>
          <div id="surface-a" class="surface clip" data-layout-allow-overlap data-start="0" data-duration="5" data-track-index="1">
            <div class="bar"><div class="title">Revenue overview</div><div class="pill">Q3 2026</div></div>
            <div class="kpis">
              <div class="kpi"><div class="label">MRR</div><div class="value">$84.2k</div></div>
              <div class="kpi"><div class="label">Growth</div><div class="value">+12.4%</div></div>
              <div class="kpi"><div class="label">Churn</div><div class="value">1.8%</div></div>
            </div>
            <div class="chart">
              <div style="height: 38%"></div><div style="height: 52%"></div><div style="height: 47%"></div>
              <div style="height: 63%"></div><div style="height: 71%"></div><div style="height: 66%"></div>
              <div style="height: 82%"></div><div style="height: 94%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

const page = ({ title, surfaceTransformsInCss, extraHead = "", script }) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1920, height=1080">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>${extraHead}
    <style>${css(surfaceTransformsInCss)}
    </style>
  </head>
  <body>${body}
    <script>${script}    </script>
  </body>
</html>
`;

// ---------------------------------------------------------------------------
// a-state: Primitives tween a plain scene-state object; one CSS 3D renderer
// function (timeline onUpdate) writes transforms + blur to the DOM.
const aState = `
      // ---- Library (would be copied into the project) -------------------
      // Renderer-agnostic scene state. Primitives only ever touch this.
      const scene = {
        camera: { z: 0 },
        focus: { depth: 0 }, // world-space depth that is in focus
        surfaces: {
          a: { el: "#surface-a", depth: 0 },
          b: { el: "#surface-b", depth: -700 },
        },
      };

      const camera = {
        pushIn(tl, { to, at, duration, ease = "power2.inOut" }) {
          tl.fromTo(scene.camera, { z: scene.camera.z }, { z: to, duration, ease }, at);
        },
      };
      const surface = {
        focus(tl, id, { at, duration, ease = "power2.inOut" }) {
          const depth = scene.surfaces[id].depth;
          tl.fromTo(scene.focus, { depth: scene.focus.depth }, { depth, duration, ease }, at);
        },
      };

      // CSS 3D Renderer: the only code that knows about the DOM.
      const DOF_K = 10 / 700; // px of blur per unit of depth error
      const rig = document.querySelector("#camera");
      const surfaceEls = Object.values(scene.surfaces).map((s) => ({ s, el: document.querySelector(s.el) }));
      function renderCss3d() {
        rig.style.transform = "translate3d(0px, 0px, " + scene.camera.z + "px)";
        for (const { s, el } of surfaceEls) {
          el.style.transform = "translateZ(" + s.depth + "px)";
          el.style.filter = "blur(" + DOF_K * Math.abs(s.depth - scene.focus.depth) + "px)";
        }
      }

      // ---- Shot: "push in on the dashboard, rack focus to the pipeline" ---
      const tl = gsap.timeline({ paused: true, onUpdate: renderCss3d });
      camera.pushIn(tl, { to: 350, at: 0.5, duration: 3 });
      surface.focus(tl, "b", { at: 1.5, duration: 1.5 });
      renderCss3d();
      window.__timelines["main"] = tl;
`;

// ---------------------------------------------------------------------------
// b-native: Library of namespaced Primitives in a separate file
// (primitives.js, as ADR 0004 "Library copied into projects" implies).
// Primitives emit GSAP tweens directly on DOM elements.
const bNativePrimitives = `// Library: CSS 3D Primitives that emit native GSAP tweens on DOM elements.
const DOF_K = 10 / 700; // px of blur per unit of depth error

const camera = {
  pushIn(tl, { rig = "#camera", from = 0, to, at, duration, ease = "power2.inOut" }) {
    tl.fromTo(rig, { z: from }, { z: to, duration, ease }, at);
  },
};

const surface = {
  // Rack focus from one depth to another. Blur per surface is computed
  // analytically: k * |depth - focus|. Exact only while no surface lies
  // strictly between from and to (|x| is not linear across zero).
  focus(tl, { surfaces, from, to, at, duration, ease = "power2.inOut" }) {
    for (const s of surfaces) {
      const b0 = DOF_K * Math.abs(s.depth - from);
      const b1 = DOF_K * Math.abs(s.depth - to);
      tl.fromTo(s.el, { filter: "blur(" + b0 + "px)" }, { filter: "blur(" + b1 + "px)", duration, ease }, at);
    }
  },
};
`;
const bNative = `
      // ---- Shot: "push in on the dashboard, rack focus to the pipeline" ---
      const SURFACES = [
        { el: "#surface-a", depth: 0 },
        { el: "#surface-b", depth: -700 },
      ];
      const tl = gsap.timeline({ paused: true });
      camera.pushIn(tl, { to: 350, at: 0.5, duration: 3 });
      surface.focus(tl, { surfaces: SURFACES, from: 0, to: -700, at: 1.5, duration: 1.5 });
      window.__timelines["main"] = tl;
`;

// ---------------------------------------------------------------------------
// b3-helpers: same as b, but Primitives written in the one shape Studio's
// parser can inline: top-level function declarations in the composition
// script, positional params with literal defaults, called as statements.
const b3Helpers = `
      // ---- Library (inline, parser-friendly shape) -----------------------
      const DOF_K = 10 / 700;
      function cameraPushIn(tl, to, at, duration, ease = "power2.inOut") {
        tl.fromTo("#camera", { z: 0 }, { z: to, duration: duration, ease: ease }, at);
      }
      function surfaceFocus(tl, el, depth, from, to, at, duration, ease = "power2.inOut") {
        tl.fromTo(el,
          { filter: "blur(" + DOF_K * Math.abs(depth - from) + "px)" },
          { filter: "blur(" + DOF_K * Math.abs(depth - to) + "px)", duration: duration, ease: ease },
          at);
      }

      // ---- Shot ------------------------------------------------------------
      const tl = gsap.timeline({ paused: true });
      cameraPushIn(tl, 350, 0.5, 3);
      surfaceFocus(tl, "#surface-a", 0, 0, -700, 1.5, 1.5);
      surfaceFocus(tl, "#surface-b", -700, 0, -700, 1.5, 1.5);
      window.__timelines["main"] = tl;
`;

// ---------------------------------------------------------------------------
// b2-inline: same tweens written inline, no helpers (literal values).
const b2Inline = `
      // ---- Shot: literal tweens (what the Primitives would have emitted) ----
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#camera", { z: 0 }, { z: 350, duration: 3, ease: "power2.inOut" }, 0.5);
      tl.fromTo("#surface-a", { filter: "blur(0px)" }, { filter: "blur(10px)", duration: 1.5, ease: "power2.inOut" }, 1.5);
      tl.fromTo("#surface-b", { filter: "blur(10px)" }, { filter: "blur(0px)", duration: 1.5, ease: "power2.inOut" }, 1.5);
      window.__timelines["main"] = tl;
`;

// ---------------------------------------------------------------------------
// c-hybrid: camera is a native element tween (parser-friendly helper, as b3);
// only the derived value (DOF blur) is computed per frame from scene state.
const cHybrid = `
      // ---- Library ---------------------------------------------------------
      const DOF_K = 10 / 700;
      const focus = { depth: 0 }; // derived-value state: what depth is sharp
      const SURFACES = [
        { el: document.querySelector("#surface-a"), depth: 0 },
        { el: document.querySelector("#surface-b"), depth: -700 },
      ];
      function applyDepthOfField() {
        for (const s of SURFACES) {
          s.el.style.filter = "blur(" + DOF_K * Math.abs(s.depth - focus.depth) + "px)";
        }
      }
      function cameraPushIn(tl, to, at, duration, ease = "power2.inOut") {
        tl.fromTo("#camera", { z: 0 }, { z: to, duration: duration, ease: ease }, at);
      }
      function focusRack(tl, from, to, at, duration, ease = "power2.inOut") {
        tl.fromTo(focus, { depth: from }, { depth: to, duration: duration, ease: ease }, at);
      }

      // ---- Shot ------------------------------------------------------------
      const tl = gsap.timeline({ paused: true, onUpdate: applyDepthOfField });
      cameraPushIn(tl, 350, 0.5, 3);
      focusRack(tl, 0, -700, 1.5, 1.5);
      applyDepthOfField();
      window.__timelines["main"] = tl;
`;

const variants = [
  { id: "a-state", title: "Q1 a-state", surfaceTransformsInCss: false, script: aState },
  {
    id: "b-native", title: "Q1 b-native", surfaceTransformsInCss: true, script: bNative,
    extraHead: `\n    <script src="primitives.js"></script>`,
    files: { "primitives.js": bNativePrimitives },
  },
  { id: "b3-helpers", title: "Q1 b3-helpers", surfaceTransformsInCss: true, script: b3Helpers },
  { id: "b2-inline", title: "Q1 b2-inline", surfaceTransformsInCss: true, script: b2Inline },
  { id: "c-hybrid", title: "Q1 c-hybrid", surfaceTransformsInCss: true, script: cHybrid },
];

// Motion intent sidecar so check runs its motion audit (identical per variant).
const motion = {
  duration: 5,
  assertions: [
    { kind: "appearsBy", selector: "#surface-a", bySec: 0.5 },
    { kind: "staysInFrame", selector: "#surface-a" },
    { kind: "staysInFrame", selector: "#surface-b" },
    { kind: "keepsMoving", withinSelector: "#camera", maxStaticSec: 1.6 },
  ],
};

const only = process.argv.slice(2);
for (const v of variants) {
  if (only.length && !only.includes(v.id)) continue;
  const dir = join(spike, v.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page(v));
  writeFileSync(join(dir, "hyperframes.json"), hfJson);
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: `q1-${v.id}`, name: `q1-${v.id}` }, null, 2) + "\n");
  writeFileSync(join(dir, "index.motion.json"), JSON.stringify(motion, null, 2) + "\n");
  for (const [name, content] of Object.entries(v.files ?? {})) writeFileSync(join(dir, name), content);
  console.log("wrote", v.id);
}

// ---------------------------------------------------------------------------
// edit/: an Edit entry (host index.html) that mounts every variant as a Shot
// (sub-composition clip), to test Shot-level retiming in Studio. One template
// (b2-inline) is used twice. The host owns one literal Transition tween.
const shotTemplate = (v) => {
  const compId = `shot-${v.id}`;
  const tplCss = css(v.surfaceTransformsInCss)
    .replace(/\n\s*html, body \{[^}]*\}/, "")
    .replace("#root { position: relative; width: 100%; height: 100%;", "#root { position: absolute; inset: 0;")
    + `\n      .tag { position: absolute; left: 32px; bottom: 28px; font-size: 22px; color: #64748b; }`;
  const tplBody = body
    .replace(`data-composition-id="main" data-start="0" data-duration="5" `, `data-composition-id="${compId}" `)
    .replace(`<div id="viewport">`, `<div class="tag">${v.id}</div>\n      <div id="viewport">`);
  const script = v.script.replace(`window.__timelines["main"]`, `window.__timelines["${compId}"]`);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Shot template ${v.id}</title>
  </head>
  <body>
    <template>
    <style>${tplCss}
    </style>${tplBody}
    <script>${script}    </script>
    </template>
  </body>
</html>
`;
};

const shots = [
  { host: "shot-1", v: "a-state", start: 0 },
  { host: "shot-2", v: "b-native", start: 5 },
  { host: "shot-3", v: "b3-helpers", start: 10 },
  { host: "shot-4", v: "b2-inline", start: 15 },
  { host: "shot-5", v: "c-hybrid", start: 20 },
  { host: "shot-6", v: "b2-inline", start: 25 },
];
if (!only.length || only.includes("edit")) {
  const dir = join(spike, "edit");
  mkdirSync(join(dir, "compositions"), { recursive: true });
  mkdirSync(join(dir, "lib"), { recursive: true });
  for (const v of variants) writeFileSync(join(dir, "compositions", `${v.id}.html`), shotTemplate(v));
  writeFileSync(join(dir, "lib", "primitives.js"), bNativePrimitives);
  const hosts = shots
    .map((s, i) => `      <div id="${s.host}" class="clip" data-composition-id="shot-${s.v}" data-composition-src="compositions/${s.v}.html" data-start="${s.start}" data-duration="5" data-track-index="0" data-width="1920" data-height="1080"></div>`)
    .join("\n");
  writeFileSync(join(dir, "index.html"), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1920, height=1080">
    <title>Q1 Edit host</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <!-- Library copied into the project (ADR 0004); used by the b-native Shot. -->
    <script src="lib/primitives.js"></script>
    <style>
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #07090d; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="edit" data-start="0" data-duration="30" data-width="1920" data-height="1080">
${hosts}
    </div>
    <script>
      // Edit-owned Transition: fade shot-2 in over the cut (literal tween).
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#shot-2", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 5);
      window.__timelines["edit"] = tl;
    </script>
  </body>
</html>
`);
  writeFileSync(join(dir, "hyperframes.json"), hfJson);
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ id: "q1-edit", name: "q1-edit" }, null, 2) + "\n");
  console.log("wrote edit");
}
