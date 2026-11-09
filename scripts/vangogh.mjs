// Harita arka planındaki Van Gogh tablolarını hazırlar (npm run dev / build öncesi kendiliğinden çalışır).
// images/vangogh/<ad>.(jpg|png|webp) → src/assets/vangogh/<ad>.webp (genişlik en fazla 2000px; telefonda net kalsın)
// Hangi tablonun nerede duracağı: src/content/vangogh.ts
import { existsSync, statSync } from 'node:fs';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'images/vangogh';
const OUT = 'src/assets/vangogh';
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp']);

await mkdir(SRC, { recursive: true });
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => exts.has(parse(f).ext.toLowerCase()));
const wanted = new Set();
let made = 0;
for (const f of files) {
  const out = join(OUT, `${parse(f).name.toLowerCase()}.webp`);
  wanted.add(out);
  const src = join(SRC, f);
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) continue;
  // Harita bölümü dar ve uzun: tablo büyütülerek kırpılır, bu yüzden yüksek çözünürlük kalsın
  // trim: taramadaki koyu tuval kenarı gibi düz renkli çerçeveyi kırpar
  // ve kenarlardan %2 daha keser (tuvalin yıpranmış kenarı görünmesin)
  const { data: trimmed, info } = await sharp(src).rotate().trim({ threshold: 40 }).toBuffer({ resolveWithObject: true });
  const m = Math.round(Math.min(info.width, info.height) * 0.02);
  const clean = await sharp(trimmed).extract({ left: m, top: m, width: info.width - 2 * m, height: info.height - 2 * m }).toBuffer();
  await sharp(clean).resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toFile(out);
  made++;
}
for (const f of await readdir(OUT)) if (!wanted.has(join(OUT, f))) await rm(join(OUT, f));
console.log(`Van Gogh: ${files.length} tablo, ${made} dosya üretildi.`);
