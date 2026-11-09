// Balık listesi: Balık tutma (fishing.js) ve Büyük balık ol (bigfish.js) bunu kullanır.
// Görseller src/assets/fish/ içindeki 16×16 piksel sprite sheet'lerden gelir. Tüm sprite'lar SOLA bakar.
//
// sheets: sprite sheet dosyaları. Yeni bir paket eklersen buraya bir satır ekle.
// FISH alanları:
//   id      kayıttaki anahtar (koleksiyon: ad + adet); değiştirirsen eski sayımlar o adla kalır
//   name    ekranda görünen ad
//   sheet   hangi sprite sheet;  col, row: sheet içindeki kare (0'dan başlar, 16 px'lik ızgara)
//   type    'fish' (balık) | 'shell' (kabuklu) | 'trash' (çöp) | 'special' (mektuplu şişe)
//   rarity  'common' | 'rare' | 'legendary' | 'special'
//   points  balık tutmada puan (çöpler eksi)
//   weight  çıkma sıklığı (büyük = sık)
//   speed   yüzme hızı çarpanı
//   rotate  true: sprite sheet'te 45° yatık çizilmiş balık, oyunda −45° döndürülüp yataya getirilir
//           (denizatı, deniz anası, ahtapot, şişe gibi dik duranlarda yazma)
//
// free-fish.png: Downloads/free fish paketi (9 sprite). extra.png: paketle gelmeyenler, scripts/fish-extra.mjs ile çizildi.

export const SPRITE = 16;

export const sheets = {
  free: new URL('../assets/fish/free-fish.png', import.meta.url).href,
  extra: new URL('../assets/fish/extra.png', import.meta.url).href,
};

export const FISH = [
  // Sıradan balıklar
  { id: 'alabalik', name: 'Gökkuşağı alabalığı', sheet: 'free', col: 0, row: 0, type: 'fish', rarity: 'common', points: 10, weight: 10, speed: 1, rotate: true },
  { id: 'beyaz', name: 'Beyaz balık', sheet: 'free', col: 1, row: 0, type: 'fish', rarity: 'common', points: 10, weight: 10, speed: 1, rotate: true },
  { id: 'gri', name: 'Gri balık', sheet: 'free', col: 0, row: 1, type: 'fish', rarity: 'common', points: 10, weight: 10, speed: 0.9, rotate: true },
  { id: 'japon', name: 'Japon balığı', sheet: 'free', col: 0, row: 2, type: 'fish', rarity: 'common', points: 10, weight: 8, speed: 1.1, rotate: true },
  { id: 'levrek', name: 'Levrek', sheet: 'free', col: 1, row: 2, type: 'fish', rarity: 'common', points: 10, weight: 9, speed: 1, rotate: true },
  { id: 'sardalya', name: 'Sardalya', sheet: 'free', col: 2, row: 2, type: 'fish', rarity: 'common', points: 10, weight: 10, speed: 1.2, rotate: true },
  // Kabuklular
  { id: 'istiridye', name: 'İstiridye', sheet: 'free', col: 1, row: 1, type: 'shell', rarity: 'common', points: 15, weight: 4, speed: 0.5 },
  { id: 'yengec', name: 'Yengeç', sheet: 'free', col: 2, row: 1, type: 'shell', rarity: 'common', points: 15, weight: 4, speed: 0.6 },
  // Nadirler
  { id: 'denizati', name: 'Denizatı', sheet: 'extra', col: 0, row: 0, type: 'fish', rarity: 'rare', points: 30, weight: 2, speed: 1.6 },
  { id: 'ahtapot', name: 'Ahtapot', sheet: 'extra', col: 1, row: 0, type: 'fish', rarity: 'rare', points: 30, weight: 2, speed: 1.5 },
  { id: 'denizanasi', name: 'Deniz anası', sheet: 'extra', col: 2, row: 0, type: 'fish', rarity: 'rare', points: 30, weight: 2, speed: 1.4 },
  { id: 'palyaco', name: 'Palyaço balığı', sheet: 'extra', col: 3, row: 0, type: 'fish', rarity: 'rare', points: 30, weight: 2, speed: 1.7 },
  // Efsanevi
  { id: 'efsane', name: 'Efsanevi pembe balık', sheet: 'extra', col: 4, row: 0, type: 'fish', rarity: 'legendary', points: 50, weight: 0.5, speed: 2 },
  // Çöpler
  { id: 'yosun', name: 'Yosun', sheet: 'free', col: 2, row: 0, type: 'trash', rarity: 'common', points: -15, weight: 3, speed: 0.5 },
  { id: 'sise', name: 'Şişe', sheet: 'extra', col: 5, row: 0, type: 'trash', rarity: 'common', points: -15, weight: 4, speed: 0.6 },
  { id: 'kutu', name: 'Kutu', sheet: 'extra', col: 6, row: 0, type: 'trash', rarity: 'common', points: -15, weight: 4, speed: 0.6 },
  // Özel: mektuplu şişe (notlar: src/content/bottle-notes.ts)
  { id: 'mektup', name: 'Şişede mektup', sheet: 'extra', col: 7, row: 0, type: 'special', rarity: 'special', points: 0, weight: 0.6, speed: 0.7 },
];

/** Sprite sheet görsellerini yükler: { free: Image, extra: Image } */
export async function loadSheets() {
  const out = {};
  await Promise.all(Object.entries(sheets).map(([k, src]) => new Promise((ok) => {
    const img = new Image();
    img.onload = img.onerror = () => { out[k] = img; ok(); };
    img.src = src;
  })));
  return out;
}

/**
 * Bir balığı çizer. size: CSS px (kare). Piksel net kalsın diye cihaz pikselinde 16'nın tam katına yuvarlanır.
 * flip: true → sağa bakar. Dönüş: gerçekte çizilen boyut (CSS px).
 */
export function drawFish(ctx, imgs, f, cx, cy, size, dpr, flip = false) {
  const scale = Math.max(1, Math.round((size * dpr) / SPRITE));
  const s = (scale * SPRITE) / dpr;
  const img = imgs[f.sheet];
  if (!img?.naturalWidth) return s;
  ctx.save();
  // Merkez cihaz pikseline hizalı; önce döndür (yatık sprite → yatay), sonra yüzme yönüne göre aynala
  ctx.translate(Math.round(cx * dpr) / dpr, Math.round(cy * dpr) / dpr);
  if (flip) ctx.scale(-1, 1);
  if (f.rotate) ctx.rotate(-Math.PI / 4);
  ctx.imageSmoothingEnabled = false;
  // Döndürünce komşu sprite'ın kenar pikselleri sızmasın diye tek sprite'lık, kenarı boş kopyadan çiz
  const pad = (s / SPRITE) * PAD;
  ctx.drawImage(spriteCanvas(img, f), -s / 2 - pad, -s / 2 - pad, s + pad * 2, s + pad * 2);
  ctx.restore();
  return s;
}

const PAD = 1;
const cutCache = new WeakMap();
/** Sheet'ten tek bir sprite'ı 1 piksel şeffaf kenarlı ayrı bir tuvale keser (önbellekli) */
export function spriteCanvas(img, f) {
  let m = cutCache.get(img);
  if (!m) cutCache.set(img, (m = new Map()));
  const key = `${f.col},${f.row}`;
  let c = m.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = SPRITE + PAD * 2;
    c.getContext('2d').drawImage(img, f.col * SPRITE, f.row * SPRITE, SPRITE, SPRITE, PAD, PAD, SPRITE, SPRITE);
    m.set(key, c);
  }
  return c;
}
