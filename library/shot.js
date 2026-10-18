// Runs a Shot template inside HyperFrames: from its variables, the Project
// settings and the Loop's host clips, builds a paused timeline sized from its
// own host clip's duration, whose every update asks the Loop model for state and
// draws it. The template's own script passes in its variables and registers the
// timeline, because HyperFrames scopes __hyperframes and window.__timelines per
// mounted instance only inside that script.
// Exposed as window.Shot. Needs gsap, LoopModel, CssRenderer and ProjectSettings.
(function (root) {
  // Paths in variables are relative to the Project root. A path set at runtime
  // resolves against the entry's folder, so resolve it against this file's
  // folder instead (<project>/library/).
  const projectRoot = new URL("../", document.currentScript.src).href;

  // A mounted Shot's own root loses its timing attributes; its host clip keeps
  // them (loops ticket 05). Studio's live preview moves the value to
  // data-hf-authored-duration after init.
  function hostDuration(host, fallback) {
    return parseFloat(host.getAttribute("data-duration") || host.getAttribute("data-hf-authored-duration") || fallback);
  }

  // A Screen's Focus areas, from its sidecar <screen>.areas.json (loops ticket 09).
  // Read synchronously so the timeline is registered before the script returns.
  // Shared by every Shot that uses the Screen. No sidecar: only `whole`.
  const areasCache = {};
  function focusAreas(screenUrl) {
    const url = screenUrl.replace(/\.[^./]+$/, ".areas.json");
    if (!(url in areasCache)) {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      try { xhr.send(); } catch { /* no sidecar */ }
      areasCache[url] = xhr.status === 200 ? JSON.parse(xhr.responseText) : {};
    }
    return areasCache[url];
  }

  // The Loop's Shots, read from the host clips beside this one: template from the
  // clip's source, params from its variables, cut from the Edit's data-cut.
  // HyperFrames renames data-composition-src to data-composition-file on mount.
  const sourceOf = (c) => c.getAttribute("data-composition-src") || c.getAttribute("data-composition-file");
  function shotsOf(host) {
    const clips = [...host.parentElement.children].filter(sourceOf);
    return clips.map((c) => {
      const { screen: _s, screenWidth: _w, screenHeight: _h, ...params } = JSON.parse(c.getAttribute("data-variable-values") || "{}");
      return {
        template: sourceOf(c).split("/").pop().replace(/\.html$/, ""),
        start: parseFloat(c.getAttribute("data-start") || 0),
        duration: hostDuration(c, 4),
        params, cut: c.hasAttribute("data-cut"), host: c,
      };
    });
  }

  function run(el, v) {
    const host = el.parentElement;
    const size = (k) => parseFloat(host.getAttribute(k) || el.getAttribute(k));
    const frame = { width: size("data-width"), height: size("data-height") };
    const url = new URL(v.screen, projectRoot).href;
    const screen = { url, w: Number(v.screenWidth), h: Number(v.screenHeight), ...focusAreas(url) };
    // The Loop's own settings (data-settings on its entry root) override the Project's.
    const settings = root.ProjectSettings.resolve(JSON.parse(host.parentElement.getAttribute("data-settings") || "{}"));
    const shots = shotsOf(host);
    const planned = root.LoopModel.plan({ frame, screen, shots, deviceFrame: settings.deviceFrame, tilt: settings.tilt });
    const mine = planned.find((p) => p.shot.host === host);
    if (!mine) throw new Error("Shot: its host clip isn't among the Loop's Shot clips");

    const draw = root.CssRenderer.mount(el, { frame, screen, settings });
    const state = (t) => root.LoopModel.stateIn(mine, t);
    const tl = root.gsap.timeline({ paused: true, onUpdate: () => draw(state(tl.time())) });
    tl.to({}, { duration: mine.shot.duration }, 0);
    draw(state(0));
    return tl;
  }

  root.Shot = { run };
})(globalThis);
