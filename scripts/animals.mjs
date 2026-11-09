// Hayvan kulesi görselleri: tools/render-pets.html'in ürettiği art-src/renders/pet-*.png dosyalarını
// kırpar (şeffaf kenarlar), src/assets/animals/<ad>.png olarak yazar ve her biri için oturma ölçülerini hesaplar.
// Çıktıdaki satırları src/games/tower.js → ANIMALS dizisine yapıştırabilirsin.
//
// Kullanım: npm run animals
import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'art-src/renders';
const OUT = 'src/assets/animals';
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => /^pet-[\w-]+\.png$/.test(f)).sort();
if (!files.length) {
  console.log('art-src/renders/pet-*.png yok. Önce tools/render-pets.html sayfasını aç (npm run dev).');
  process.exit(0);
}

const lines = [];
for (const f of files) {
  const name = f.slice(4, -4);
  const trimmed = await sharp(join(SRC, f)).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = trimmed.info;
  const { data } = await sharp(trimmed.data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const solid = (x, y) => data[(y * w + x) * 4 + 3] > 128;

  // Gövde sütunları: opak yüksekliği en uzun sütunun %60'ından fazla olanlar (kanat, kol, kulak yanları elenir)
  const colH = Array.from({ length: w }, (_, x) => { let n = 0; for (let y = 0; y < h; y++) n += solid(x, y); return n; });
  const maxH = Math.max(...colH);
  const cols = colH.map((n, x) => (n >= maxH * 0.6 ? x : -1)).filter((x) => x >= 0);
  const left = cols[0], right = cols[cols.length - 1];
  const bodyW = right - left + 1;

  // Gövde üstü: gövde sütunlarının %85'inin dolu olduğu ilk satır (kulak, boynuz, anten bunun üstünde kalır)
  let top = 0;
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = left; x <= right; x++) n += solid(x, y);
    if (n >= bodyW * 0.85) { top = y; break; }
  }
  // Kamera hafif yukarıdan baktığı için üst yüz ince bir şerit; üstteki küpün ayakları bu şeridin ortasına basar
  const seat = Math.round(top + bodyW * 0.07);

  await sharp(trimmed.data).png({ palette: true, quality: 95, compressionLevel: 9 }).toFile(join(OUT, `${name}.png`));
  lines.push(`  { file: '${name}.png', seat: ${seat}, left: ${left}, right: ${w - 1 - right}, bottom: 0 }, // ${w}×${h}`);
}

console.log(`${files.length} hayvan → ${OUT}/\n`);
console.log(lines.join('\n'));
