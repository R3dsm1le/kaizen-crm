/**
 * Generates the PWA/app icons from one inline SVG.
 * Pure vector shapes — no font dependency, renders identically everywhere.
 * Run: node scripts/make-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Minimal "kaizen" mark: brand rounded square, rising steps (continuous improvement).
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5B67E6"/>
      <stop offset="1" stop-color="#3F4BD8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <g fill="#FFFFFF">
    <rect x="118" y="300" width="88" height="94" rx="16"/>
    <rect x="212" y="222" width="88" height="172" rx="16" opacity="0.85"/>
    <rect x="306" y="118" width="88" height="276" rx="16"/>
  </g>
</svg>`;

const publicDir = path.join(process.cwd(), "public");
fs.mkdirSync(publicDir, { recursive: true });

const render = (size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
const [i192, i512, i180] = await Promise.all([render(192), render(512), render(180)]);

fs.writeFileSync(path.join(publicDir, "icon-192.png"), i192);
fs.writeFileSync(path.join(publicDir, "icon-512.png"), i512);
fs.writeFileSync(path.join(publicDir, "apple-icon.png"), i180);

console.log("Icons written: public/icon-192.png, public/icon-512.png, public/apple-icon.png");
