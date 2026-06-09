import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BG = { r: 231, g: 232, b: 226 };
const TOL = 30;

async function removeBg(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const match = Math.abs(r - BG.r) <= TOL && Math.abs(g - BG.g) <= TOL && Math.abs(b - BG.b) <= TOL;
    const light = r > 220 && g > 220 && b > 215 && Math.max(r, g, b) - Math.min(r, g, b) < 20;
    if (match || light) data[i + 3] = 0;
  }
  await mkdir(output.split(/[/\\]/).slice(0, -1).join("/") || ".", { recursive: true });
  await sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toFile(output);
}

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const jobs = [
  ["logo-sinal-verde/logo-pagina-1.png", "src/assets/logo-sinal-verde.png"],
  ["logo-sinal-verde/logo-pagina-2.png", "src/assets/logo-sinal-verde-stacked.png"],
];

for (const [input, output] of jobs) {
  const inPath = `${root}/${input}`;
  const outPath = `${root}/${output}`;
  await removeBg(inPath, outPath);
  await removeBg(outPath, `${root}/public/logo-sinal-verde.png`);
  await removeBg(outPath, `${root}/logo-sinal-verde.png`);
  console.log("ok", output);
}
