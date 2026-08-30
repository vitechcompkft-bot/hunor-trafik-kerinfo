// SVG → PNG: apple-touch-icon 180, PWA 192 + 512, favicon 32
import sharp from "sharp";
import fs from "fs";
import path from "path";

const svg = fs.readFileSync(path.resolve("public/icon.svg"));
const targets = [
  { size: 180, file: "public/apple-touch-icon.png" },
  { size: 192, file: "public/icon-192.png" },
  { size: 512, file: "public/icon-512.png" },
  { size: 32,  file: "public/favicon-32.png" },
  { size: 16,  file: "public/favicon-16.png" },
];
for (const t of targets) {
  await sharp(svg, { density: 400 }).resize(t.size, t.size).png({ compressionLevel: 9 }).toFile(t.file);
  console.log(`OK  ${t.file}  (${t.size}×${t.size})`);
}
