// Saksı çiçeklerini art-src/flowers/*.{png,webp} görsellerinden keser.
// Her görsel aynı sahnenin 3 karesi: 1. kare boş saksı, 3. kare çiçeğin en son hali.
//  - Çiçek: 3. kare ile 1. kare arasındaki fark (arka plan iki karede de aynı)
//  - Saksı: 1. karede terakota/toprak renginden bulunur
// İkisinin birleşimi kesilir, büyük parçalar tutulur (kırıntılar atılır), kenarlar yumuşatılır.
// Çıktı: src/assets/flowers/<ad>.webp   Kullanım: node scripts/flowerpots.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'art-src/flowers';
const OUT = 'src/assets/flowers';
mkdirSync(OUT, { recursive: true });

// ---- Odaya uydurma ----
// Oda görseli yumuşak, pastel ve pembe perdeli; parlak çizgi film saksılar oraya yabancı duruyordu.
const lerp = (a, b, t) => a + (b - a) * t;
/** Terakota gövdeyi gölgelerini koruyarak pembe-krem seramiğe çevirir */
function ceramic(r, g, b) {
  const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
  const t = Math.max(0, Math.min(1, (lum - 0.18) / 0.42));
  const dark = [196, 128, 146], light = [252, 228, 234];
  return dark.map((d, k) => Math.round(lerp(d, light[k], t)));
}
/** Doygunluğu ve kontrastı biraz düşürür, odanın pembe-krem tonuna yaklaştırır */
function pastel(r, g, b) {
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  const sat = 0.8, mix = 0.14, tint = [253, 232, 236];
  return [r, g, b].map((v, k) => {
    let x = l + (v - l) * sat; // doygunluk
    x = 128 + (x - 128) * 0.9 + 10; // kontrast düşük, biraz aydınlık
    x = lerp(x, tint[k], mix); // pembe-krem perde
    return Math.max(0, Math.min(255, Math.round(x)));
  });
}

const FLOWERS = [
  ['nergis', 'nergis.png'],
  ['sakayik', 'sakayik.webp'],
  ['lale', 'lale.webp'],
  ['kasimpati', 'kasimpati.webp'],
  ['gul', 'gul.webp'],
];

for (const [name, file] of FLOWERS) {
  const { data: src, info } = await sharp(`${SRC}/${file}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const IW = info.width, IH = info.height;
  const at = (x, y) => (y * IW + x) * 3;
  const pw = Math.floor(IW / 3);

  // Karelerin tam hizası: üstteki bank bölgesinde en küçük farkı veren kaydırma
  const sad = (ox1, ox3) => {
    let s = 0;
    for (let y = Math.round(IH * 0.2); y < IH * 0.45; y += 3)
      for (let x = Math.round(pw * 0.05); x < pw * 0.3; x += 3) {
        const a = at(ox1 + x, y), b = at(ox3 + x, y);
        s += Math.abs(src[a] - src[b]) + Math.abs(src[a + 1] - src[b + 1]) + Math.abs(src[a + 2] - src[b + 2]);
      }
    return s;
  };
  let best = { s: Infinity, d: 0 };
  for (let d = -8; d <= 8; d++) { const s = sad(0, 2 * pw + d); if (s < best.s) best = { s, d }; }
  const o3 = 2 * pw + best.d;
  const W = pw - Math.abs(best.d) - 2, H = IH;

  const mask = new Uint8Array(W * H);
  /** saksı gövdesi (terakota): odaya uysun diye pembe-krem seramiğe boyanır */
  const body = new Uint8Array(W * H);
  const y0 = Math.round(H * 0.25), y1 = Math.round(H * 0.9);
  for (let y = y0; y < y1; y++) {
    for (let x = Math.round(W * 0.12); x < W * 0.98; x++) {
      const a = at(x, y), b = at(o3 + x, y);
      const d = Math.abs(src[a] - src[b]) + Math.abs(src[a + 1] - src[b + 1]) + Math.abs(src[a + 2] - src[b + 2]);
      // Saksı / toprak (1. karede): kırmızımsı kahve, yeşili düşük
      const r = src[a], g = src[a + 1], bl = src[a + 2];
      const pot = y > H * 0.55 && ((r - g > 50 && g < 125 && bl < 110) || (r > g && r < 140 && g < 95 && bl < 75 && r > 40));
      if (d > 60 || pot) mask[y * W + x] = 1;
      if (d <= 60 && y > H * 0.55 && r - g > 50 && g < 125 && bl < 110) body[y * W + x] = 1;
    }
  }
  // En büyük bağlı parça (çiçek + saksı) dışındakileri at
  const comp = new Int32Array(W * H).fill(-1);
  let bestN = 0, c = 0;
  const sizes = [];
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || comp[i] >= 0) continue;
    let n = 0; const st = [i]; comp[i] = c;
    while (st.length) {
      const k = st.pop(); n++;
      const x = k % W, y = (k / W) | 0;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (mask[j] && comp[j] < 0) { comp[j] = c; st.push(j); }
      }
    }
    sizes[c] = n;
    if (n > bestN) bestN = n;
    c++;
  }
  // Küçük delikleri doldur (yapraklar arası 1-2 piksellik boşluklar): kapanış
  const keep = new Uint8Array(W * H);
  // Büyük parçaları tut (çiçek ve saksı gövdesi ayrı parçalar olabilir), kırıntıları at
  for (let i = 0; i < W * H; i++) keep[i] = comp[i] >= 0 && sizes[comp[i]] > bestN * 0.05 ? 1 : 0;
  const closed = new Uint8Array(keep);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (keep[i]) continue;
    let n = keep[i - 1] + keep[i + 1] + keep[i - W] + keep[i + W];
    if (n >= 3) closed[i] = 1;
  }
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, b = at(o3 + x, y);
    let [R, G, B] = [src[b], src[b + 1], src[b + 2]];
    if (body[i]) [R, G, B] = ceramic(R, G, B);
    [R, G, B] = pastel(R, G, B);
    out[i * 4] = R; out[i * 4 + 1] = G; out[i * 4 + 2] = B;
    if (!closed[i]) continue;
    const edge = x > 0 && x < W - 1 && y > 0 && y < H - 1 && (!closed[i - 1] || !closed[i + 1] || !closed[i - W] || !closed[i + W]);
    out[i * 4 + 3] = edge ? 140 : 255;
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 })
    .resize({ height: 260, withoutEnlargement: true }).blur(0.45).webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/${name}.webp`);
  console.log(name, 'kaydırma', best.d);
}
console.log('Saksı çiçekleri → src/assets/flowers/');
