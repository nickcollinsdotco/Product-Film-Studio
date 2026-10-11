// Runs a Shot template inside HyperFrames: from its variables, the Project
// settings and its host clip's size and duration, builds a paused timeline
// whose every update asks the Loop model for state and draws it. The template's
// own script passes in its variables and registers the timeline, because
// HyperFrames scopes __hyperframes and window.__timelines per mounted instance
// only inside that script.
// Exposed as window.Shot. Needs gsap, LoopModel, CssRenderer and ProjectSettings.
(function (root) {
  // Paths in variables are relative to the Project root. A path set at runtime
  // resolves against the entry's folder, so resolve it against this file's
  // folder instead (<project>/library/).
  const projectRoot = new URL("../", document.currentScript.src).href;

  // A mounted Shot's own root loses its timing attributes; its host clip keeps
  // them (loops ticket 05). Studio's live preview moves the value to
  // data-hf-authored-duration after init.
  function shotDuration(el, fallback) {
    const host = el.parentElement;
    const d = host && (host.getAttribute("data-duration") || host.getAttribute("data-hf-authored-duration"));
    return parseFloat(d || el.getAttribute("data-duration") || fallback);
  }

  function run(el, template, v) {
    const host = el.parentElement;
    const size = (k) => parseFloat(host.getAttribute(k) || el.getAttribute(k));
    const frame = { width: size("data-width"), height: size("data-height") };
    const screen = { url: new URL(v.screen, projectRoot).href, w: Number(v.screenWidth), h: Number(v.screenHeight) };
    const settings = root.ProjectSettings.resolve();
    const { screen: _s, screenWidth: _w, screenHeight: _h, ...params } = v;
    const shot = { template, start: 0, duration: shotDuration(el, 4), params };

    const draw = root.CssRenderer.mount(el, { frame, screen, settings });
    const state = (t) => root.LoopModel.shotState(shot, t, frame, screen);
    const tl = root.gsap.timeline({ paused: true, onUpdate: () => draw(state(tl.time())) });
    tl.to({}, { duration: shot.duration }, 0);
    draw(state(0));
    return tl;
  }

  root.Shot = { run, shotDuration };
})(globalThis);
