// Project settings loader. A Loop entry loads the Project's project-settings.js
// (which sets window.PROJECT_SETTINGS) and then this file, both as plain scripts,
// so settings are ready before any Shot runs. primaryFrameSize is the Project's
// default: a Loop's own primary Frame size is its entry root's size, which
// Claude writes from it. A Loop overrides any other setting with data-settings
// (JSON) on its entry root. Exposed as window.ProjectSettings.
(function (root) {
  const KEYS = ["brandColour", "deviceFrame", "primaryFrameSize"];
  const BACKDROPS = ["brand", "void", "backlight"];

  // The Default theme's Backdrop: brand colour when the brand colour is strong,
  // otherwise Backlight. Strong means colourful: its chroma (the spread of its
  // RGB channels) is at least a quarter, so greys, near-whites and near-blacks
  // aren't.
  function defaultBackdrop(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    const rgb = [n >> 16 & 255, n >> 8 & 255, n & 255];
    return (Math.max(...rgb) - Math.min(...rgb)) / 255 >= 0.25 ? "brand" : "backlight";
  }

  function resolve(overrides = {}) {
    const project = root.PROJECT_SETTINGS;
    if (!project) throw new Error("Project settings not loaded: include project-settings.js before the Library");
    const settings = { ...project, ...overrides };
    const missing = KEYS.filter((k) => settings[k] == null);
    if (missing.length) throw new Error(`Project settings missing: ${missing.join(", ")}`);
    settings.backdrop ??= defaultBackdrop(settings.brandColour);
    if (!BACKDROPS.includes(settings.backdrop)) throw new Error(`Backdrop "${settings.backdrop}" isn't supported: use ${BACKDROPS.join(", ")}`);
    return settings;
  }

  root.ProjectSettings = { resolve };
})(globalThis);
