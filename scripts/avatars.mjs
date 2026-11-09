// Avatar katmanlarını hazırlar: paketten parçaları seçer, kıyafetleri boyar, birleştirir,
// ortak bir çerçeveye kırpar ve src/assets/avatars/<kim>/ içine WebP olarak yazar.
// Tarif: scripts/avatar-recipe.mjs   ·   Çalıştır: npm run avatars
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { faces, people } from './avatar-recipe.mjs';

const PACK = 'art-src/avatar-pack/';
const OUT = 'src/assets/avatars/';
const W = 444, H = 700;
// Tüm katmanlar için ortak kırpma (şapka + at kuyruğu + ayaklar sığar)
const CROP = { left: 36, top: 30, width: 344, height: 642 };

const colorDir = { top: 'top/colors', bottom: 'bottom/color', dress: 'dress/COLORS', shoes: 'shoes/COLOR' };

const blank = () => sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
const file = (p) => {
  if (!existsSync(PACK + p)) throw new Error(`Paket dosyası yok: ${p}`);
  return PACK + p;
};

async function compose(layers) {
  const bufs = [];
  for (const l of layers) bufs.push({ input: typeof l === 'string' && !l.startsWith(PACK) ? file(l) : l, top: 0, left: 0 });
  return blank().composite(bufs).png().toBuffer();
}

async function write(buf, path) {
  await sharp(buf).extract(CROP).webp({ quality: 90, alphaQuality: 100 }).toFile(OUT + path);
}

const svg = (inner) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`);

const shadow = svg(`<ellipse cx="222" cy="664" rx="92" ry="12" fill="#5a3d4a" opacity=".14"/>`);
const closedEyes = svg(`
  <path d="M200 306 Q222 322 246 306" stroke="#3b2a30" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M279 298 Q294 310 311 297" stroke="#3b2a30" stroke-width="4.5" fill="none" stroke-linecap="round"/>`);
const zzz = svg(`<text x="330" y="150" font-size="40" font-family="sans-serif" font-weight="700" fill="#5a3d4a" opacity=".7">z</text>
  <text x="356" y="112" font-size="28" font-family="sans-serif" font-weight="700" fill="#5a3d4a" opacity=".5">z</text>`);
const stethoscope = svg(`
  <path d="M203 380 Q200 432 236 444 Q266 432 258 382" stroke="#7d93ad" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="236" cy="448" r="9" fill="#d5e0ec" stroke="#7d93ad" stroke-width="4"/>`);
// Parti şapkası: tabanı saçın tepesine oturur (iki karakterde de havada durmasın)
const partyHat = svg(`
  <g transform="rotate(14 272 160)">
    <polygon points="236,166 308,166 272,84" fill="#ffb7c5" stroke="#e98aa0" stroke-width="2"/>
    <path d="M250 138 L294 138 M260 112 L284 112" stroke="#fff" stroke-width="7"/>
    <circle cx="272" cy="84" r="10" fill="#ffd36e"/>
  </g>`);

async function buildPerson(who, p) {
  const dir = `${OUT}${who}/`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const c = p.hairColor ?? '';
  // Saç tonu ince ayarı (ör. { brightness: 0.95, saturation: 0.6 }) — paketteki 8 rengin arası için
  const hairPart = async (path) => (p.hairModulate ? sharp(file(path)).modulate(p.hairModulate).png().toBuffer() : path);

  // arka saç (+ arkada duran at kuyruğu/topuz)
  const back = [await hairPart(`hair_back/COLOR/${p.hairBack}${c}.png`)];
  if (p.hairBonus && p.bonusBehind) back.push(await hairPart(`hair_bonus/COLOR/${p.hairBonus}${c}.png`));
  await write(await compose(back), `${who}/hair-back.webp`);

  // gövde + gölge
  await write(await compose([shadow, `body/${p.body}.png`]), `${who}/base.webp`);

  // ön saç
  const front = [await hairPart(`hair/COLOR/${p.hair}${c}.png`)];
  if (p.bangs) front.push(await hairPart(`bangs/COLOR/${p.bangs}${c}.png`));
  if (p.hairBonus && !p.bonusBehind) front.push(await hairPart(`hair_bonus/COLOR/${p.hairBonus}${c}.png`));
  await write(await compose(front), `${who}/hair.webp`);

  // yüz ifadeleri
  for (const [mood, f] of Object.entries(faces)) {
    const parts = f.closedEyes
      ? [closedEyes, `EYEBROWS/${f.brows}.png`, `MOUTH/${f.mouth}.png`, ...(f.zzz ? [zzz] : [])]
      : [`PUPILS/${p.eyes}.png`, `EYELASHES/${f.lashes ?? p.lashes}.png`, `EYEBROWS/${f.brows}.png`, `MOUTH/${f.mouth}.png`];
    await write(await compose(parts), `${who}/face-${mood}.webp`);
  }

  console.log(`✓ ${who}`);
}

/**
 * Gardırop: her kıyafet parçası ayrı katman (iki kişiye de aynı oturur, gövde kalıbı ortak).
 * Paketteki her numara İKİ ayrı kıyafet: "9" ana klasörden, "9c" renkli klasörden.
 * Renk oyun içinde (CSS multiply) verilir; burada boyanmaz.
 */
async function buildWardrobe() {
  const dir = `${OUT}wardrobe/`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  let n = 0;
  for (const kind of Object.keys(colorDir)) {
    for (const [folder, suffix] of [[kind, ''], [colorDir[kind], 'c']]) {
      const { readdir } = await import('node:fs/promises');
      for (const f of await readdir(PACK + folder)) {
        const m = f.match(/^(\d+)\.png$/);
        if (!m) continue;
        await write(await compose([`${folder}/${f}`]), `wardrobe/${kind}-${m[1]}${suffix}.webp`);
        n++;
      }
    }
  }
  await write(await compose([stethoscope]), 'wardrobe/acc-stethoscope.webp');
  await write(await compose([partyHat]), 'wardrobe/acc-partyhat.webp');
  console.log(`✓ gardırop: ${n} parça + 2 aksesuar`);
}

await mkdir(OUT, { recursive: true });
for (const [who, p] of Object.entries(people)) await buildPerson(who, p);
await buildWardrobe();
// Oyun karakter kutusunun oranını buradan okur (src/theme/avatars.ts)
await writeFile(`${OUT}meta.json`, JSON.stringify({ width: CROP.width, height: CROP.height }) + '\n');
console.log(`Oran (yükseklik/genişlik): ${(CROP.height / CROP.width).toFixed(3)}`);
