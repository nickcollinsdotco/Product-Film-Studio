// Generates the fixture Screens, synthetic web pages with no client material:
// fixture.png (desktop, 1440×2400) and fixture-mobile.png (a phone page, 390 px
// layout width at 3x, for the phone Device frame).
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

// The phone page, drawn at 1x (390 wide) and rendered at 3x.
const MW = 390, MH = 2600, MS = 3;
const mobileOut = join(dirname(out), "fixture-mobile.png");
const mobileCards = [0, 1, 2].map((i) => {
  const y = 980 + i * 380;
  return `<rect x="20" y="${y}" width="350" height="350" rx="16" fill="#eef1f7"/>
    <rect x="36" y="${y + 16}" width="318" height="220" rx="10" fill="${["#ff7a59", "#4361ee", "#2ec4b6"][i]}"/>
    ${text(36, y + 280, 24, "#101828", `Feature ${i + 1}`)}
    ${text(36, y + 316, 15, "#475467", "Small print to check type.", 400)}`;
}).join("");
const mobile = `<svg xmlns="http://www.w3.org/2000/svg" width="${MW * MS}" height="${MH * MS}" viewBox="0 0 ${MW} ${MH}">
  <rect width="${MW}" height="${MH}" fill="#ffffff"/>
  <rect width="${MW}" height="64" fill="#101828"/>
  ${text(20, 41, 22, "#ffffff", "Fixture")}
  ${[0, 1, 2].map((i) => `<rect x="${336}" y="${22 + i * 8}" width="34" height="3" rx="1.5" fill="#d0d5dd"/>`).join("")}
  <rect x="0" y="64" width="${MW}" height="760" fill="#f4f6fb"/>
  ${text(20, 150, 40, "#101828", "A synthetic")}
  ${text(20, 198, 40, "#101828", "phone Screen.")}
  ${text(20, 240, 17, "#475467", "Generated, so the tool repo holds", 400)}
  ${text(20, 264, 17, "#475467", "no client material.", 400)}
  <rect x="20" y="296" width="170" height="52" rx="26" fill="#4361ee"/>
  ${text(48, 329, 18, "#ffffff", "Get started")}
  <rect x="20" y="380" width="350" height="400" rx="22" fill="#4361ee" opacity="0.15"/>
  <rect x="56" y="420" width="278" height="320" rx="16" fill="#4361ee"/>
  ${text(20, 920, 30, "#101828", "Three things it does")}
  ${mobileCards}
  <rect x="0" y="2120" width="${MW}" height="360" fill="#101828"/>
  ${text(20, 2240, 34, "#ffffff", "The bottom")}
  ${text(20, 2284, 34, "#ffffff", "of the page")}
  <rect x="0" y="2480" width="${MW}" height="120" fill="#0b1220"/>
  ${text(20, 2546, 15, "#98a2b3", "© Fixture", 400)}
</svg>`;
await sharp(Buffer.from(mobile)).png().toFile(mobileOut);
console.log(mobileOut);
