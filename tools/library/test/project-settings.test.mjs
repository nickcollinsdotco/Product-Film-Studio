// Project settings: the default Backdrop follows the Product brand colour.
import { test } from "node:test";
import assert from "node:assert/strict";
import "../../../library/project-settings.js";

const { resolve } = globalThis.ProjectSettings;
const project = { brandColour: "#ff7a59", deviceFrame: "browser", primaryFrameSize: "Landscape" };
const resolveWith = (settings, overrides) => {
  globalThis.PROJECT_SETTINGS = settings;
  try { return resolve(overrides); } finally { delete globalThis.PROJECT_SETTINGS; }
};

test("a strong brand colour defaults to the brand-colour Backdrop; a weak one to Backlight", () => {
  const backdrop = (brandColour) => resolveWith({ ...project, brandColour }).backdrop;
  for (const c of ["#ff7a59", "#1d3fd6", "#0f766e", "#e11d48"]) assert.equal(backdrop(c), "brand", c);
  for (const c of ["#ffffff", "#0e1116", "#f3f1ec", "#808080", "#000000"]) assert.equal(backdrop(c), "backlight", c);
});

test("the Backdrop defaults when a Project leaves it out, and a Project's choice stands", () => {
  assert.equal(resolveWith(project).backdrop, "brand");
  assert.equal(resolveWith({ ...project, brandColour: "#0e1116" }).backdrop, "backlight");
  assert.equal(resolveWith({ ...project, backdrop: "void" }).backdrop, "void");
});

test("a Loop overrides Project settings", () => {
  const s = resolveWith({ ...project, backdrop: "brand" }, { backdrop: "backlight", deviceFrame: "none" });
  assert.equal(s.backdrop, "backlight");
  assert.equal(s.deviceFrame, "none");
});

test("an unknown Backdrop is rejected", () => {
  assert.throws(() => resolveWith({ ...project, backdrop: "studio" }), /Backdrop "studio"/);
});
