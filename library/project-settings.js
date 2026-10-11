// Project settings loader. A Loop entry loads the Project's project-settings.js
// (which sets window.PROJECT_SETTINGS) and then this file, both as plain scripts,
// so settings are ready before any Shot runs. primaryFrameSize is the Project's
// default: a Loop's own primary Frame size is its entry root's size, which
// Claude writes from it. Exposed as window.ProjectSettings.
(function (root) {
  const KEYS = ["brandColour", "backdrop", "deviceFrame", "primaryFrameSize"];

  function resolve() {
    const project = root.PROJECT_SETTINGS;
    if (!project) throw new Error("Project settings not loaded: include project-settings.js before the Library");
    const missing = KEYS.filter((k) => project[k] == null);
    if (missing.length) throw new Error(`Project settings missing: ${missing.join(", ")}`);
    return { ...project };
  }

  root.ProjectSettings = { resolve };
})(globalThis);
