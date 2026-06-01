// Genera los iconos PWA (192 y 512) a partir de un SVG con sharp.
// Uso: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");

function svg(size) {
  const r = Math.round(size * 0.22);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16a34a"/>
      <stop offset="1" stop-color="#15803d"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${r}" fill="url(#bg)"/>
  <!-- Aguacate -->
  <g transform="translate(256 268)">
    <ellipse cx="0" cy="0" rx="118" ry="150" fill="#e9f7ef"/>
    <ellipse cx="0" cy="0" rx="92" ry="122" fill="#bfe9cf"/>
    <ellipse cx="0" cy="22" rx="54" ry="64" fill="#7a4a1e"/>
  </g>
  <!-- Linea de escaneo -->
  <rect x="96" y="250" width="320" height="14" rx="7" fill="#ffffff" opacity="0.9"/>
</svg>`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const size of [192, 512]) {
    const png = await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toBuffer();
    await writeFile(join(outDir, `icon-${size}.png`), png);
    console.log(`icon-${size}.png generado`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
