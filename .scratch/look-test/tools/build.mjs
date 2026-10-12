// PROTOTYPE: writes index.html for one look-test variant at one size.
// Usage: node tools/build.mjs <v1-css|v2-three> <width>   (height = width * 3/4)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [variant = "v2-three", w = "1600", overrides = ""] = process.argv.slice(2);
const W = Number(w), H = Math.round((W * 3) / 4);
const html = readFileSync(join(root, "templates", `${variant}.template.html`), "utf8")
  .replaceAll("__W__", String(W)).replaceAll("__H__", String(H))
  .replace("<body>", overrides ? `<body>
    <script>window.__lookOverrides = ${overrides};</script>` : "<body>");
writeFileSync(join(root, "index.html"), html);
console.log(`index.html <- ${variant} ${W}x${H} ${overrides}`);
