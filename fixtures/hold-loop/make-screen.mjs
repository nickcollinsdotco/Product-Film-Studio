// Generates the fixture Screen: a synthetic 1440×2400 web page, no client material.
// Usage: node fixtures/hold-loop/make-screen.mjs
import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const W = 1440, H = 2400;
const out = join(dirname(fileURLToPath(import.meta.url)), "screens", "fixture.png");
const text = (x, y, size, fill, s, weight = 600) =>
  `<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${s}</text>`;
const cards = [0, 1, 2].map((i) => {
  const x = 120 + i * 410;
  return `<rect x="${x}" y="1080" width="380" height="460" rx="20" fill="#eef1f7"/>
    <rect x="${x + 30}" y="1110" width="320" height="200" rx="12" fill="${["#ff7a59", "#4361ee", "#2ec4b6"][i]}"/>
    ${text(x + 30, 1370, 32, "#101828", `Feature ${i + 1}`)}
    ${text(x + 30, 1420, 22, "#475467", "Small print to check type.", 400)}`;
}).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="88" fill="#101828"/>
  ${text(120, 56, 30, "#ffffff", "Fixture")}
  ${["Product", "Pricing", "Docs"].map((s, i) => text(980 + i * 130, 54, 22, "#d0d5dd", s, 400)).join("")}
  <rect x="0" y="88" width="${W}" height="820" fill="#f4f6fb"/>
  ${text(120, 380, 76, "#101828", "A synthetic Screen")}
  ${text(120, 470, 76, "#101828", "for the Loop Library.")}
  ${text(120, 560, 30, "#475467", "Generated, so the tool repo holds no client material.", 400)}
  <rect x="120" y="630" width="240" height="68" rx="34" fill="#4361ee"/>
  ${text(166, 674, 26, "#ffffff", "Get started")}
  <rect x="920" y="230" width="400" height="560" rx="28" fill="#4361ee" opacity="0.15"/>
  <rect x="970" y="290" width="300" height="440" rx="20" fill="#4361ee"/>
  ${text(120, 1010, 48, "#101828", "Three things it does")}
  ${cards}
  <rect x="0" y="1700" width="${W}" height="500" fill="#101828"/>
  ${text(120, 1900, 64, "#ffffff", "The bottom of the page")}
  <rect x="0" y="2200" width="${W}" height="200" fill="#0b1220"/>
  ${text(120, 2310, 22, "#98a2b3", "© Fixture", 400)}
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(out);
